import { databases, COLLECTIONS, DATABASE_ID } from '../api/api';
import type { CreateReviewDataModel } from '@/types/models';
import { jsonUtilsService } from './jsonUtilsService';
import { reviewService } from './reviewService';

export const reviewUpdater = {
  buildUpdateData(
    reviewData: Partial<CreateReviewDataModel>,
    photoUrls: string[]
  ) {
    const updateData: Record<string, unknown> = {};

    if (reviewData.overallRating !== undefined)
      updateData.overallRating = reviewData.overallRating;
    if (reviewData.aspectRatings !== undefined)
      updateData.aspectRatings = jsonUtilsService.safeJsonStringify(
        reviewData.aspectRatings
      );
    if (reviewData.comment !== undefined)
      updateData.comment = reviewData.comment;
    if (photoUrls.length > 0) updateData.photos = photoUrls;

    return updateData;
  },

  async updateReservationReviewStatus(
    reservationId: string,
    reviewType: 'borrower_to_owner' | 'owner_to_borrower'
  ) {
    const updateData =
      reviewType === 'borrower_to_owner'
        ? { isReviewedByBorrower: true }
        : { isReviewedByOwner: true };

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.RESERVATIONS,
      reservationId,
      updateData
    );
  },

  async updateItemStats(itemId: string) {
    try {
      const reviews = await reviewService.getItemReviews(itemId, 1000);
      const summary = reviewService.calculateReviewSummary(reviews);

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.ITEMS, itemId, {
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews,
        ratingDistribution: jsonUtilsService.safeJsonStringify(
          summary.ratingDistribution
        ),
      });
    } catch (error) {
      console.error('Error updating item stats:', error);
    }
  },
};
