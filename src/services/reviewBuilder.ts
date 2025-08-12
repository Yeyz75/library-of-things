import { databases, COLLECTIONS, DATABASE_ID } from '../api/api';
import type {
  CreateReviewDataModel,
  UserModel,
  ItemModel,
} from '@/types/models';
import type { Models } from 'appwrite';
import { jsonUtilsService } from './jsonUtilsService';

export const reviewBuilder = {
  async buildReviewDocument(
    reviewData: CreateReviewDataModel,
    photoUrls: string[]
  ) {
    const [reviewer, reviewedUser, item] = await Promise.all([
      databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        reviewData.reviewerId!
      ) as Promise<Models.Document & UserModel>,
      databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        reviewData.reviewedUserId!
      ) as Promise<Models.Document & UserModel>,
      databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        reviewData.itemId!
      ) as Promise<Models.Document & ItemModel>,
    ]);

    return {
      reservationId: reviewData.reservationId!,
      itemId: reviewData.itemId!,
      itemTitle: item.title!,
      reviewerId: reviewData.reviewerId!,
      reviewerName: reviewer.name || reviewer.email!,
      reviewedUserId: reviewData.reviewedUserId!,
      reviewedUserName: reviewedUser.name || reviewedUser.email!,
      reviewType: reviewData.reviewType!,
      overallRating: reviewData.overallRating,
      aspectRatings: jsonUtilsService.safeJsonStringify(
        reviewData.aspectRatings || {}
      ),
      comment: reviewData.comment,
      photos: photoUrls,
      isVisible: true,
    };
  },
};
