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
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Images -->
        <div>
          <div
            class="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4"
          >
            <img
              v-if="currentImageUrl"
              :src="currentImageUrl"
              :alt="currentItem.title"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-400"
            >
              <PhotoIcon class="h-24 w-24" />
            </div>
          </div>

          <!-- Thumbnail Gallery -->
          <div
            v-if="currentItem?.imageUrls?.length > 1"
            class="grid grid-cols-4 gap-2"
          >
            <button
              v-for="(imageUrl, index) in currentItem.imageUrls"
              :key="index"
              @click="currentImageIndex = index"
              class="aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 transition-colors"
              :class="
                index === currentImageIndex
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-gray-300'
              "
            >
              <img
                :src="imageUrl"
                :alt="`${currentItem?.title || ''} ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        <!-- Item Details -->
        <div>
          <div class="flex items-start justify-between mb-4">
            <div>
              <h1
                class="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2"
              >
                {{ currentItem.title }}
              </h1>
              <div class="flex items-center space-x-3">
                <span
                  class="inline-block px-3 py-1 text-sm font-medium rounded-full"
                  :class="
                    currentItem.isAvailable
                      ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  "
                >
                  {{
                    currentItem.isAvailable ? 'Available' : 'Currently Borrowed'
                  }}
                </span>
                <span
                  class="inline-block bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {{ getCategoryName(currentItem?.category || '') }}
                </span>
              </div>
            </div>

            <!-- Owner Actions -->
            <div v-if="isOwner" class="flex items-center space-x-2">
              <router-link
                :to="`/items/${currentItem.$id}/edit`"
                class="btn-secondary"
              >
                <PencilIcon class="h-4 w-4 mr-2" />
                Edit
              </router-link>
              <button @click="showDeleteModal = true" class="btn-danger">
                <TrashIcon class="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Description -->
            <div>
              <h3 class="font-medium text-gray-900 dark:text-gray-50 mb-2">
                Description
              </h3>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ currentItem.description }}
              </p>
            </div>

            <!-- Details -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-gray-50 mb-1">
                  Condition
                </h4>
                <p class="text-gray-700 dark:text-gray-300 capitalize">
                  {{ currentItem.condition }}
                </p>
              </div>
              <div>
                <h4 class="font-medium text-gray-900 dark:text-gray-50 mb-1">
                  Location
                </h4>
                <p class="text-gray-700 dark:text-gray-300">
                  {{ currentItem.location }}
                </p>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="currentItem?.tags && currentItem.tags.length > 0">
              <h4 class="font-medium text-gray-900 dark:text-gray-50 mb-2">
                Tags
              </h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in currentItem.tags"
                  :key="tag"
                  class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm px-3 py-1 rounded-full"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Owner Info -->
            <div class="border-t border-gray-200 pt-6">
              <h4 class="font-medium text-gray-900 dark:text-gray-50 mb-3">
                Shared by
              </h4>
              <div class="flex items-center space-x-3">
                <div
                  class="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center"
                >
                  <span class="text-white font-medium text-sm">
                    {{ currentItem?.ownerName?.charAt(0)?.toUpperCase() || '' }}
                  </span>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-50">
                    {{ currentItem?.ownerName || '' }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Member since
                    {{ formatDate(new Date(currentItem.$createdAt)) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Reserve Button -->
            <div v-if="!isOwner" class="pt-6 border-t border-gray-200">
              <button
                @click="showReserveModal = true"
                :disabled="!currentItem.isAvailable || !isAuthenticated"
                class="w-full btn-primary"
                :class="{
                  'opacity-50 cursor-not-allowed': !currentItem.isAvailable,
                }"
              >
                <CalendarDaysIcon class="h-5 w-5 mr-2" />
                {{
                  currentItem.isAvailable
                    ? 'Request to Borrow'
                    : 'Not Available'
                }}
              </button>
              <p
                v-if="!isAuthenticated"
                class="text-sm text-gray-600 dark:text-gray-300 text-center mt-2"
              >
                <router-link
                  to="/login"
                  class="text-primary-600 hover:text-primary-700"
                >
                  Sign in
                </router-link>
                to request this item
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="mt-12">
        <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Reviews & Ratings
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
              <button
                v-if="canLeaveReview"
                @click="showCreateReviewModal = true"
                class="btn-secondary"
              >
                <PlusIcon class="h-4 w-4 mr-2" />
                Write Review
              </button>
            </div>
          </div>

          <!-- Reviews List -->
          <div v-if="reviews.length > 0" class="space-y-6">
            <ReviewCard
              v-for="review in reviews"
              :key="review.$id"
              :review="review"
            />

            <!-- Load More Button -->
            <div v-if="hasMoreReviews" class="text-center pt-4">
              <button
                @click="loadMoreReviews"
                :disabled="reviewsLoading"
                class="btn-secondary"
              >
                <BaseLoader v-if="reviewsLoading" size="sm" class="mr-2" />
                {{ reviewsLoading ? 'Loading...' : 'Load More Reviews' }}
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
              <h3
                class="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2"
              >
                No reviews yet
              </h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                Be the first to review this item after borrowing it.
              </p>
              <button
                v-if="canLeaveReview"
                @click="showCreateReviewModal = true"
                class="btn-primary"
              >
                Write First Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Review Modal -->
    <BaseModal
      :is-open="showCreateReviewModal"
      title="Write a Review"
      @close="showCreateReviewModal = false"
    >
      <CreateReviewForm
        v-if="currentItem && userId"
        :reservation-id="completedReservation?.$id || ''"
        :item-id="currentItem.$id"
        :reviewer-id="userId"
        :reviewed-user-id="currentItem?.ownerId || ''"
        :review-type="'borrower_to_owner'"
        @submit="handleReviewCreated"
        @cancel="showCreateReviewModal = false"
      />
    </BaseModal>

    <!-- Reserve Modal -->
    <ReserveModal
      v-if="currentItem"
      :is-open="showReserveModal"
      :item="currentItem"
      @close="showReserveModal = false"
      @reserved="handleReservationCreated"
    />

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :is-open="showDeleteModal"
      title="Delete Item"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Are you sure you want to delete "{{ currentItem?.title }}"? This action
        cannot be undone.
      </p>

      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">
          Cancel
        </button>
        <button
          @click="handleDelete"
          :disabled="isDeleting"
          class="btn-danger flex items-center"
        >
          <BaseLoader v-if="isDeleting" size="sm" class="mr-2" />
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </button>
      </template>
    </BaseModal>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import ReserveModal from '@/components/modals/ReserveModal.vue';
import ReviewCard from '@/components/reviews/ReviewCard.vue';
import StarRating from '@/components/reviews/StarRating.vue';
import CreateReviewForm from '@/components/reviews/CreateReviewForm.vue';
import { useAuthStore } from '@/store/auth.store';
import { useItemsStore } from '@/store/items.store';
import { useReviews } from '@/composables/useReviews';
import { useReservationsStore } from '@/store/reservations.store';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const itemsStore = useItemsStore();
const reservationsStore = useReservationsStore();
const { loadItemReviews, reviews, isLoading: reviewsLoading } = useReviews();

const { isAuthenticated, userId } = storeToRefs(authStore);

const currentImageIndex = ref(0);
const showReserveModal = ref(false);
const showDeleteModal = ref(false);
const showCreateReviewModal = ref(false);
const isDeleting = ref(false);
const reviewsOffset = ref(0);
const reviewsLimit = ref(5);
const hasMoreReviews = ref(false);

const currentItem = computed(() => itemsStore.currentItem);

const currentImageUrl = computed(() => {
  if (!currentItem.value?.imageUrls?.length) return null;
  return currentItem.value.imageUrls[currentImageIndex.value];
});

const isOwner = computed(() => {
  return userId.value && currentItem.value?.ownerId === userId.value;
});

const canLeaveReview = computed(() => {
  return isAuthenticated.value && !isOwner.value;
  // TODO: Add logic to check if user has actually borrowed this item
});

const categories = {
  tools: 'Tools',
  electronics: 'Electronics',
  books: 'Books',
  sports: 'Sports & Recreation',
  home: 'Home & Kitchen',
  garden: 'Garden & Outdoor',
  clothing: 'Clothing & Accessories',
  games: 'Games & Toys',
  other: 'Other',
};

function getCategoryName(categoryKey: string): string {
  return categories[categoryKey as keyof typeof categories] || categoryKey;
}

function formatDate(date?: Date): string {
  if (!date) return '';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

async function handleDelete() {
  if (!currentItem.value) return;

  isDeleting.value = true;

  try {
    await itemsStore.deleteItem(currentItem.value.$id);
    router.push('/dashboard');
  } catch (error) {
    console.error('Error deleting item:', error);
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
}

function handleReservationCreated() {
  showReserveModal.value = false;
  // Could show a success message or redirect to reservations
}

function handleReviewCreated() {
  showCreateReviewModal.value = false;
  // Reload reviews to show the new one
  loadItemReviewsData();
}

async function loadItemReviewsData() {
  if (!currentItem.value) return;

  reviewsOffset.value = 0;
  const response = await loadItemReviews(
    currentItem.value.$id,
    reviewsLimit.value,
    reviewsOffset.value
  );

  hasMoreReviews.value = response && response.length === reviewsLimit.value;
}

async function loadMoreReviews() {
  if (!currentItem.value) return;

  reviewsOffset.value += reviewsLimit.value;
  const response = await loadItemReviews(
    currentItem.value.$id,
    reviewsLimit.value,
    reviewsOffset.value
  );

  hasMoreReviews.value = response && response.length === reviewsLimit.value;
}

const completedReservation = computed(() => {
  return reservationsStore.reservations.find(
    (r) =>
      r.itemId === currentItem.value?.$id &&
      r.borrowerId === userId.value &&
      (r.status === 'completed' || r.status === 'returned')
  );
});

async function loadItem() {
  const itemId = route.params.id as string;
  if (itemId) {
    await itemsStore.fetchItemById(itemId);
    // Cargar reservaciones del usuario
    if (userId.value) {
      await reservationsStore.fetchReservations({
        borrowerId: userId.value,
        status: 'completed',
      });
    }
    // Cargar reseñas después de cargar el ítem
    await loadItemReviewsData();
  }
}

// Watch for route changes
watch(() => route.params.id, loadItem, { immediate: true });

onMounted(() => {
  loadItem();
});
</script>
