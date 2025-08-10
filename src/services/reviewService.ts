import {
  databases,
  storage,
  COLLECTIONS,
  DATABASE_ID,
  BUCKET_ID,
  ID,
  Query,
} from '../lib/appwrite';
import type {
  Review,
  CreateReviewData,
  ReviewSummary,
  UserStats,
  User,
  Item,
  Reservation,
} from '../types';
import type { Models } from 'appwrite';

export const reviewService = {
  // Create a new review
  async createReview(reviewData: CreateReviewData): Promise<Review> {
    try {
      // Upload photos if provided
      let photoUrls: string[] = [];
      if (reviewData.photos && reviewData.photos.length > 0) {
        const uploadPromises = reviewData.photos.map(async (photo) => {
          const response = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            photo
          );
          return storage.getFileView(BUCKET_ID, response.$id).toString();
        });
        photoUrls = await Promise.all(uploadPromises);
      }

      // Get reviewer and reviewed user names
      const [reviewer, reviewedUser] = await Promise.all([
        databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          reviewData.reviewerId
        ) as Promise<Models.Document & User>,
        databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          reviewData.reviewedUserId
        ) as Promise<Models.Document & User>,
      ]);

      // Get item title
      const item = (await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        reviewData.itemId
      )) as Models.Document & Item;

      const review = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.REVIEWS,
        ID.unique(),
        {
          reservationId: reviewData.reservationId,
          itemId: reviewData.itemId,
          itemTitle: item.title,
          reviewerId: reviewData.reviewerId,
          reviewerName: reviewer.name || reviewer.email,
          reviewedUserId: reviewData.reviewedUserId,
          reviewedUserName: reviewedUser.name || reviewedUser.email,
          reviewType: reviewData.reviewType,
          overallRating: reviewData.overallRating,
          aspectRatings: JSON.stringify(reviewData.aspectRatings),
          comment: reviewData.comment,
          photos: photoUrls.length > 0 ? JSON.stringify(photoUrls) : null,
          isVisible: true,
        }
      );

      // Update reservation review status
      await this.updateReservationReviewStatus(
        reviewData.reservationId,
        reviewData.reviewType
      );

      // Update user and item statistics
      await Promise.all([
        this.updateUserStats(reviewData.reviewedUserId),
        this.updateItemStats(reviewData.itemId),
      ]);

      return this.formatReview(
        review as unknown as Models.Document & {
          reservationId: string;
          itemId: string;
          itemTitle: string;
          reviewerId: string;
          reviewerName: string;
          reviewedUserId: string;
          reviewedUserName: string;
          reviewType: 'borrower_to_owner' | 'owner_to_borrower';
          overallRating: number;
          aspectRatings: string;
          comment: string;
          photos?: string;
          isVisible: boolean;
        }
      );
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Get reviews for a specific item
  async getItemReviews(
    itemId: string,
    limit = 10,
    offset = 0
  ): Promise<Review[]> {
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
        this.formatReview(
          doc as unknown as Models.Document & {
            reservationId: string;
            itemId: string;
            itemTitle: string;
            reviewerId: string;
            reviewerName: string;
            reviewedUserId: string;
            reviewedUserName: string;
            reviewType: 'borrower_to_owner' | 'owner_to_borrower';
            overallRating: number;
            aspectRatings: string;
            comment: string;
            photos?: string;
            isVisible: boolean;
          }
        )
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
  ): Promise<Review[]> {
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
        this.formatReview(
          doc as unknown as Models.Document & {
            reservationId: string;
            itemId: string;
            itemTitle: string;
            reviewerId: string;
            reviewerName: string;
            reviewedUserId: string;
            reviewedUserName: string;
            reviewType: 'borrower_to_owner' | 'owner_to_borrower';
            overallRating: number;
            aspectRatings: string;
            comment: string;
            photos?: string;
            isVisible: boolean;
          }
        )
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
  ): Promise<Review[]> {
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
        this.formatReview(
          doc as unknown as Models.Document & {
            reservationId: string;
            itemId: string;
            itemTitle: string;
            reviewerId: string;
            reviewerName: string;
            reviewedUserId: string;
            reviewedUserName: string;
            reviewType: 'borrower_to_owner' | 'owner_to_borrower';
            overallRating: number;
            aspectRatings: string;
            comment: string;
            photos?: string;
            isVisible: boolean;
          }
        )
      );
    } catch (error) {
      console.error('Error fetching reviews by user:', error);
      throw error;
    }
  },

  // Get review summary for an item
  async getItemReviewSummary(itemId: string): Promise<ReviewSummary> {
    try {
      const reviews = await this.getItemReviews(itemId, 100); // Get more for accurate stats
      const recentReviews = reviews.slice(0, 5);

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRating = 0;

      reviews.forEach((review) => {
        const rating = review.overallRating;
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
        totalRating += rating;
      });

      const averageRating =
        reviews.length > 0 ? totalRating / reviews.length : 0;

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingDistribution,
        recentReviews,
      };
    } catch (error) {
      console.error('Error getting item review summary:', error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_STATS,
        [Query.equal('userId', userId)]
      );

      if (response.documents.length === 0) {
        return await this.createUserStats(userId);
      }

      return this.formatUserStats(
        response.documents[0] as unknown as Models.Document & {
          userId: string;
          totalLoans: number;
          successfulLoans: number;
          cancelledLoans: number;
          averageRating: number;
          totalReviews: number;
          reviewsAsOwner: number;
          reviewsAsBorrower: number;
          ratingDistribution: string;
          verificationBadges: string;
          trustScore: number;
          trustLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
        }
      );
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
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
      )) as Models.Document & Reservation;

      // Only completed reservations can be reviewed
      if (
        reservation.status !== 'completed' &&
        reservation.status !== 'returned'
      ) {
        return { canReview: false };
      }

      // Check if user is borrower or owner
      let reviewType: 'borrower_to_owner' | 'owner_to_borrower';
      let alreadyReviewed: boolean;

      if (reservation.borrowerId === userId) {
        reviewType = 'borrower_to_owner';
        alreadyReviewed = reservation.isReviewedByBorrower || false;
      } else if (reservation.ownerId === userId) {
        reviewType = 'owner_to_borrower';
        alreadyReviewed = reservation.isReviewedByOwner || false;
      } else {
        return { canReview: false };
      }

      return {
        canReview: !alreadyReviewed,
        reviewType: alreadyReviewed ? undefined : reviewType,
      };
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: false };
    }
  },

  // Private helper methods
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

  async updateUserStats(userId: string) {
    try {
      // Get all reviews for this user
      const reviews = await this.getUserReviews(userId, 1000);

      // Calculate statistics
      const totalReviews = reviews.length;
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRating = 0;

      reviews.forEach((review) => {
        const rating = review.overallRating;
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
        totalRating += rating;
      });

      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      // Get loan statistics
      const reservations = (await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        [
          Query.or([
            Query.equal('borrowerId', userId),
            Query.equal('ownerId', userId),
          ]),
        ]
      )) as Models.DocumentList<Models.Document & Reservation>;

      const totalLoans = reservations.documents.length;
      const successfulLoans = reservations.documents.filter(
        (r) => r.status === 'completed' || r.status === 'returned'
      ).length;
      const cancelledLoans = reservations.documents.filter(
        (r) => r.status === 'cancelled'
      ).length;

      // Calculate trust level
      const trustLevel = this.calculateTrustLevel(
        averageRating,
        totalReviews,
        successfulLoans
      );
      const trustScore = this.calculateTrustScore(
        averageRating,
        totalReviews,
        successfulLoans,
        cancelledLoans
      );

      // Update or create user stats
      const existingStats = await this.getUserStats(userId);
      const statsData = {
        userId,
        totalLoans,
        successfulLoans,
        cancelledLoans,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        reviewsAsOwner: reviews.filter(
          (r) => r.reviewType === 'borrower_to_owner'
        ).length,
        reviewsAsBorrower: reviews.filter(
          (r) => r.reviewType === 'owner_to_borrower'
        ).length,
        ratingDistribution: JSON.stringify(ratingDistribution),
        verificationBadges: JSON.stringify({
          emailVerified: false,
          phoneVerified: false,
          idVerified: false,
        }),
        trustScore,
        trustLevel,
      };

      if (existingStats) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.USER_STATS,
          existingStats.$id,
          statsData
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_STATS,
          ID.unique(),
          statsData
        );
      }

      // Also update user document with basic stats
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        successfulLoans,
        totalLoans,
        trustLevel,
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  },

  async updateItemStats(itemId: string) {
    try {
      const reviews = await this.getItemReviews(itemId, 1000);
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRating = 0;

      reviews.forEach((review) => {
        const rating = review.overallRating;
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
        totalRating += rating;
      });

      const averageRating =
        reviews.length > 0 ? totalRating / reviews.length : 0;

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.ITEMS, itemId, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingDistribution: JSON.stringify(ratingDistribution),
      });
    } catch (error) {
      console.error('Error updating item stats:', error);
    }
  },

  async createUserStats(userId: string): Promise<UserStats> {
    const defaultStats = {
      userId,
      totalLoans: 0,
      successfulLoans: 0,
      cancelledLoans: 0,
      averageRating: 0,
      totalReviews: 0,
      reviewsAsOwner: 0,
      reviewsAsBorrower: 0,
      ratingDistribution: JSON.stringify({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }),
      verificationBadges: JSON.stringify({
        emailVerified: false,
        phoneVerified: false,
        idVerified: false,
      }),
      trustScore: 0,
      trustLevel: 'Bronze' as const,
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USER_STATS,
      ID.unique(),
      defaultStats
    );

    return this.formatUserStats(
      response as unknown as Models.Document & {
        userId: string;
        totalLoans: number;
        successfulLoans: number;
        cancelledLoans: number;
        averageRating: number;
        totalReviews: number;
        reviewsAsOwner: number;
        reviewsAsBorrower: number;
        ratingDistribution: string;
        verificationBadges: string;
        trustScore: number;
        trustLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
      }
    );
  },

  calculateTrustLevel(
    averageRating: number,
    totalReviews: number,
    successfulLoans: number
  ): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
    if (averageRating >= 4.8 && totalReviews >= 20 && successfulLoans >= 15)
      return 'Platinum';
    if (averageRating >= 4.5 && totalReviews >= 10 && successfulLoans >= 8)
      return 'Gold';
    if (averageRating >= 4.0 && totalReviews >= 5 && successfulLoans >= 3)
      return 'Silver';
    return 'Bronze';
  },

  calculateTrustScore(
    averageRating: number,
    totalReviews: number,
    successfulLoans: number,
    cancelledLoans: number
  ): number {
    const ratingScore = (averageRating / 5) * 40; // Max 40 points
    const reviewScore = Math.min(totalReviews * 2, 30); // Max 30 points
    const loanScore = Math.min(successfulLoans * 2, 25); // Max 25 points
    const penaltyScore = Math.max(0, 5 - cancelledLoans * 2); // Max 5 points, penalty for cancellations

    return Math.round(ratingScore + reviewScore + loanScore + penaltyScore);
  },

  formatReview(
    doc: Models.Document & {
      reservationId: string;
      itemId: string;
      itemTitle: string;
      reviewerId: string;
      reviewerName: string;
      reviewedUserId: string;
      reviewedUserName: string;
      reviewType: 'borrower_to_owner' | 'owner_to_borrower';
      overallRating: number;
      aspectRatings: string;
      comment: string;
      photos?: string;
      isVisible: boolean;
    }
  ): Review {
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
      aspectRatings: JSON.parse(doc.aspectRatings),
      comment: doc.comment,
      photos: doc.photos ? JSON.parse(doc.photos) : undefined,
      isVisible: doc.isVisible,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
    };
  },

  formatUserStats(
    doc: Models.Document & {
      userId: string;
      totalLoans: number;
      successfulLoans: number;
      cancelledLoans: number;
      averageRating: number;
      totalReviews: number;
      reviewsAsOwner: number;
      reviewsAsBorrower: number;
      ratingDistribution: string;
      verificationBadges: string;
      trustScore: number;
      trustLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    }
  ): UserStats {
    return {
      $id: doc.$id,
      userId: doc.userId,
      totalLoans: doc.totalLoans,
      successfulLoans: doc.successfulLoans,
      cancelledLoans: doc.cancelledLoans,
      averageRating: doc.averageRating,
      totalReviews: doc.totalReviews,
      reviewsAsOwner: doc.reviewsAsOwner,
      reviewsAsBorrower: doc.reviewsAsBorrower,
      ratingDistribution: JSON.parse(doc.ratingDistribution),
      verificationBadges: JSON.parse(doc.verificationBadges),
      trustScore: doc.trustScore,
      trustLevel: doc.trustLevel,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
    };
  },
};
