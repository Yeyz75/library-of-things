<template>
  <AppLayout>
    <div v-if="itemsStore.isLoading" class="container py-16">
      <BaseLoader size="lg" text="Loading item..." center />
    </div>

    <div v-else-if="itemsStore.error" class="container py-16">
      <div class="text-center">
        <div class="bg-error-50 text-error-600 p-8 rounded-lg max-w-md mx-auto">
          <h2 class="text-lg font-medium mb-2">Item not found</h2>
          <p class="text-sm mb-4">{{ itemsStore.error }}</p>
          <router-link to="/" class="btn-primary">Browse Items</router-link>
        </div>
      </div>
    </div>

    <div v-else-if="currentItem" class="container py-8">
      <!-- Use the new ArticleDetailView component -->
      <ArticleDetailView
        :item="currentItem"
        :categories="categoryOptions"
        :currentUserId="userId"
        @reserve="showReserveModal = true"
        @share="handleShare"
        @contact="handleContact"
        @delete="showDeleteModal = true"
      />

      <!-- Reviews Section -->
      <div class="mt-8">
        <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {{ $t('reviews.title') }}
            </h2>
            <div class="flex items-center space-x-4">
              <div
                v-if="currentItem.averageRating"
                class="flex items-center space-x-2"
              >
                <StarRating
                  :rating="currentItem.averageRating"
                  :review-count="currentItem.totalReviews"
                  :show-text="true"
                />
              </div>
              <router-link
                v-if="canLeaveReview"
                :to="{
                  name: 'CreateReview',
                  params: { id: currentItem.$id },
                  query: {
                    reservationId: completedReservation?.$id,
                    reviewId: existingReview?.$id,
                  },
                }"
                class="btn-secondary"
              >
                <PlusIcon v-if="!existingReview" class="h-4 w-4 mr-2" />
                <PencilIcon v-else class="h-4 w-4 mr-2" />
                {{ reviewButtonText }}
              </router-link>
            </div>
          </div>

          <!-- Reviews List with Pagination -->
          <ReviewsList
            v-if="currentItem"
            :item-id="currentItem.$id"
            :show-item-info="false"
            :show-sort-options="true"
            :show-page-size-selector="true"
            :initial-page-size="5"
            :pagination-size="'md'"
            @photo-click="handleReviewPhotoClick"
            @review-updated="handleReviewUpdated"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { PencilIcon, PlusIcon } from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import ArticleDetailView from '@/components/common/ArticleDetailView.vue';
import ReviewsList from '@/components/reviews/ReviewsList.vue';
import StarRating from '@/components/reviews/StarRating.vue';
import { useAuthStore } from '@/store/auth.store';
import { useItemsStore } from '@/store/items.store';
import { useReviews } from '@/composables/useReviews';
import { useReservationsStore } from '@/store/reservations.store';
import { storeToRefs } from 'pinia';
import { useI18n } from '@/composables/useI18n';
import type { ReviewModel as Review, ItemCategoryModel } from '@/types/models';

const route = useRoute();
const authStore = useAuthStore();
const itemsStore = useItemsStore();
const reservationsStore = useReservationsStore();
const { getExistingReview } = useReviews();

const { isAuthenticated, userId } = storeToRefs(authStore);

const showReserveModal = ref(false);
const showDeleteModal = ref(false);
// Reviews are now handled by ReviewsList component
const existingReview = ref<Review | null>(null);

const currentItem = computed(() => itemsStore.currentItem);

const isOwner = computed(() => {
  return userId.value && currentItem.value?.ownerId === userId.value;
});

const canLeaveReview = computed(() => {
  const hasCompletedReservation = completedReservation.value !== undefined;
  const canReview =
    isAuthenticated.value && !isOwner.value && hasCompletedReservation;

  return canReview;
});

// review button text should use translations
const { t } = useI18n();
const reviewButtonText = computed(() => {
  if (existingReview.value) {
    return t('reviews.actions.edit');
  }
  return t('reviews.actions.write');
});

// Category options for the ArticleDetailView component
const categoryOptions = computed(() => [
  { key: 'tools' as ItemCategoryModel, name: 'Herramientas' },
  { key: 'electronics' as ItemCategoryModel, name: 'Electrónicos' },
  { key: 'books' as ItemCategoryModel, name: 'Libros' },
  { key: 'sports' as ItemCategoryModel, name: 'Deportes y Recreación' },
  { key: 'home' as ItemCategoryModel, name: 'Hogar y Cocina' },
  { key: 'garden' as ItemCategoryModel, name: 'Jardín y Exterior' },
  { key: 'clothing' as ItemCategoryModel, name: 'Ropa y Accesorios' },
  { key: 'games' as ItemCategoryModel, name: 'Juegos y Juguetes' },
  { key: 'other' as ItemCategoryModel, name: 'Otros' },
]);

// Event handlers for ArticleDetailView
function handleShare(item: typeof currentItem.value) {
  if (!item) return;

  // Web Share API if available
  if (navigator.share) {
    navigator
      .share({
        title: item.title,
        text: `Mira este artículo: ${item.title}`,
        url: window.location.href,
      })
      .catch(console.error);
  } else {
    // Fallback to copying URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    // TODO: Show toast notification
    console.log('URL copiada al portapapeles');
  }
}

function handleContact(item: typeof currentItem.value) {
  if (!item) return;

  // TODO: Implement contact functionality
  // This could open a modal, redirect to messaging, or show contact info
  console.log('Contact owner of:', item.title);
}

async function checkExistingReview() {
  if (userId.value && completedReservation.value) {
    existingReview.value = await getExistingReview(
      completedReservation.value.$id ?? '',
      userId.value
    );
  }
}

// Handle photo clicks from reviews
function handleReviewPhotoClick(photoUrl: string) {
  // TODO: Implement photo modal/lightbox functionality
  console.log('Photo clicked:', photoUrl);
}

// Handle review updates
function handleReviewUpdated(_review: unknown) {
  // Refresh item data to update review counts
  // parameter is unused but kept for the event signature
  if (currentItem.value) {
    itemsStore.fetchItemById(currentItem.value.$id);
  }
}

const completedReservation = computed(() => {
  const allReservations = reservationsStore.reservations;
  const itemId = currentItem.value?.$id;
  const currentUserId = userId.value;
  const found = allReservations.find(
    (r) =>
      r.itemId === itemId &&
      r.borrowerId === currentUserId &&
      (r.status === 'completed' || r.status === 'returned')
  );

  return found;
});

async function loadItem() {
  const itemId = route.params.id as string;
  if (itemId) {
    await itemsStore.fetchItemById(itemId);
    // Cargar reservaciones del usuario (tanto completed como returned)
    if (userId.value) {
      // Cargar reservaciones completadas y devueltas del usuario
      await reservationsStore.fetchReservations({
        borrowerId: userId.value,
        statuses: ['completed', 'returned'],
      });

      // Verificar si ya existe una reseña
      await checkExistingReview();
    }
    // Reviews are now loaded by the ReviewsList component
  }
}

// Watch for route changes
watch(() => route.params.id, loadItem, { immediate: true });

onMounted(() => {
  loadItem();
});
</script>
