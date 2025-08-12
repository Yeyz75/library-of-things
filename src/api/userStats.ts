import { apiResource, COLLECTIONS, Query, type ApiResponse } from './api';
import type { UserStatsModel, TrustLevelModel } from '@/types/models';

// Endpoint para user stats
const endpoint = COLLECTIONS.USER_STATS;

// Exportar métodos estándar usando destructuring
export const { index, show, save, update, remove, search, count } =
  apiResource<UserStatsModel>(endpoint);

// Métodos adicionales específicos para user stats
export const userStatsAPI = {
  // Obtener estadísticas por userId
  async getStatsByUserId(userId: string): Promise<ApiResponse<UserStatsModel>> {
    return show(userId); // Asumiendo que $id === userId
  },

  // Obtener usuarios por nivel de confianza
  async getUsersByTrustLevel(
    trustLevel: TrustLevelModel
  ): Promise<ApiResponse<{ documents: UserStatsModel[]; total: number }>> {
    return index({
      filters: [Query.equal('trustLevel', trustLevel)],
    });
  },

  // Obtener usuarios con mejor trust score
  async getTopTrustedUsers(
    limit = 10
  ): Promise<ApiResponse<{ documents: UserStatsModel[]; total: number }>> {
    return index({
      limit,
      orderBy: 'trustScore',
      orderType: 'DESC',
      filters: [Query.greaterThan('trustScore', 0)],
    });
  },

  // Obtener usuarios con más préstamos exitosos
  async getUsersWithMostSuccessfulLoans(
    limit = 10
  ): Promise<ApiResponse<{ documents: UserStatsModel[]; total: number }>> {
    return index({
      limit,
      orderBy: 'successfulLoans',
      orderType: 'DESC',
    });
  },

  // Obtener usuarios con mejor rating promedio
  async getUsersWithBestRating(
    limit = 10,
    minReviews = 5
  ): Promise<ApiResponse<{ documents: UserStatsModel[]; total: number }>> {
    return index({
      limit,
      orderBy: 'averageRating',
      orderType: 'DESC',
      filters: [Query.greaterThanEqual('totalReviews', minReviews)],
    });
  },

  // Obtener usuarios verificados
  async getVerifiedUsers(): Promise<
    ApiResponse<{ documents: UserStatsModel[]; total: number }>
  > {
    return index({
      filters: [Query.equal('verificationBadges.emailVerified', true)],
    });
  },

  // Actualizar estadísticas de préstamos
  async updateLoanStats(
    userId: string,
    stats: {
      totalLoans?: number;
      successfulLoans?: number;
      cancelledLoans?: number;
    }
  ): Promise<ApiResponse<UserStatsModel>> {
    return update(userId, stats);
  },

  // Actualizar estadísticas de reviews
  async updateReviewStats(
    userId: string,
    stats: {
      averageRating?: number;
      totalReviews?: number;
      reviewsAsOwner?: number;
      reviewsAsBorrower?: number;
      ratingDistribution?: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      };
    }
  ): Promise<ApiResponse<UserStatsModel>> {
    return update(userId, stats);
  },

  // Actualizar badges de verificación
  async updateVerificationBadges(
    userId: string,
    badges: {
      emailVerified?: boolean;
      phoneVerified?: boolean;
      idVerified?: boolean;
    }
  ): Promise<ApiResponse<UserStatsModel>> {
    return update(userId, { verificationBadges: badges });
  },

  // Actualizar trust score y level
  async updateTrustMetrics(
    userId: string,
    trustScore: number,
    trustLevel: TrustLevelModel
  ): Promise<ApiResponse<UserStatsModel>> {
    return update(userId, { trustScore, trustLevel });
  },

  // Incrementar préstamos totales
  async incrementTotalLoans(
    userId: string
  ): Promise<ApiResponse<UserStatsModel>> {
    try {
      const statsResponse = await show(userId);
      if (!statsResponse.success || !statsResponse.data) {
        return {
          success: false,
          error: 'No se pudieron obtener las estadísticas del usuario',
        };
      }

      const currentStats = statsResponse.data;
      const newTotalLoans = (currentStats.totalLoans || 0) + 1;

      return update(userId, { totalLoans: newTotalLoans });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al incrementar préstamos',
      };
    }
  },

  // Incrementar préstamos exitosos
  async incrementSuccessfulLoans(
    userId: string
  ): Promise<ApiResponse<UserStatsModel>> {
    try {
      const statsResponse = await show(userId);
      if (!statsResponse.success || !statsResponse.data) {
        return {
          success: false,
          error: 'No se pudieron obtener las estadísticas del usuario',
        };
      }

      const currentStats = statsResponse.data;
      const newSuccessfulLoans = (currentStats.successfulLoans || 0) + 1;

      return update(userId, { successfulLoans: newSuccessfulLoans });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al incrementar préstamos exitosos',
      };
    }
  },

  // Calcular y actualizar trust score basado en métricas
  async calculateAndUpdateTrustScore(
    userId: string
  ): Promise<ApiResponse<UserStatsModel>> {
    try {
      const statsResponse = await show(userId);
      if (!statsResponse.success || !statsResponse.data) {
        return {
          success: false,
          error: 'No se pudieron obtener las estadísticas del usuario',
        };
      }

      const stats = statsResponse.data;

      // Algoritmo simple para calcular trust score (0-100)
      let trustScore = 0;

      // Base score por verificaciones
      if (stats.verificationBadges?.emailVerified) trustScore += 20;
      if (stats.verificationBadges?.phoneVerified) trustScore += 15;
      if (stats.verificationBadges?.idVerified) trustScore += 15;

      // Score por rating promedio
      if (stats.averageRating && stats.totalReviews && stats.totalReviews > 0) {
        trustScore += (stats.averageRating / 5) * 30;
      }

      // Score por préstamos exitosos
      if (stats.totalLoans && stats.totalLoans > 0) {
        const successRate = (stats.successfulLoans || 0) / stats.totalLoans;
        trustScore += successRate * 20;
      }

      // Determinar trust level
      let trustLevel: TrustLevelModel = 'Bronze';
      if (trustScore >= 80) trustLevel = 'Platinum';
      else if (trustScore >= 65) trustLevel = 'Gold';
      else if (trustScore >= 45) trustLevel = 'Silver';

      return update(userId, { trustScore: Math.round(trustScore), trustLevel });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al calcular trust score',
      };
    }
  },

  // Crear estadísticas iniciales para un nuevo usuario
  async createInitialStats(
    userId: string
  ): Promise<ApiResponse<UserStatsModel>> {
    const initialStats = {
      userId,
      totalLoans: 0,
      successfulLoans: 0,
      cancelledLoans: 0,
      averageRating: 0,
      totalReviews: 0,
      reviewsAsOwner: 0,
      reviewsAsBorrower: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      verificationBadges: {
        emailVerified: false,
        phoneVerified: false,
        idVerified: false,
      },
      trustScore: 0,
      trustLevel: 'Bronze' as TrustLevelModel,
    };

    return save(initialStats, userId);
  },
};

// Exportar también los métodos adicionales individualmente
export const {
  getStatsByUserId,
  getUsersByTrustLevel,
  getTopTrustedUsers,
  getUsersWithMostSuccessfulLoans,
  getUsersWithBestRating,
  getVerifiedUsers,
  updateLoanStats,
  updateReviewStats,
  updateVerificationBadges,
  updateTrustMetrics,
  incrementTotalLoans,
  incrementSuccessfulLoans,
  calculateAndUpdateTrustScore,
  createInitialStats,
} = userStatsAPI;
