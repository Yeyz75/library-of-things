import { databases, COLLECTIONS, DATABASE_ID, ID, Query } from '../api/api';
import { userStatsAPI } from '../api/userStats';
import type {
  UserStatsModel,
  ReviewModel,
  ReservationModel,
} from '@/types/models';
import type { Models } from 'appwrite';
import { trustCalculationService } from '../utils/trustCalculationService';
import { jsonUtilsService } from '../utils/jsonUtilsService';

export const userStatsService = {
  // Get user statistics
  async getUserStats(userId: string): Promise<UserStatsModel | null> {
    try {
      const response = await userStatsAPI.getStatsByUserId(userId);

      if (!response.success) {
        // If no stats exist, create them
        return await this.createUserStats(userId);
      }

      return this.formatUserStats(
        response.data as Models.Document & UserStatsModel
      );
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  },

  async updateUserStats(userId: string) {
    try {
      const [reviews, reservations] = await Promise.all([
        this.getUserReviews(userId),
        this.getUserReservations(userId),
      ]);

      const stats = this.calculateUserStats(reviews, reservations);
      const existingStats = await this.getUserStats(userId);

      const statsData = {
        userId,
        ...stats,
        ratingDistribution: jsonUtilsService.safeJsonStringify(
          stats.ratingDistribution
        ),
        verificationBadges: jsonUtilsService.safeJsonStringify({
          emailVerified: false,
          phoneVerified: false,
          idVerified: false,
        }),
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

      // Update user document with basic stats
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
        successfulLoans: stats.successfulLoans,
        totalLoans: stats.totalLoans,
        trustLevel: stats.trustLevel,
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  },

  async createUserStats(userId: string): Promise<UserStatsModel> {
    const defaultStats = {
      userId,
      totalLoans: 0,
      successfulLoans: 0,
      cancelledLoans: 0,
      averageRating: 0,
      totalReviews: 0,
      reviewsAsOwner: 0,
      reviewsAsBorrower: 0,
      ratingDistribution: jsonUtilsService.safeJsonStringify({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      }),
      verificationBadges: jsonUtilsService.safeJsonStringify({
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
      response as unknown as Models.Document & UserStatsModel
    );
  },

  // Private helper methods
  async getUserReviews(
    userId: string
  ): Promise<(Models.Document & ReviewModel)[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.REVIEWS,
      [
        Query.equal('reviewedUserId', userId),
        Query.equal('isVisible', true),
        Query.limit(1000),
      ]
    );
    return response.documents as (Models.Document & ReviewModel)[];
  },

  async getUserReservations(
    userId: string
  ): Promise<(Models.Document & ReservationModel)[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.RESERVATIONS,
      [
        Query.or([
          Query.equal('borrowerId', userId),
          Query.equal('ownerId', userId),
        ]),
      ]
    );
    return response.documents as (Models.Document & ReservationModel)[];
  },

  calculateUserStats(
    reviews: (Models.Document & ReviewModel)[],
    reservations: (Models.Document & ReservationModel)[]
  ) {
    const totalReviews = reviews.length;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      const rating = review.overallRating!;
      ratingDistribution[rating as keyof typeof ratingDistribution]++;
      totalRating += rating;
    });

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    const totalLoans = reservations.length;
    const successfulLoans = reservations.filter(
      (r) => r.status === 'completed' || r.status === 'returned'
    ).length;
    const cancelledLoans = reservations.filter(
      (r) => r.status === 'cancelled'
    ).length;

    const trustLevel = trustCalculationService.calculateTrustLevel(
      averageRating,
      totalReviews,
      successfulLoans
    );
    const trustScore = trustCalculationService.calculateTrustScore(
      averageRating,
      totalReviews,
      successfulLoans,
      cancelledLoans
    );

    return {
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
      ratingDistribution,
      trustScore,
      trustLevel,
    };
  },

  formatUserStats(doc: Models.Document & UserStatsModel): UserStatsModel {
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
      ratingDistribution: jsonUtilsService.safeJsonParse(
        doc.ratingDistribution as unknown as string,
        { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      ),
      verificationBadges: jsonUtilsService.safeJsonParse(
        doc.verificationBadges as string,
        {
          emailVerified: false,
          phoneVerified: false,
          idVerified: false,
        }
      ),
      trustScore: doc.trustScore,
      trustLevel: doc.trustLevel,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
    };
  },
};
