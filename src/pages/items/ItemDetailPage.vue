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
      />

      <!-- Owner Actions Bar (para propietarios) -->
      <div
        v-if="isOwner"
        class="max-w-4xl mx-auto mt-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Acciones del Propietario
        </h3>
        <div class="flex flex-col sm:flex-row gap-3">
          <router-link
            :to="`/items/${currentItem.$id}/edit`"
            class="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 text-center inline-flex items-center justify-center"
          >
            <PencilIcon class="h-5 w-5 mr-2" />
            Editar Artículo
          </router-link>
          <button
            @click="showDeleteModal = true"
            class="sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 inline-flex items-center justify-center"
          >
            <TrashIcon class="h-5 w-5 mr-2" />
            Eliminar
          </button>
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
                @click="openReviewModal"
                class="btn-secondary"
              >
                <PlusIcon v-if="!existingReview" class="h-4 w-4 mr-2" />
                <PencilIcon v-else class="h-4 w-4 mr-2" />
                {{ reviewButtonText }}
              </button>
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

          <!-- Empty State for when no reviews exist -->
          <div v-if="!currentItem?.totalReviews" class="text-center py-12">
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
                @click="openReviewModal"
                class="btn-primary"
              >
                {{ existingReview ? 'Edit Your Review' : 'Write First Review' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Review Modal -->
    <BaseModal
      :is-open="showCreateReviewModal"
      :title="isEditingReview ? 'Edit Review' : 'Write a Review'"
      @close="showCreateReviewModal = false"
    >
      <CreateReviewForm
        v-if="currentItem && userId"
        :reservation-id="completedReservation?.$id || ''"
        :item-id="currentItem.$id"
        :reviewer-id="userId"
        :reviewed-user-id="currentItem?.ownerId || ''"
        :review-type="'borrower_to_owner'"
        :existing-review="isEditingReview ? existingReview : null"
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
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import ArticleDetailView from '@/components/common/ArticleDetailView.vue';
import ReserveModal from '@/components/modals/ReserveModal.vue';
import ReviewsList from '@/components/reviews/ReviewsList.vue';
import StarRating from '@/components/reviews/StarRating.vue';
import CreateReviewForm from '@/components/reviews/CreateReviewForm.vue';
import { useAuthStore } from '@/store/auth.store';
import { useItemsStore } from '@/store/items.store';
import { useReviews } from '@/composables/useReviews';
import { useReservationsStore } from '@/store/reservations.store';
import { storeToRefs } from 'pinia';
import type {
  CreateReviewDataModel,
  ReviewModel as Review,
  ItemCategoryModel,
} from '@/types/models';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const itemsStore = useItemsStore();
const reservationsStore = useReservationsStore();
const { createReview, updateReview, getExistingReview } = useReviews();

const { isAuthenticated, userId } = storeToRefs(authStore);

const showReserveModal = ref(false);
const showDeleteModal = ref(false);
const showCreateReviewModal = ref(false);
const isDeleting = ref(false);
// Reviews are now handled by ReviewsList component
const existingReview = ref<Review | null>(null);
const isEditingReview = ref(false);

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

const reviewButtonText = computed(() => {
  if (existingReview.value) {
    return 'Edit Review';
  }
  return 'Write Review';
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

async function handleReviewCreated(reviewData: CreateReviewDataModel) {
  try {
    let result;

    if (isEditingReview.value && existingReview.value) {
      result = await updateReview(existingReview.value.$id, reviewData);
    } else {
      result = await createReview(reviewData);
    }

    if (result) {
      showCreateReviewModal.value = false;
      isEditingReview.value = false;
      // Reviews will be automatically refreshed by ReviewsList component
      await checkExistingReview();
    }
  } catch (error) {
    console.error('Error al procesar la reseña:', error);
  }
}

async function checkExistingReview() {
  if (userId.value && completedReservation.value) {
    existingReview.value = await getExistingReview(
      completedReservation.value.$id ?? '',
      userId.value
    );
  }
}

function openReviewModal() {
  if (existingReview.value) {
    isEditingReview.value = true;
  } else {
    isEditingReview.value = false;
  }
  showCreateReviewModal.value = true;
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
