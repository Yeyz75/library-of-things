import type { ReviewModel } from '@/types/models';
import type { Models } from 'appwrite';
import { jsonUtilsService } from './jsonUtilsService';

export const reviewFormatter = {
  formatReview(doc: Models.Document & ReviewModel): ReviewModel {
    return {
      $id: doc.$id,
      reservationId: doc.reservationId,
      itemId: doc.itemId,
      itemTitle: doc.itemTitle,
      reviewerId: doc.reviewerId,
      reviewerName: doc.reviewerName,
      reviewedUserId: doc.reviewedUserId,
      reviewedUserName: doc.reviewedUserName,
      reviewType: doc.reviewType,
      overallRating: doc.overallRating,
      aspectRatings: jsonUtilsService.safeJsonParse(
        doc.aspectRatings as string,
        {}
      ),
      comment: doc.comment,
      photos: doc.photos?.length ? doc.photos : undefined,
      isVisible: doc.isVisible,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
    };
  },
};
