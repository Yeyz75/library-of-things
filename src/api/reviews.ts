import { apiResource, COLLECTIONS, Query, type ApiResponse } from './api';
import type { ReviewModel, ReviewTypeModel } from '@/types/models';

// Endpoint para reviews
const endpoint = COLLECTIONS.REVIEWS;

// Exportar métodos estándar usando destructuring
export const { index, show, save, update, remove, search, count } =
  apiResource<ReviewModel>(endpoint);

// Métodos adicionales específicos para reviews
export const reviewsAPI = {
  // Obtener reviews por tipo
  async getReviewsByType(
    reviewType: ReviewTypeModel
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return index({
      filters: [Query.equal('reviewType', reviewType)],
    });
  },

  // Obtener reviews por reviewer (quien hace la review)
  async getReviewsByReviewer(
    reviewerId: string
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return index({
      filters: [Query.equal('reviewerId', reviewerId)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Obtener reviews por usuario revisado
  async getReviewsByReviewedUser(
    reviewedUserId: string
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return index({
      filters: [Query.equal('reviewedUserId', reviewedUserId)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Obtener reviews por item
  async getReviewsByItem(
    itemId: string
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return index({
      filters: [Query.equal('itemId', itemId)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Obtener reviews por reserva
  async getReviewsByReservation(
    reservationId: string
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return index({
      filters: [Query.equal('reservationId', reservationId)],
    });
  },

  // Obtener reviews por rating
  async getReviewsByRating(
    rating: number
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return index({
      filters: [Query.equal('overallRating', rating)],
    });
  },

  // Obtener reviews con rating mínimo
  async getReviewsWithMinRating(
    minRating: number
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return index({
      filters: [Query.greaterThanEqual('overallRating', minRating)],
      orderBy: 'overallRating',
      orderType: 'DESC',
    });
  },

  // Obtener reviews visibles
  async getVisibleReviews(): Promise<
    ApiResponse<{ documents: ReviewModel[]; total: number }>
  > {
    return index({
      filters: [Query.equal('isVisible', true)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Obtener reviews recientes
  async getRecentReviews(
    limit = 10
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return index({
      limit,
      filters: [Query.equal('isVisible', true)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Buscar reviews por comentario
  async searchByComment(
    searchTerm: string
  ): Promise<ApiResponse<{ documents: ReviewModel[]; total: number }>> {
    return search('comment', searchTerm);
  },

  // Obtener estadísticas de reviews para un usuario
  async getUserReviewStats(userId: string): Promise<
    ApiResponse<{
      totalReviews: number;
      averageRating: number;
      ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      };
      reviewsAsOwner: number;
      reviewsAsBorrower: number;
    }>
  > {
    try {
      const reviewsResponse = await getReviewsByReviewedUser(userId);

      if (!reviewsResponse.success || !reviewsResponse.data) {
        return {
          success: false,
          error: 'Error al obtener reviews del usuario',
        };
      }

      const reviews = reviewsResponse.data.documents;
      const totalReviews = reviews.length;

      if (totalReviews === 0) {
        return {
          success: true,
          data: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            reviewsAsOwner: 0,
            reviewsAsBorrower: 0,
          },
        };
      }

      // Calcular estadísticas
      const ratingSum = reviews.reduce(
        (sum, review) => sum + (review.overallRating || 0),
        0
      );
      const averageRating = ratingSum / totalReviews;

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let reviewsAsOwner = 0;
      let reviewsAsBorrower = 0;

      reviews.forEach((review) => {
        const rating = review.overallRating || 0;
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating as keyof typeof ratingDistribution]++;
        }

        if (review.reviewType === 'borrower_to_owner') {
          reviewsAsOwner++;
        } else if (review.reviewType === 'owner_to_borrower') {
          reviewsAsBorrower++;
        }
      });

      return {
        success: true,
        data: {
          totalReviews,
          averageRating: Math.round(averageRating * 100) / 100,
          ratingDistribution,
          reviewsAsOwner,
          reviewsAsBorrower,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al calcular estadísticas',
      };
    }
  },

  // Obtener estadísticas de reviews para un item
  async getItemReviewStats(itemId: string): Promise<
    ApiResponse<{
      totalReviews: number;
      averageRating: number;
      ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      };
    }>
  > {
    try {
      const reviewsResponse = await getReviewsByItem(itemId);

      if (!reviewsResponse.success || !reviewsResponse.data) {
        return { success: false, error: 'Error al obtener reviews del item' };
      }

      const reviews = reviewsResponse.data.documents;
      const totalReviews = reviews.length;

      if (totalReviews === 0) {
        return {
          success: true,
          data: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          },
        };
      }

      const ratingSum = reviews.reduce(
        (sum, review) => sum + (review.overallRating || 0),
        0
      );
      const averageRating = ratingSum / totalReviews;

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach((review) => {
        const rating = review.overallRating || 0;
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating as keyof typeof ratingDistribution]++;
        }
      });

      return {
        success: true,
        data: {
          totalReviews,
          averageRating: Math.round(averageRating * 100) / 100,
          ratingDistribution,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al calcular estadísticas',
      };
    }
  },

  // Actualizar visibilidad de review
  async updateVisibility(
    reviewId: string,
    isVisible: boolean
  ): Promise<ApiResponse<ReviewModel>> {
    return update(reviewId, { isVisible });
  },

  // Actualizar fotos de review
  async updatePhotos(
    reviewId: string,
    photos: string[]
  ): Promise<ApiResponse<ReviewModel>> {
    return update(reviewId, { photos });
  },
};

// Exportar también los métodos adicionales individualmente
export const {
  getReviewsByType,
  getReviewsByReviewer,
  getReviewsByReviewedUser,
  getReviewsByItem,
  getReviewsByReservation,
  getReviewsByRating,
  getReviewsWithMinRating,
  getVisibleReviews,
  getRecentReviews,
  searchByComment,
  getUserReviewStats,
  getItemReviewStats,
  updateVisibility,
  updatePhotos,
} = reviewsAPI;
