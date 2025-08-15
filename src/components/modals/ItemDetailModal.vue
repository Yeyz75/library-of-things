<template>
  <BaseModal
    :is-open="isOpen"
    @close="onClose"
    :size="size"
    aria-label="Detalle del artículo"
  >
    <template #header>
      <div class="flex-1"></div>
    </template>

    <div v-if="isLoading" class="p-6">
      <BaseLoader size="lg" text="Loading item..." center />
    </div>

    <div v-else-if="error" class="p-6">
      <div class="bg-error-50 text-error-600 p-6 rounded">
        <h3 class="font-medium mb-2">Item not found</h3>
        <p class="text-sm">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="currentItem">
      <ArticleDetailView
        :item="currentItem"
        :categories="categoryOptions"
        :currentUserId="userId"
        @reserve="$emit('reserve', currentItem)"
        @share="$emit('share', currentItem)"
        @contact="$emit('contact', currentItem)"
        @delete="$emit('delete', currentItem)"
      />

      <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 px-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">{{ $t('reviews.title') }}</h2>
          <div class="flex items-center space-x-4">
            <div v-if="currentItem.averageRating" class="flex items-center">
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

        <ReviewsList
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
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type {
  ItemModel,
  ItemCategoryModel,
  ReviewModel as Review,
} from '@/types/models';
import BaseModal from '@/components/common/BaseModal.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import ArticleDetailView from '@/components/common/ArticleDetailView.vue';
import ReviewsList from '@/components/reviews/ReviewsList.vue';
import StarRating from '@/components/reviews/StarRating.vue';
import { PlusIcon, PencilIcon } from '@heroicons/vue/24/outline';
import { useItemsStore } from '@/store/items.store';
import { useReservationsStore } from '@/store/reservations.store';
import { useAuthStore } from '@/store/auth.store';
import { storeToRefs } from 'pinia';
import { useReviews } from '@/composables/useReviews';
import { useI18n } from '@/composables/useI18n';

const props = defineProps<{
  isOpen: boolean;
  itemId?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  categories?: Array<{ key: ItemCategoryModel; name: string; icon?: unknown }>;
}>();

const emit = defineEmits([
  'close',
  'reserve',
  'share',
  'contact',
  'delete',
] as const);

const itemsStore = useItemsStore();
const reservationsStore = useReservationsStore();
const authStore = useAuthStore();
const { getExistingReview } = useReviews();
const { t } = useI18n();

const { userId, isAuthenticated } = storeToRefs(authStore);

const isLoading = ref(false);
const error = ref<string | null>(null);
const existingReview = ref<Review | null>(null);

const currentItem = computed<ItemModel | null>(() => itemsStore.currentItem);

const categoryOptions = computed(() => props.categories || []);

const completedReservation = computed(() => {
  const allReservations = reservationsStore.reservations;
  const itemId = currentItem.value?.$id;
  const currentUserId = userId.value;
  return allReservations.find(
    (r) =>
      r.itemId === itemId &&
      r.borrowerId === currentUserId &&
      (r.status === 'completed' || r.status === 'returned')
  );
});

const canLeaveReview = computed(() => {
  const hasCompletedReservation = completedReservation.value !== undefined;
  const canReview =
    isAuthenticated.value && !isOwner.value && hasCompletedReservation;
  return canReview;
});

const isOwner = computed(() => {
  return userId.value && currentItem.value?.ownerId === userId.value;
});

const reviewButtonText = computed(() => {
  if (existingReview.value) return t('reviews.actions.edit');
  return t('reviews.actions.write');
});

async function loadForItem(itemId?: string | null) {
  if (!itemId) return;
  isLoading.value = true;
  error.value = null;
  try {
    await itemsStore.fetchItemById(itemId);
    if (userId.value) {
      await reservationsStore.fetchReservations({
        borrowerId: userId.value,
        statuses: ['completed', 'returned'],
      });
      existingReview.value = await getExistingReview(
        completedReservation.value?.$id ?? '',
        userId.value
      );
    }
  } catch (err) {
    console.error('Error loading item in modal:', err);
    error.value = 'Failed to load item.';
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.itemId,
  (val) => {
    if (props.isOpen) loadForItem(val);
  }
);

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadForItem(props.itemId);
  }
);

onMounted(() => {
  if (props.isOpen && props.itemId) loadForItem(props.itemId);
});

function onClose() {
  emit('close');
}

function handleReviewPhotoClick(photoUrl: string) {
  // placeholder - can emit or open lightbox
  console.log('Photo clicked:', photoUrl);
}

function handleReviewUpdated() {
  if (currentItem.value) itemsStore.fetchItemById(currentItem.value.$id);
}
</script>

<style scoped>
.detail-spinner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 60;
}
</style>
