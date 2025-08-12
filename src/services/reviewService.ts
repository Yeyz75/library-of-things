import { databases, COLLECTIONS, ID, Query, DATABASE_ID } from '../api/api';
import { reviewsAPI } from '../api/reviews';
import type {
  ReviewModel,
  CreateReviewDataModel,
  ReviewSummaryModel,
  ReservationModel,
} from '@/types/models';
import type { Models } from 'appwrite';
import { userStatsService } from './userStatsService';
import { fileUploadService } from './fileUploadService';
import { reviewValidator } from './reviewValidator';
import { reviewFormatter } from './reviewFormatter';
import { reviewBuilder } from './reviewBuilder';
import { reviewUpdater } from './reviewUpdater';
import { reviewCalculator } from './reviewCalculator';

export const reviewService = {
  // Check if user already has a review for this reservation
  async getExistingReview(
    reservationId: string,
    reviewerId: string
  ): Promise<ReviewModel | null> {
    try {
      const response = await reviewsAPI.getReviewsByReservation(reservationId);

      if (!response.success || !response.data) {
        return null;
      }

      const existingReview = response.data.documents.find(
        (review) => review.reviewerId === reviewerId
      );

      return existingReview
        ? reviewFormatter.formatReview(
            existingReview as Models.Document & ReviewModel
          )
        : null;
    } catch (error) {
      console.error('Error checking existing review:', error);
      return null;
    }
  },

  // Create a new review
  async createReview(reviewData: CreateReviewDataModel): Promise<ReviewModel> {
    reviewValidator.validateReviewData(reviewData);

    try {
      const photoUrls = await fileUploadService.uploadPhotos(reviewData.photos);
      const reviewDocumentData = await reviewBuilder.buildReviewDocument(
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
        reviewUpdater.updateReservationReviewStatus(
          reviewData.reservationId!,
          reviewData.reviewType!
        ),
        userStatsService.updateUserStats(reviewData.reviewedUserId!),
        reviewUpdater.updateItemStats(reviewData.itemId!),
      ]);

      return reviewFormatter.formatReview(
        review as Models.Document & ReviewModel
      );
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
      const updateData = reviewUpdater.buildUpdateData(reviewData, photoUrls);

      const review = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        reviewId,
        updateData
      );

      return reviewFormatter.formatReview(
        review as Models.Document & ReviewModel
      );
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
        reviewFormatter.formatReview(doc as Models.Document & ReviewModel)
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
        reviewFormatter.formatReview(doc as Models.Document & ReviewModel)
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
        reviewFormatter.formatReview(doc as Models.Document & ReviewModel)
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
      return reviewCalculator.calculateReviewSummary(reviews);
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

      return reviewCalculator.checkReviewEligibility(reservation, userId);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: false };
    }
  },

  // Calculate review summary (needed for updateItemStats)
  calculateReviewSummary(reviews: ReviewModel[]): ReviewSummaryModel {
    return reviewCalculator.calculateReviewSummary(reviews);
  },
};
