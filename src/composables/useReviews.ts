import { ref, computed } from 'vue';
import { reviewService } from '../services/reviewService';
import type {
  ReviewModel as Review,
  CreateReviewDataModel as CreateReviewData,
  ReviewSummaryModel as ReviewSummary,
  UserStatsModel as UserStats,
} from '@/types/models';

export function useReviews() {
  const reviews = ref<Review[]>([]);
  const reviewSummary = ref<ReviewSummary | null>(null);
  const userStats = ref<UserStats | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Create a new review
  const createReview = async (
    reviewData: CreateReviewData
  ): Promise<Review | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      const review = await reviewService.createReview(reviewData);
      reviews.value.unshift(review); // Add to beginning of list

      return review;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Error creating review';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Load reviews for an item
  const loadItemReviews = async (itemId: string, limit = 10, offset = 0) => {
    try {
      isLoading.value = true;
      error.value = null;

      const itemReviews = await reviewService.getItemReviews(
        itemId,
        limit,
        offset
      );

      if (offset === 0) {
        reviews.value = itemReviews;
      } else {
        reviews.value.push(...itemReviews);
      }

      return itemReviews;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Error loading reviews';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // Load reviews for a user
  const loadUserReviews = async (userId: string, limit = 10, offset = 0) => {
    try {
      isLoading.value = true;
      error.value = null;

      const userReviews = await reviewService.getUserReviews(
        userId,
        limit,
        offset
      );

      if (offset === 0) {
        reviews.value = userReviews;
      } else {
        reviews.value.push(...userReviews);
      }

      return userReviews;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Error loading user reviews';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // Load review summary for an item
  const loadItemReviewSummary = async (itemId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      reviewSummary.value = await reviewService.getItemReviewSummary(itemId);
      return reviewSummary.value;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Error loading review summary';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Load user statistics
  const loadUserStats = async (userId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      userStats.value = await reviewService.getUserStats(userId);
      return userStats.value;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Error loading user stats';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Check if user can review
  const checkCanReview = async (reservationId: string, userId: string) => {
    try {
      return await reviewService.canUserReview(reservationId, userId);
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Error checking review eligibility';
      return { canReview: false };
    }
  };

  // Computed properties
  const averageRating = computed(() => {
    if (!reviewSummary.value || reviewSummary.value.totalReviews === 0)
      return 0;
    return reviewSummary.value.averageRating;
  });

  const totalReviews = computed(() => {
    return reviewSummary.value?.totalReviews || 0;
  });

  const ratingDistribution = computed(() => {
    return (
      reviewSummary.value?.ratingDistribution || {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      }
    );
  });

  const trustLevel = computed(() => {
    return userStats.value?.trustLevel || 'Bronze';
  });

  const trustScore = computed(() => {
    return userStats.value?.trustScore || 0;
  });

  // Helper functions
  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  const getRatingStars = (rating: number): string => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars)
    );
  };

  const getTrustLevelColor = (level: string): string => {
    switch (level) {
      case 'Platinum':
        return '#E5E7EB'; // Platinum color
      case 'Gold':
        return '#FCD34D'; // Gold color
      case 'Silver':
        return '#D1D5DB'; // Silver color
      case 'Bronze':
        return '#92400E'; // Bronze color
      default:
        return '#6B7280'; // Default gray
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600)
      return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400)
      return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 2592000)
      return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    if (diffInSeconds < 31536000)
      return `hace ${Math.floor(diffInSeconds / 2592000)} meses`;
    return `hace ${Math.floor(diffInSeconds / 31536000)} años`;
  };

  // Clear data
  const clearReviews = () => {
    reviews.value = [];
    reviewSummary.value = null;
    userStats.value = null;
    error.value = null;
  };

  return {
    // State
    reviews,
    reviewSummary,
    userStats,
    isLoading,
    error,

    // Actions
    createReview,
    loadItemReviews,
    loadUserReviews,
    loadItemReviewSummary,
    loadUserStats,
    checkCanReview,
    clearReviews,

    // Computed
    averageRating,
    totalReviews,
    ratingDistribution,
    trustLevel,
    trustScore,

    // Helpers
    formatRating,
    getRatingStars,
    getTrustLevelColor,
    getRelativeTime,
  };
}
