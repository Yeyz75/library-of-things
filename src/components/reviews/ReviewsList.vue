<template>
  <div class="reviews-list">
    <!-- Header with sorting options -->
    <div class="reviews-header">
      <div class="reviews-count">
        <h3
          class="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          {{ $t('reviews.title') }}
          <span v-if="!loading && totalReviews > 0" class="text-neutral-500">
            ({{ totalReviews }})
          </span>
        </h3>
      </div>

      <!-- Sort options -->
      <div v-if="showSortOptions" class="sort-options">
        <label for="sort-select" class="sr-only">
          {{ $t('reviews.sortBy') }}
        </label>
        <select
          id="sort-select"
          v-model="selectedSort"
          :disabled="loading"
          class="sort-select"
          @change="handleSortChange"
        >
          <option value="newest">
            {{ $t('reviews.sort.newest') }}
          </option>
          <option value="oldest">
            {{ $t('reviews.sort.oldest') }}
          </option>
          <option value="highest">
            {{ $t('reviews.sort.highest') }}
          </option>
          <option value="lowest">
            {{ $t('reviews.sort.lowest') }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading && reviews.length === 0" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div
          class="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"
        ></div>
        <span class="ml-3 text-neutral-600 dark:text-neutral-400">
          {{ $t('reviews.loading') }}
        </span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <div class="flex items-center">
          <svg
            class="h-5 w-5 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              {{ $t('reviews.error.title') }}
            </h3>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">
              {{ error }}
            </p>
          </div>
        </div>
        <div class="mt-4">
          <button
            @click="refresh"
            :disabled="loading"
            class="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {{ $t('reviews.error.retry') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && reviews.length === 0" class="empty-state">
      <div class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.172-.268l-5.909 2.244a.5.5 0 01-.65-.65l2.244-5.909A8.955 8.955 0 013 12a8 8 0 018-8 8 8 0 018 8z"
          ></path>
        </svg>
        <h3
          class="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100"
        >
          {{ $t('reviews.empty.title') }}
        </h3>
        <p class="mt-2 text-neutral-500 dark:text-neutral-400">
          {{ $t('reviews.empty.description') }}
        </p>
      </div>
    </div>

    <!-- Reviews list -->
    <div v-else class="reviews-content">
      <!-- Reviews grid -->
      <div class="reviews-grid">
        <ReviewCard
          v-for="review in reviews"
          :key="review.$id"
          :review="review"
          :show-item-info="showItemInfo"
          @photo-click="handlePhotoClick"
        />
      </div>

      <!-- Loading overlay for pagination -->
      <div v-if="loading && reviews.length > 0" class="loading-overlay">
        <div
          class="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-lg p-4"
        >
          <div class="flex items-center justify-center">
            <div
              class="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full"
            ></div>
            <span class="ml-3 text-neutral-600 dark:text-neutral-400">
              {{ $t('reviews.loadingMore') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-container">
        <Pagination
          :current-page="currentPage"
          :total-items="totalReviews"
          :items-per-page="pageSize"
          :loading="loading"
          :show-page-size-selector="showPageSizeSelector"
          :page-size-options="pageSizeOptions"
          :size="paginationSize"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { usePagination } from '@/composables/usePagination';
import type { ReviewModel } from '@/types/models';
import type { PaginatedResponse } from '@/types/pagination';
import ReviewCard from './ReviewCard.vue';
import Pagination from '@/components/ui/Pagination.vue';

export type ReviewsSortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
export type ReviewsFilterType =
  | 'all'
  | 'borrower_to_owner'
  | 'owner_to_borrower';

export interface ReviewsListProps {
  // Data source configuration
  itemId?: string;
  userId?: string;
  reviewType?: ReviewsFilterType;

  // Display options
  showItemInfo?: boolean;
  showSortOptions?: boolean;
  showPageSizeSelector?: boolean;

  // Pagination configuration
  initialPageSize?: number;
  pageSizeOptions?: number[];
  paginationSize?: 'sm' | 'md' | 'lg';

  // Custom fetch function (optional)
  customFetchFunction?: (
    _page: number,
    _pageSize: number,
    _sortBy: ReviewsSortOption
  ) => Promise<PaginatedResponse<ReviewModel>>;
}

const props = withDefaults(defineProps<ReviewsListProps>(), {
  showItemInfo: false,
  showSortOptions: true,
  showPageSizeSelector: true,
  initialPageSize: 5,
  pageSizeOptions: () => [5, 10, 20],
  paginationSize: 'md',
  reviewType: 'all',
});

const emit = defineEmits<{
  'photo-click': [photoUrl: string];
  'review-updated': [review: ReviewModel];
}>();

// Composables
// Note: useI18n is handled in template via $t

// Sort state
const selectedSort = ref<ReviewsSortOption>('newest');

// Fetch function for reviews
const fetchReviews = async (
  page: number,
  pageSize: number
): Promise<PaginatedResponse<ReviewModel>> => {
  // Use custom fetch function if provided
  if (props.customFetchFunction) {
    return props.customFetchFunction(page, pageSize, selectedSort.value);
  }

  // Import API functions dynamically to avoid circular dependencies
  const { getReviewsByItem, getReviewsByReviewedUser } = await import(
    '@/api/reviews'
  );

  let response;
  const offset = (page - 1) * pageSize;

  try {
    // Determine which API method to use based on props
    if (props.itemId) {
      response = await getReviewsByItem(props.itemId, pageSize, offset);
    } else if (props.userId) {
      response = await getReviewsByReviewedUser(props.userId, pageSize, offset);
    } else {
      throw new Error('Either itemId or userId must be provided');
    }

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch reviews');
    }

    // Sort reviews based on selected sort option
    let sortedReviews = [...response.data.documents];

    switch (selectedSort.value) {
      case 'newest':
        sortedReviews.sort(
          (a, b) =>
            new Date(b.$createdAt || '').getTime() -
            new Date(a.$createdAt || '').getTime()
        );
        break;
      case 'oldest':
        sortedReviews.sort(
          (a, b) =>
            new Date(a.$createdAt || '').getTime() -
            new Date(b.$createdAt || '').getTime()
        );
        break;
      case 'highest':
        sortedReviews.sort(
          (a, b) => (b.overallRating || 0) - (a.overallRating || 0)
        );
        break;
      case 'lowest':
        sortedReviews.sort(
          (a, b) => (a.overallRating || 0) - (b.overallRating || 0)
        );
        break;
    }

    // Filter by review type if specified and not 'all'
    if (props.reviewType && props.reviewType !== 'all') {
      sortedReviews = sortedReviews.filter(
        (review) => review.reviewType === props.reviewType
      );
    }

    return {
      data: sortedReviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(response.data.total / pageSize),
        totalItems: response.data.total,
        itemsPerPage: pageSize,
        hasNextPage: page < Math.ceil(response.data.total / pageSize),
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

// Use pagination composable
const {
  currentPage,
  pageSize,
  totalItems: totalReviews,
  totalPages,
  items: reviews,
  loading,
  error,
  goToPage,
  changePageSize,
  refresh,
} = usePagination<ReviewModel>({
  initialPage: 1,
  initialPageSize: props.initialPageSize,
  fetchFunction: fetchReviews,
});

// Event handlers
const handlePageChange = (page: number) => {
  goToPage(page);
};

const handlePageSizeChange = (size: number) => {
  changePageSize(size);
};

const handleSortChange = () => {
  // Reset to first page when sorting changes
  goToPage(1);
};

const handlePhotoClick = (photoUrl: string) => {
  emit('photo-click', photoUrl);
};

// Watch for sort changes to refresh data
watch(selectedSort, () => {
  refresh();
});

// Initialize on mount
onMounted(() => {
  if (!props.itemId && !props.userId) {
    console.warn('ReviewsList: Either itemId or userId should be provided');
  }
});
</script>

<style scoped>
.reviews-list {
  @apply space-y-6;
}

.reviews-header {
  @apply flex items-center justify-between gap-4;
}

.sort-options {
  @apply flex items-center gap-2;
}

.sort-select {
  @apply rounded-lg border border-neutral-300 dark:border-neutral-600 
         bg-white dark:bg-neutral-800 
         text-neutral-700 dark:text-neutral-300
         px-3 py-2 text-sm
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.reviews-content {
  @apply space-y-6;
}

.reviews-grid {
  @apply space-y-4;
}

.loading-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center;
}

.pagination-container {
  @apply flex justify-center pt-6 border-t border-neutral-200 dark:border-neutral-700;
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .reviews-header {
    @apply flex-col items-start gap-3;
  }

  .sort-options {
    @apply w-full;
  }

  .sort-select {
    @apply w-full;
  }
}
</style>
