import {
  databases,
  COLLECTIONS,
  DATABASE_ID,
  ID,
  Query,
} from '../lib/appwrite';
import type {
  ReviewModel,
  CreateReviewDataModel,
  ReviewSummaryModel,
  UserModel,
  ItemModel,
  ReservationModel,
} from '@/types/models';
import type { Models } from 'appwrite';
import { userStatsService } from './userStatsService';
import { fileUploadService } from './fileUploadService';
import { jsonUtilsService } from './jsonUtilsService';

export const reviewService = {
  // Check if user already has a review for this reservation
  async getExistingReview(
    reservationId: string,
    reviewerId: string
  ): Promise<ReviewModel | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        [
          Query.equal('reservationId', reservationId),
          Query.equal('reviewerId', reviewerId),
          Query.limit(1),
        ]
      );

      return response.documents.length > 0
        ? this.formatReview(
            response.documents[0] as Models.Document & ReviewModel
          )
        : null;
    } catch (error) {
      console.error('Error checking existing review:', error);
      return null;
    }
  },

  // Create a new review
  async createReview(reviewData: CreateReviewDataModel): Promise<ReviewModel> {
    this.validateReviewData(reviewData);

    try {
      const photoUrls = await fileUploadService.uploadPhotos(reviewData.photos);
      const reviewDocumentData = await this.buildReviewDocument(
        reviewData,
        photoUrls
      );

      const review = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        ID.unique(),
        reviewDocumentData
      );

      // Update related data in parallel
      await Promise.all([
        this.updateReservationReviewStatus(
          reviewData.reservationId!,
          reviewData.reviewType!
        ),
        userStatsService.updateUserStats(reviewData.reviewedUserId!),
        this.updateItemStats(reviewData.itemId!),
      ]);

      return this.formatReview(review as Models.Document & ReviewModel);
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Update an existing review
  async updateReview(
    reviewId: string,
    reviewData: Partial<CreateReviewDataModel>
  ): Promise<ReviewModel> {
    try {
      const photoUrls = await fileUploadService.uploadPhotos(reviewData.photos);
      const updateData = this.buildUpdateData(reviewData, photoUrls);

      const review = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        reviewId,
        updateData
      );

      return this.formatReview(review as Models.Document & ReviewModel);
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Get reviews for a specific item
  async getItemReviews(
    itemId: string,
    limit = 10,
    offset = 0
  ): Promise<ReviewModel[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        [
          Query.equal('itemId', itemId),
          Query.equal('isVisible', true),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );

      return response.documents.map((doc) =>
        this.formatReview(doc as Models.Document & ReviewModel)
      );
    } catch (error) {
      console.error('Error fetching item reviews:', error);
      throw error;
    }
  },

  // Get reviews for a specific user (received reviews)
  async getUserReviews(
    userId: string,
    limit = 10,
    offset = 0
  ): Promise<ReviewModel[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        [
          Query.equal('reviewedUserId', userId),
          Query.equal('isVisible', true),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );

      return response.documents.map((doc) =>
        this.formatReview(doc as Models.Document & ReviewModel)
      );
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  },

  // Get reviews given by a user
  async getReviewsByUser(
    userId: string,
    limit = 10,
    offset = 0
  ): Promise<ReviewModel[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        [
          Query.equal('reviewerId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );

      return response.documents.map((doc) =>
        this.formatReview(doc as Models.Document & ReviewModel)
      );
    } catch (error) {
      console.error('Error fetching reviews by user:', error);
      throw error;
    }
  },

  // Get review summary for an item
  async getItemReviewSummary(itemId: string): Promise<ReviewSummaryModel> {
    try {
      const reviews = await this.getItemReviews(itemId, 100);
      return this.calculateReviewSummary(reviews);
    } catch (error) {
      console.error('Error getting item review summary:', error);
      throw error;
    }
  },

  // Check if user can review a reservation
  async canUserReview(
    reservationId: string,
    userId: string
  ): Promise<{
    canReview: boolean;
    reviewType?: 'borrower_to_owner' | 'owner_to_borrower';
  }> {
    try {
      const reservation = (await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        reservationId
      )) as Models.Document & ReservationModel;

      return this.checkReviewEligibility(reservation, userId);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: false };
    }
  },

  // Private helper methods
  validateReviewData(reviewData: CreateReviewDataModel): void {
    const requiredFields = [
      'reviewerId',
      'reviewedUserId',
      'itemId',
      'reservationId',
      'reviewType',
    ];
    const missingFields = requiredFields.filter(
      (field) => !reviewData[field as keyof CreateReviewDataModel]
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Faltan campos obligatorios: ${missingFields.join(', ')}`
      );
    }
  },

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
      const reviews = await this.getItemReviews(itemId, 1000);
      const summary = this.calculateReviewSummary(reviews);

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
