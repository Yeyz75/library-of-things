/**
 * Composable específico para paginación de reseñas
 * Proporciona funcionalidad especializada para manejar reseñas con diferentes filtros y ordenamiento
 */

import { ref, watch, type Ref } from 'vue';
import { usePagination } from './usePagination';
import { getReviewsByItem, getReviewsByReviewedUser } from '@/api/reviews';
import type { ReviewModel } from '@/types/models';
import type {
  PaginatedResponse,
  UsePaginationReturn,
} from '@/types/pagination';

export type ReviewsSortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
export type ReviewsFilterType =
  | 'all'
  | 'borrower_to_owner'
  | 'owner_to_borrower';

export interface UseReviewsPaginationOptions {
  // Data source
  itemId?: string;
  userId?: string;

  // Initial configuration
  initialPageSize?: number;
  initialSort?: ReviewsSortOption;
  initialFilter?: ReviewsFilterType;

  // URL synchronization
  syncWithUrl?: boolean;
  urlPrefix?: string;
}

export interface UseReviewsPaginationReturn
  extends UsePaginationReturn<ReviewModel> {
  // Additional state for reviews
  sortBy: Ref<ReviewsSortOption>;
  filterBy: Ref<ReviewsFilterType>;

  // Additional methods
  setSortBy: (sort: ReviewsSortOption) => void;
  setFilterBy: (filter: ReviewsFilterType) => void;
  refreshWithCurrentFilters: () => Promise<void>;
}

export function useReviewsPagination(
  options: UseReviewsPaginationOptions
): UseReviewsPaginationReturn {
  // Validation
  if (!options.itemId && !options.userId) {
    throw new Error(
      'Either itemId or userId must be provided for useReviewsPagination'
    );
  }

  // Additional state for reviews
  const sortBy = ref<ReviewsSortOption>(options.initialSort || 'newest');
  const filterBy = ref<ReviewsFilterType>(options.initialFilter || 'all');

  // Create fetch function for reviews
  const fetchReviews = async (
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<ReviewModel>> => {
    try {
      let response;
      const offset = (page - 1) * pageSize;

      // Fetch reviews based on data source
      if (options.itemId) {
        response = await getReviewsByItem(options.itemId, pageSize, offset);
      } else if (options.userId) {
        response = await getReviewsByReviewedUser(
          options.userId,
          pageSize,
          offset
        );
      } else {
        throw new Error('No data source specified');
      }

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch reviews');
      }

      let reviews = [...response.data.documents];

      // Apply filtering
      if (filterBy.value !== 'all') {
        reviews = reviews.filter(
          (review) => review.reviewType === filterBy.value
        );
      }

      // Apply sorting
      switch (sortBy.value) {
        case 'newest':
          reviews.sort(
            (a, b) =>
              new Date(b.$createdAt || '').getTime() -
              new Date(a.$createdAt || '').getTime()
          );
          break;
        case 'oldest':
          reviews.sort(
            (a, b) =>
              new Date(a.$createdAt || '').getTime() -
              new Date(b.$createdAt || '').getTime()
          );
          break;
        case 'highest':
          reviews.sort(
            (a, b) => (b.overallRating || 0) - (a.overallRating || 0)
          );
          break;
        case 'lowest':
          reviews.sort(
            (a, b) => (a.overallRating || 0) - (b.overallRating || 0)
          );
          break;
      }

      // Calculate adjusted total based on filtering
      let adjustedTotal = response.data.total;
      if (filterBy.value !== 'all') {
        // For filtered results, we need to count only matching reviews
        // This is a simplified approach - in a real app, filtering should be done server-side
        const allReviewsResponse = options.itemId
          ? await getReviewsByItem(options.itemId, 1000, 0) // Get all reviews to count
          : await getReviewsByReviewedUser(options.userId!, 1000, 0);

        if (allReviewsResponse.success && allReviewsResponse.data) {
          const filteredCount = allReviewsResponse.data.documents.filter(
            (review) => review.reviewType === filterBy.value
          ).length;
          adjustedTotal = filteredCount;
        }
      }

      return {
        data: reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(adjustedTotal / pageSize),
          totalItems: adjustedTotal,
          itemsPerPage: pageSize,
          hasNextPage: page < Math.ceil(adjustedTotal / pageSize),
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  };

  // Use base pagination composable
  const paginationResult = usePagination<ReviewModel>({
    initialPage: 1,
    initialPageSize: options.initialPageSize || 5,
    fetchFunction: fetchReviews,
    syncWithUrl: options.syncWithUrl,
    urlParamPrefix: options.urlPrefix,
  });

  // Additional methods
  const setSortBy = (sort: ReviewsSortOption) => {
    if (sort !== sortBy.value) {
      sortBy.value = sort;
      // Reset to first page when sorting changes
      paginationResult.goToPage(1);
    }
  };

  const setFilterBy = (filter: ReviewsFilterType) => {
    if (filter !== filterBy.value) {
      filterBy.value = filter;
      // Reset to first page when filtering changes
      paginationResult.goToPage(1);
    }
  };

  const refreshWithCurrentFilters = async () => {
    await paginationResult.refresh();
  };

  // Watch for sort/filter changes to refresh data
  watch([sortBy, filterBy], () => {
    refreshWithCurrentFilters();
  });

  return {
    ...paginationResult,
    sortBy,
    filterBy,
    setSortBy,
    setFilterBy,
    refreshWithCurrentFilters,
  };
}

// Helper function to create reviews pagination options
export function createReviewsPaginationOptions(
  dataSource: { itemId?: string; userId?: string },
  overrides: Partial<UseReviewsPaginationOptions> = {}
): UseReviewsPaginationOptions {
  return {
    initialPageSize: 5,
    initialSort: 'newest',
    initialFilter: 'all',
    syncWithUrl: false,
    ...dataSource,
    ...overrides,
  };
}

// Utility functions for reviews
export const reviewsSortOptions: { value: ReviewsSortOption; label: string }[] =
  [
    { value: 'newest', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'highest', label: 'Mejor calificación' },
    { value: 'lowest', label: 'Menor calificación' },
  ];

export const reviewsFilterOptions: {
  value: ReviewsFilterType;
  label: string;
}[] = [
  { value: 'all', label: 'Todas las reseñas' },
  { value: 'borrower_to_owner', label: 'Como prestamista' },
  { value: 'owner_to_borrower', label: 'Como prestatario' },
];
