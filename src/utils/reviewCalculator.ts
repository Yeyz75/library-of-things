import type {
  ReviewModel,
  ReviewSummaryModel,
  ReservationModel,
} from '@/types/models';
import type { Models } from 'appwrite';

export const reviewCalculator = {
  calculateReviewSummary(reviews: ReviewModel[]): ReviewSummaryModel {
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      const rating = review.overallRating!;
      ratingDistribution[rating as keyof typeof ratingDistribution]++;
      totalRating += rating;
    });

    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
      recentReviews: reviews.slice(0, 5),
    };
  },

  checkReviewEligibility(
    reservation: Models.Document & ReservationModel,
    userId: string
  ) {
    // Only completed reservations can be reviewed
    if (
      reservation.status !== 'completed' &&
      reservation.status !== 'returned'
    ) {
      return { canReview: false };
    }

    // Check if user is borrower or owner
    if (reservation.borrowerId === userId) {
      return {
        canReview: !reservation.isReviewedByBorrower,
        reviewType: reservation.isReviewedByBorrower
          ? undefined
          : ('borrower_to_owner' as const),
      };
    }

    if (reservation.ownerId === userId) {
      return {
        canReview: !reservation.isReviewedByOwner,
        reviewType: reservation.isReviewedByOwner
          ? undefined
          : ('owner_to_borrower' as const),
      };
    }

    return { canReview: false };
  },
};
