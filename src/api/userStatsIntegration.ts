/**
 * Integración del módulo de estadísticas con otros servicios
 * Este archivo muestra cómo integrar las estadísticas con las acciones del usuario
 */

import { UserStatsService } from './userStats';
import type { ApiResponse } from './api';

/**
 * Hooks de integración para actualizar estadísticas automáticamente
 * Estos métodos deben ser llamados desde los respectivos servicios
 */
export class UserStatsIntegration {
  /**
   * Hook para cuando se crea un nuevo item
   * Debe ser llamado desde el servicio de items
   */
  static async handleItemCreated(
    userId: string,
    itemId: string
  ): Promise<void> {
    try {
      await UserStatsService.onItemCreated(userId);
      console.log(
        `Estadísticas actualizadas: usuario ${userId} creó item ${itemId}`
      );
    } catch (error) {
      console.error('Error actualizando estadísticas al crear item:', error);
    }
  }

  /**
   * Hook para cuando se hace una reserva
   * Debe ser llamado desde el servicio de reservas
   */
  static async handleReservationCreated(
    borrowerId: string,
    ownerId: string,
    reservationId: string
  ): Promise<void> {
    try {
      await Promise.all([
        UserStatsService.onReservationMade(borrowerId),
        UserStatsService.onReservationReceived(ownerId),
      ]);
      console.log(`Estadísticas actualizadas: reserva ${reservationId} creada`);
    } catch (error) {
      console.error('Error actualizando estadísticas al crear reserva:', error);
    }
  }

  /**
   * Hook para cuando se completa una reserva
   * Debe ser llamado desde el servicio de reservas
   */
  static async handleReservationCompleted(
    borrowerId: string,
    ownerId: string,
    reservationId: string
  ): Promise<void> {
    try {
      await UserStatsService.onReservationCompleted(borrowerId, ownerId);
      console.log(
        `Estadísticas actualizadas: reserva ${reservationId} completada`
      );
    } catch (error) {
      console.error(
        'Error actualizando estadísticas al completar reserva:',
        error
      );
    }
  }

  /**
   * Hook para cuando se cancela una reserva
   * Debe ser llamado desde el servicio de reservas
   */
  static async handleReservationCancelled(
    borrowerId: string,
    ownerId: string,
    reservationId: string
  ): Promise<void> {
    try {
      await UserStatsService.onReservationCancelled(borrowerId, ownerId);
      console.log(
        `Estadísticas actualizadas: reserva ${reservationId} cancelada`
      );
    } catch (error) {
      console.error(
        'Error actualizando estadísticas al cancelar reserva:',
        error
      );
    }
  }

  /**
   * Hook para cuando se crea una reseña
   * Debe ser llamado desde el servicio de reseñas
   */
  static async handleReviewCreated(
    reviewerId: string,
    reviewedUserId: string,
    rating: number,
    reviewId: string
  ): Promise<void> {
    try {
      await Promise.all([
        UserStatsService.onReviewGiven(reviewerId, rating),
        UserStatsService.onReviewReceived(reviewedUserId, rating),
      ]);
      console.log(`Estadísticas actualizadas: reseña ${reviewId} creada`);
    } catch (error) {
      console.error('Error actualizando estadísticas al crear reseña:', error);
    }
  }

  /**
   * Hook para cuando un usuario inicia sesión
   * Debe ser llamado desde el servicio de autenticación
   */
  static async handleUserLogin(userId: string): Promise<void> {
    try {
      await UserStatsService.onUserLogin(userId);
      console.log(`Estadísticas actualizadas: usuario ${userId} inició sesión`);
    } catch (error) {
      console.error(
        'Error actualizando estadísticas al iniciar sesión:',
        error
      );
    }
  }

  /**
   * Obtener estadísticas completas de un usuario con información adicional
   */
  static async getUserDashboardStats(userId: string): Promise<
    ApiResponse<{
      stats: Awaited<ReturnType<typeof UserStatsService.getUserStats>>['data'];
      // Aseguramos que 'data' no sea undefined antes de indexar 'achievements'
      recentAchievements: NonNullable<
        Awaited<ReturnType<typeof UserStatsService.getUserStats>>['data']
      >['achievements'];
      leaderboardPosition: {
        trust: number;
        sharing: number;
        community: number;
        activity: number;
      };
    }>
  > {
    try {
      const statsResult = await UserStatsService.getUserStats(userId);

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: 'No se pudieron obtener las estadísticas del usuario',
        };
      }

      const stats = statsResult.data;

      // Obtener logros recientes (últimos 5 completados)
      const recentAchievements = stats.achievements
        .filter((achievement) => achievement.isCompleted)
        .sort(
          (a, b) =>
            new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
        )
        .slice(0, 5);

      // Obtener posiciones en leaderboards (simplificado)
      const leaderboardPosition = {
        trust: 0, // Se calcularía comparando con otros usuarios
        sharing: 0,
        community: 0,
        activity: 0,
      };

