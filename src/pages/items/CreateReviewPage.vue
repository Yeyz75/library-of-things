<template>
  <AppLayout>
    <div class="container py-8">
      <div class="max-w-2xl mx-auto">
        <div class="mb-8">
          <button @click="router.back()" class="btn-secondary mb-4">
            <ArrowLeftIcon class="h-4 w-4 mr-2" />
            {{ t('common.back') }}
          </button>

          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">
            {{
              existingReview
                ? t('reviews.edit.title')
                : t('reviews.create.title')
            }}
          </h1>
          <p class="text-gray-600 dark:text-gray-300 mt-2">
            {{ t('reviews.create.subtitle') }}
          </p>
        </div>

        <div v-if="!isReady" class="card p-8">
          <BaseLoader size="lg" center />
        </div>

        <div v-else-if="error" class="card p-8">
          <div class="text-center">
            <div
              class="bg-error-50 text-error-600 p-8 rounded-lg max-w-md mx-auto"
            >
              <h2 class="text-lg font-medium mb-2">
                {{ t('reviews.errors.loadFailed') }}
              </h2>
              <p class="text-sm mb-4">{{ error }}</p>
              <button @click="loadData" class="btn-primary">
                {{ t('common.retry') }}
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="item && reservation" class="card p-6">
          <!-- Item preview -->
          <div
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
              >
                <img
                  v-if="item.imageUrls?.[0]"
                  :src="item.imageUrls[0]"
                  :alt="item.title"
                  class="w-full h-full object-cover"
                />
                <PhotoIcon v-else class="w-full h-full p-4 text-gray-400" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                  {{ item.title }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{
                    t('reviews.create.borrowedOn', {
                      date: formatDate(reservation.startDate || ''),
                    })
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Review form -->
          <CreateReviewForm
            v-if="reservation && reservation.$id"
            :reservation-id="reservation.$id"
            :item-id="item.$id"
            :reviewer-id="userId || ''"
            :reviewed-user-id="getReviewedUserId()"
            :review-type="getReviewType()"
            :existing-review="existingReview"
            @submit="handleSubmit"
            @cancel="router.back()"
          />
        </div>

        <div v-else class="card p-8">
          <div class="text-center">
            <div
              class="bg-error-50 text-error-600 p-8 rounded-lg max-w-md mx-auto"
            >
              <h2 class="text-lg font-medium mb-2">
                {{ t('reviews.errors.invalidRequest') }}
              </h2>
              <p class="text-sm mb-4">{{ t('reviews.errors.missingData') }}</p>
              <router-link to="/" class="btn-primary">
                {{ t('common.home') }}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import CreateReviewForm from '@/components/reviews/CreateReviewForm.vue';
import { useAuthStore } from '@/store/auth.store';
import { useItemsStore } from '@/store/items.store';
import { useReservationsStore } from '@/store/reservations.store';
import { useReviews } from '@/composables/useReviews';
import { show } from '@/api/reviews';
import { reviewFormatter } from '@/utils/reviewFormatter';
import { storeToRefs } from 'pinia';
import { useI18n } from '@/composables/useI18n';
import type { ReviewModel, CreateReviewDataModel } from '@/types/models';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const itemsStore = useItemsStore();
const reservationsStore = useReservationsStore();
const { createReview, updateReview } = useReviews();

const { userId } = storeToRefs(authStore);
const { t } = useI18n();

const loadingReview = ref(false);
const error = ref('');
const existingReview = ref<ReviewModel | null>(null);

const item = computed(() => itemsStore.currentItem);
const reservation = computed(() => {
  const reservationId = route.query.reservationId as string;
  return reservationsStore.reservations.find((r) => r.$id === reservationId);
});

const isReady = computed(() => {
  const reviewId = route.query.reviewId as string | undefined;
  if (reviewId) {
    return Boolean(item.value && reservation.value && existingReview.value);
  }
  return Boolean(item.value && reservation.value);
});

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getReviewType = (): 'borrower_to_owner' | 'owner_to_borrower' => {
  // For now, we only support borrower to owner reviews
  return 'borrower_to_owner';
};

const getReviewedUserId = (): string => {
  if (!item.value) return '';
  return item.value.ownerId || '';
};

// Load review by ID directly from the API
const loadReviewById = async (reviewId: string) => {
  const response = await show(reviewId);
  if (response.success && response.data) {
    // Inferir el tipo que espera formatReview y castear response.data a ese tipo
    type RawReview = Parameters<typeof reviewFormatter.formatReview>[0];
    existingReview.value = reviewFormatter.formatReview(
      response.data as RawReview
    );
  } else {
    existingReview.value = null;
    error.value = response.error || 'No se pudo cargar la reseña';
  }
};

const loadData = async () => {
  try {
    error.value = '';
    const itemId = route.params.id as string;
    const reservationId = route.query.reservationId as string;
    const reviewId = route.query.reviewId as string;

    if (!itemId || !reservationId) {
      error.value = 'Missing required parameters';
      return;
    }

    // Load item
    await itemsStore.fetchItemById(itemId);

    // Load reservation
    await reservationsStore.fetchReservationById(reservationId);

    // Load existing review if editing
    if (reviewId) {
      loadingReview.value = true;
      await loadReviewById(reviewId);
      loadingReview.value = false;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load data';
  }
};

const handleSubmit = async (reviewData: CreateReviewDataModel) => {
  try {
    let result;

    if (existingReview.value) {
      result = await updateReview(existingReview.value.$id, reviewData);
    } else {
      result = await createReview(reviewData);
    }

    if (result) {
      // Redirect to item page with success message
      router.push({
        name: 'ItemDetail',
        params: { id: reviewData.itemId },
        query: { reviewSuccess: 'true' },
      });
    }
  } catch (err) {
    console.error('Error submitting review:', err);
    // TODO: Show error message to user
  }
};

onMounted(() => {
  loadData();
});
</script>