      return {
        success: true,
        data: {
          stats,
          recentAchievements,
          leaderboardPosition,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtener métricas de progreso para gamificación
   */
  static async getUserProgressMetrics(userId: string): Promise<
    ApiResponse<{
      nextAchievements: Array<{
        // Usar NonNullable para evitar que 'data' pueda ser undefined
        achievement: NonNullable<
          Awaited<ReturnType<typeof UserStatsService.getUserStats>>['data']
        >['achievements'][0];
        progressPercentage: number;
        pointsToNext: number;
      }>;
      trustLevelProgress: {
        current: string;
        next: string;
        progressPercentage: number;
      };
      weeklyGoals: {
        itemsToCreate: number;
        reservationsToMake: number;
        reviewsToGive: number;
      };
    }>
  > {
    try {
      const statsResult = await UserStatsService.getUserStats(userId);

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: 'No se pudieron obtener las estadísticas del usuario',
        };
      }

      const stats = statsResult.data;

      // Obtener próximos logros (no completados con mayor progreso)
      const nextAchievements = stats.achievements
        .filter((achievement) => !achievement.isCompleted)
        .sort((a, b) => b.progress / b.maxProgress - a.progress / a.maxProgress)
        .slice(0, 3)
        .map((achievement) => ({
          achievement,
          progressPercentage: Math.round(
            (achievement.progress / achievement.maxProgress) * 100
          ),
          pointsToNext: achievement.maxProgress - achievement.progress,
        }));

      // Calcular progreso de trust level
      const trustLevels = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      const currentTrustIndex = Math.floor(stats.trustScore / 25);
      const currentLevel = trustLevels[Math.min(currentTrustIndex, 3)];
      const nextLevel = trustLevels[Math.min(currentTrustIndex + 1, 3)];
      const progressInCurrentLevel = stats.trustScore % 25;
      const trustLevelProgress = {
        current: currentLevel,
        next: nextLevel,
        progressPercentage: Math.round((progressInCurrentLevel / 25) * 100),
      };

      // Metas semanales sugeridas (basadas en actividad actual)
      const weeklyGoals = {
        itemsToCreate: Math.max(1, Math.floor(stats.itemsCreated / 10)),
        reservationsToMake: Math.max(
          1,
          Math.floor(stats.reservationsMade / 20)
        ),
        reviewsToGive: Math.max(1, Math.floor(stats.reviewsGiven / 15)),
      };

      return {
        success: true,
        data: {
          nextAchievements,
          trustLevelProgress,
          weeklyGoals,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Generar resumen de actividad reciente
   */
  static async getActivitySummary(
    userId: string,
    days: number = 7
  ): Promise<
    ApiResponse<{
      period: string;
      itemsCreated: number;
      reservationsMade: number;
      reviewsGiven: number;
      achievementsUnlocked: number;
      trustScoreChange: number;
    }>
  > {
    try {
      const statsResult = await UserStatsService.getUserStats(userId);

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: 'No se pudieron obtener las estadísticas del usuario',
        };
      }

      const stats = statsResult.data;
      const currentDate = new Date();
      const periodStart = new Date(
        currentDate.getTime() - days * 24 * 60 * 60 * 1000
      );

      // Obtener estadísticas del período (simplificado - en una implementación real
      // se compararían con estadísticas históricas)
      const recentAchievements = stats.achievements.filter((achievement) => {
        if (!achievement.isCompleted || !achievement.unlockedAt) return false;
        const unlockedDate = new Date(achievement.unlockedAt);
        return unlockedDate >= periodStart;
      });

      return {
        success: true,
        data: {
          period: `${days} días`,
          itemsCreated: 0, // Se calcularía con datos históricos
          reservationsMade: 0, // Se calcularía con datos históricos
          reviewsGiven: 0, // Se calcularía con datos históricos
          achievementsUnlocked: recentAchievements.length,
          trustScoreChange: 0, // Se calcularía comparando con valor anterior
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}

/**
 * Utilidades para formatear y mostrar estadísticas
 */
export class UserStatsFormatter {
  /**
   * Formatear trust score para mostrar
   */
  static formatTrustScore(trustScore: number): string {
    if (trustScore >= 90) return '🏆 Excelente';
    if (trustScore >= 75) return '⭐ Muy Bueno';
    if (trustScore >= 60) return '👍 Bueno';
    if (trustScore >= 40) return '📈 En Progreso';
    return '🔰 Nuevo';
  }

  /**
   * Formatear nivel de confianza
   */
  static formatTrustLevel(trustScore: number): {
    level: string;
    color: string;
    icon: string;
  } {
    if (trustScore >= 75) {
      return { level: 'Platinum', color: '#E5E7EB', icon: '💎' };
    }
    if (trustScore >= 60) {
      return { level: 'Gold', color: '#FCD34D', icon: '🥇' };
    }
    if (trustScore >= 40) {
      return { level: 'Silver', color: '#9CA3AF', icon: '🥈' };
    }
    return { level: 'Bronze', color: '#CD7C2F', icon: '🥉' };
  }

  /**
   * Formatear progreso de logro
   */
  static formatAchievementProgress(
    progress: number,
    maxProgress: number
  ): string {
    const percentage = Math.round((progress / maxProgress) * 100);
    return `${progress}/${maxProgress} (${percentage}%)`;
  }

  /**
   * Obtener mensaje motivacional basado en estadísticas
   */
  static getMotivationalMessage(
    stats: Awaited<ReturnType<typeof UserStatsService.getUserStats>>['data']
  ): string {
    if (!stats) return '¡Bienvenido a la comunidad!';

    if (stats.itemsCreated === 0) {
      return '¡Comparte tu primer item y comienza a ayudar a la comunidad!';
    }

    if (stats.reservationsMade === 0) {
      return '¡Haz tu primera reserva y descubre lo fácil que es compartir!';
    }

    if (stats.reviewsGiven === 0) {
      return '¡Deja tu primera reseña y ayuda a otros usuarios!';
    }

    if (stats.trustScore < 50) {
      return '¡Sigue participando para mejorar tu nivel de confianza!';
    }

    if (stats.totalAchievements < 3) {
      return '¡Estás progresando genial! Sigue desbloqueando logros.';
    }

    return '¡Eres un miembro valioso de nuestra comunidad! 🌟';
  }
}
