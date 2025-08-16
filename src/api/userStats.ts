import {
  COLLECTIONS,
  handleApiError,
  handleApiSuccess,
  withRetry,
  type ApiResponse,
  type BaseEntity,
} from './api';
import { DatabaseService } from './database';

// Interfaz extendida para estadísticas de usuario con métricas completas
export interface UserStats extends BaseEntity {
  userId: string;

  // Estadísticas de items
  itemsCreated: number;
  itemsRented: number;
  itemsShared: number;

  // Estadísticas de reservas
  reservationsMade: number;
  reservationsReceived: number;
  reservationsCompleted: number;
  reservationsCancelled: number;

  // Estadísticas de reseñas
  reviewsGiven: number;
  reviewsReceived: number;
  averageRatingGiven: number;
  averageRatingReceived: number;

  // Métricas financieras
  totalEarnings: number;
  totalSpent: number;

  // Sistema de logros
  achievements: Achievement[];
  totalAchievements: number;

  // Métricas de actividad
  lastActivity: string;
  totalLogins: number;
  daysActive: number;

  // Ranking y posición
  trustScore: number;
  communityRank: number;

  // Datos históricos
  monthlyStats: MonthlyStats[];
}

// Interfaz para logros
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'sharing' | 'community' | 'trust' | 'activity' | 'milestone';
  unlockedAt: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
}

// Interfaz para estadísticas mensuales
export interface MonthlyStats {
  month: string; // YYYY-MM format
  itemsCreated: number;
  reservationsMade: number;
  reservationsReceived: number;
  reviewsGiven: number;
  reviewsReceived: number;
  earnings: number;
  spent: number;
}

// Interfaz para métricas de leaderboard
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  category: 'trust' | 'sharing' | 'community' | 'activity';
}

// Interfaz para reportes de estadísticas
export interface StatsReport {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  totalUsers: number;
  activeUsers: number;
  totalItems: number;
  totalReservations: number;
  totalReviews: number;
  averageRating: number;
  topCategories: Array<{ category: string; count: number }>;
  topUsers: LeaderboardEntry[];
}

// Configuración de logros disponibles
const AVAILABLE_ACHIEVEMENTS: Omit<
  Achievement,
  'unlockedAt' | 'progress' | 'isCompleted'
>[] = [
  {
    id: 'first_item',
    name: 'Primer Compartir',
    description: 'Comparte tu primer item con la comunidad',
    icon: '🎯',
    category: 'sharing',
    maxProgress: 1,
  },
  {
    id: 'item_creator_5',
    name: 'Creador Activo',
    description: 'Comparte 5 items diferentes',
    icon: '📦',
    category: 'sharing',
    maxProgress: 5,
  },
  {
    id: 'item_creator_25',
    name: 'Super Compartidor',
    description: 'Comparte 25 items diferentes',
    icon: '🏆',
    category: 'sharing',
    maxProgress: 25,
  },
  {
    id: 'first_reservation',
    name: 'Primera Reserva',
    description: 'Realiza tu primera reserva',
    icon: '📅',
    category: 'activity',
    maxProgress: 1,
  },
  {
    id: 'reservation_master_10',
    name: 'Reservador Experto',
    description: 'Completa 10 reservas exitosas',
    icon: '⭐',
    category: 'activity',
    maxProgress: 10,
  },
  {
    id: 'trusted_member',
    name: 'Miembro Confiable',
    description: 'Alcanza una calificación promedio de 4.5',
    icon: '🛡️',
    category: 'trust',
    maxProgress: 45, // 4.5 * 10 para evitar decimales
  },
  {
    id: 'community_helper',
    name: 'Ayudante Comunitario',
    description: 'Recibe 50 reseñas positivas',
    icon: '🤝',
    category: 'community',
    maxProgress: 50,
  },
  {
    id: 'active_member_30',
    name: 'Miembro Activo',
    description: 'Mantente activo por 30 días',
    icon: '🔥',
    category: 'activity',
    maxProgress: 30,
  },
  {
    id: 'milestone_100_earnings',
    name: 'Primer Centenar',
    description: 'Gana tu primer $100 compartiendo',
    icon: '💰',
    category: 'milestone',
    maxProgress: 100,
  },
];

/**
 * Servicio para gestión de estadísticas de usuario
 */
export class UserStatsService {
  /**
   * Obtener estadísticas de un usuario
   */
  static async getUserStats(userId: string): Promise<ApiResponse<UserStats>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<UserStats>(new Error('ID de usuario requerido'));
    }

    try {
      const result = await DatabaseService.read<UserStats>(
        COLLECTIONS.USER_STATS,
        userId.trim()
      );

      if (!result.success && result.error?.includes('no encontrado')) {
        // Si no existen estadísticas, crear unas por defecto
        return this.createDefaultStats(userId.trim());
      }

      return result;
    } catch (error) {
      return handleApiError<UserStats>(error);
    }
  }

  /**
   * Crear estadísticas por defecto para un nuevo usuario
   */
  static async createDefaultStats(
    userId: string
  ): Promise<ApiResponse<UserStats>> {
    const defaultStats: Omit<UserStats, '$id' | 'createdAt' | 'updatedAt'> = {
      userId,
      itemsCreated: 0,
      itemsRented: 0,
      itemsShared: 0,
      reservationsMade: 0,
      reservationsReceived: 0,
      reservationsCompleted: 0,
      reservationsCancelled: 0,
      reviewsGiven: 0,
      reviewsReceived: 0,
      averageRatingGiven: 0,
      averageRatingReceived: 0,
      totalEarnings: 0,
      totalSpent: 0,
      achievements: [],
      totalAchievements: 0,
      lastActivity: new Date().toISOString(),
      totalLogins: 1,
      daysActive: 1,
      trustScore: 50, // Score inicial neutral
      communityRank: 0,
      monthlyStats: [],
    };

    return DatabaseService.create<UserStats>(
      COLLECTIONS.USER_STATS,
      defaultStats,
      userId
    );
  }

  /**
   * Actualizar estadísticas cuando un usuario crea un item
   */
  static async onItemCreated(userId: string): Promise<ApiResponse<UserStats>> {
    return this.updateStats(userId, {
      itemsCreated: 1,
    });
  }

  /**
   * Actualizar estadísticas cuando un usuario hace una reserva
   */
  static async onReservationMade(
    userId: string
  ): Promise<ApiResponse<UserStats>> {
    return this.updateStats(userId, {
      reservationsMade: 1,
    });
  }

  /**
   * Actualizar estadísticas cuando un usuario recibe una reserva
   */
  static async onReservationReceived(
    userId: string
  ): Promise<ApiResponse<UserStats>> {
    return this.updateStats(userId, {
      reservationsReceived: 1,
    });
  }

  /**
   * Actualizar estadísticas cuando se completa una reserva
   */
  static async onReservationCompleted(
    borrowerId: string,
    ownerId: string
  ): Promise<ApiResponse<void>> {
    try {
      await Promise.all([
        this.updateStats(borrowerId, { reservationsCompleted: 1 }),
        this.updateStats(ownerId, { reservationsCompleted: 1, itemsShared: 1 }),
      ]);

      return handleApiSuccess(undefined, 'Estadísticas actualizadas');
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  /**
   * Actualizar estadísticas cuando se cancela una reserva
   */
  static async onReservationCancelled(
    borrowerId: string,
    ownerId: string
  ): Promise<ApiResponse<void>> {
    try {
      await Promise.all([
        this.updateStats(borrowerId, { reservationsCancelled: 1 }),
        this.updateStats(ownerId, { reservationsCancelled: 1 }),
      ]);

      return handleApiSuccess(undefined, 'Estadísticas actualizadas');
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  /**
   * Actualizar estadísticas cuando un usuario da una reseña
   */
  static async onReviewGiven(
    userId: string,
    rating: number
  ): Promise<ApiResponse<UserStats>> {
    const currentStats = await this.getUserStats(userId);
    if (!currentStats.success || !currentStats.data) {
      return handleApiError<UserStats>(
        new Error('No se pudieron obtener estadísticas')
      );
    }

    const stats = currentStats.data;
    const newReviewsGiven = stats.reviewsGiven + 1;
    const newAverageRatingGiven =
      (stats.averageRatingGiven * stats.reviewsGiven + rating) /
      newReviewsGiven;

    return this.updateStats(userId, {
      reviewsGiven: 1,
      averageRatingGiven: Math.round(newAverageRatingGiven * 10) / 10,
    });
  }

  /**
   * Actualizar estadísticas cuando un usuario recibe una reseña
   */
  static async onReviewReceived(
    userId: string,
    rating: number
  ): Promise<ApiResponse<UserStats>> {
    const currentStats = await this.getUserStats(userId);
    if (!currentStats.success || !currentStats.data) {
      return handleApiError<UserStats>(
        new Error('No se pudieron obtener estadísticas')
      );
    }

    const stats = currentStats.data;
    const newReviewsReceived = stats.reviewsReceived + 1;
    const newAverageRatingReceived =
      (stats.averageRatingReceived * stats.reviewsReceived + rating) /
      newReviewsReceived;

    // Calcular nuevo trust score basado en la calificación recibida
    const newTrustScore = this.calculateTrustScore(
      newAverageRatingReceived,
      newReviewsReceived,
      stats.reservationsCompleted
    );

    return this.updateStats(userId, {
      reviewsReceived: 1,
      averageRatingReceived: Math.round(newAverageRatingReceived * 10) / 10,
      trustScore: newTrustScore,
    });
  }

  /**
   * Actualizar estadísticas de actividad (login)
   */
  static async onUserLogin(userId: string): Promise<ApiResponse<UserStats>> {
    const currentStats = await this.getUserStats(userId);
    if (!currentStats.success || !currentStats.data) {
      return handleApiError<UserStats>(
        new Error('No se pudieron obtener estadísticas')
      );
    }

    const stats = currentStats.data;
    const today = new Date().toISOString().split('T')[0];
    const lastActivityDate = stats.lastActivity.split('T')[0];

    const updates: Partial<UserStats> = {
      totalLogins: 1,
      lastActivity: new Date().toISOString(),
    };

    // Si es un día diferente, incrementar días activos
    if (today !== lastActivityDate) {
      updates.daysActive = 1;
    }

    return this.updateStats(userId, updates);
  }

  /**
   * Método genérico para actualizar estadísticas
   */
  private static async updateStats(
    userId: string,
    updates: Partial<UserStats>
  ): Promise<ApiResponse<UserStats>> {
    try {
      return await withRetry(async () => {
        const currentStats = await this.getUserStats(userId);
        if (!currentStats.success || !currentStats.data) {
          throw new Error('No se pudieron obtener estadísticas actuales');
        }

        const stats = currentStats.data;
        // Reemplazado: evitar `any` usando tipos derivados de UserStats
        type StatKey = keyof UserStats;
        type StatValue = UserStats[StatKey];

        let updatedStats: Partial<Record<StatKey, StatValue>> = {};

        // Aplicar incrementos numéricos sin usar `any`
        for (const [key, value] of Object.entries(updates) as [
          StatKey,
          StatValue,
        ][]) {
          if (typeof value === 'number' && typeof stats[key] === 'number') {
            // Narrow a number para realizar la suma
            (updatedStats[key] as unknown as number) =
              (stats[key] as unknown as number) + (value as unknown as number);
          } else {
            updatedStats[key] = value;
          }
        }

        // Al final, cuando llamemos al servicio de BD, convertimos al tipo esperado
        // Verificar y actualizar logros
        const achievementUpdates = await this.checkAndUpdateAchievements({
          ...stats,
          ...(updatedStats as Partial<UserStats>),
        } as UserStats);

        if (achievementUpdates.achievements.length > 0) {
          (updatedStats as Partial<UserStats>).achievements =
            achievementUpdates.achievements;
          (updatedStats as Partial<UserStats>).totalAchievements =
            achievementUpdates.totalAchievements;
        }

        // Actualizar estadísticas mensuales
        const monthlyUpdates = this.updateMonthlyStats(stats, updates);
        if (monthlyUpdates) {
          (updatedStats as Partial<UserStats>).monthlyStats = monthlyUpdates;
        }

        const result = await DatabaseService.update<UserStats>(
          COLLECTIONS.USER_STATS,
          userId,
          updatedStats as Partial<UserStats>
        );

        return result;
      });
    } catch (error) {
      return handleApiError<UserStats>(error);
    }
  }

  /**
   * Verificar y actualizar logros del usuario
   */
  private static async checkAndUpdateAchievements(
    stats: UserStats
  ): Promise<{ achievements: Achievement[]; totalAchievements: number }> {
    const currentAchievements = [...stats.achievements];

    for (const achievementTemplate of AVAILABLE_ACHIEVEMENTS) {
      const existingAchievement = currentAchievements.find(
        (a) => a.id === achievementTemplate.id
      );

      if (existingAchievement && existingAchievement.isCompleted) {
        continue; // Ya completado
      }

      const progress = this.calculateAchievementProgress(
        achievementTemplate,
        stats
      );
      const isCompleted = progress >= achievementTemplate.maxProgress;

      if (!existingAchievement && progress > 0) {
        // Nuevo logro con progreso
        currentAchievements.push({
          ...achievementTemplate,
          progress,
          isCompleted,
          unlockedAt: isCompleted ? new Date().toISOString() : '',
        });
      } else if (
        existingAchievement &&
        existingAchievement.progress !== progress
      ) {
        // Actualizar progreso existente
        existingAchievement.progress = progress;
        if (isCompleted && !existingAchievement.isCompleted) {
          existingAchievement.isCompleted = true;
          existingAchievement.unlockedAt = new Date().toISOString();
        }
      }
    }

    return {
      achievements: currentAchievements,
      totalAchievements: currentAchievements.filter((a) => a.isCompleted)
        .length,
    };
  }

  /**
   * Calcular progreso de un logro específico
   */
  private static calculateAchievementProgress(
    achievement: Omit<Achievement, 'unlockedAt' | 'progress' | 'isCompleted'>,
    stats: UserStats
  ): number {
    switch (achievement.id) {
      case 'first_item':
        return Math.min(stats.itemsCreated, 1);
      case 'item_creator_5':
        return Math.min(stats.itemsCreated, 5);
      case 'item_creator_25':
        return Math.min(stats.itemsCreated, 25);
      case 'first_reservation':
        return Math.min(stats.reservationsMade, 1);
      case 'reservation_master_10':
        return Math.min(stats.reservationsCompleted, 10);
      case 'trusted_member':
        return Math.min(Math.floor(stats.averageRatingReceived * 10), 45);
      case 'community_helper':
        return Math.min(stats.reviewsReceived, 50);
      case 'active_member_30':
        return Math.min(stats.daysActive, 30);
      case 'milestone_100_earnings':
        return Math.min(Math.floor(stats.totalEarnings), 100);
      default:
        return 0;
    }
  }

  /**
   * Actualizar estadísticas mensuales
   */
  private static updateMonthlyStats(
    currentStats: UserStats,
    updates: Partial<UserStats>
  ): MonthlyStats[] | undefined {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyStats = [...currentStats.monthlyStats];

    let currentMonthStats = monthlyStats.find((m) => m.month === currentMonth);

    if (!currentMonthStats) {
      currentMonthStats = {
        month: currentMonth,
        itemsCreated: 0,
        reservationsMade: 0,
        reservationsReceived: 0,
        reviewsGiven: 0,
        reviewsReceived: 0,
        earnings: 0,
        spent: 0,
      };
      monthlyStats.push(currentMonthStats);
    }

    let hasUpdates = false;

    // Actualizar estadísticas del mes actual
    if (updates.itemsCreated) {
      currentMonthStats.itemsCreated += updates.itemsCreated;
      hasUpdates = true;
    }
    if (updates.reservationsMade) {
      currentMonthStats.reservationsMade += updates.reservationsMade;
      hasUpdates = true;
    }
    if (updates.reservationsReceived) {
      currentMonthStats.reservationsReceived += updates.reservationsReceived;
      hasUpdates = true;
    }
    if (updates.reviewsGiven) {
      currentMonthStats.reviewsGiven += updates.reviewsGiven;
      hasUpdates = true;
    }
    if (updates.reviewsReceived) {
      currentMonthStats.reviewsReceived += updates.reviewsReceived;
      hasUpdates = true;
    }
    if (updates.totalEarnings) {
      currentMonthStats.earnings += updates.totalEarnings;
      hasUpdates = true;
    }
    if (updates.totalSpent) {
      currentMonthStats.spent += updates.totalSpent;
      hasUpdates = true;
    }

    // Mantener solo los últimos 12 meses
    const sortedStats = monthlyStats
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    return hasUpdates ? sortedStats : undefined;
  }

  /**
   * Calcular trust score basado en métricas
   */
  private static calculateTrustScore(
    averageRating: number,
    totalReviews: number,
    completedReservations: number
  ): number {
    // Fórmula de trust score (0-100)
    const ratingWeight = 0.5;
    const reviewCountWeight = 0.3;
    const completionWeight = 0.2;

    const ratingScore = (averageRating / 5) * 100;
    const reviewScore = Math.min(totalReviews / 20, 1) * 100; // Max score at 20 reviews
    const completionScore = Math.min(completedReservations / 10, 1) * 100; // Max score at 10 completions

    const trustScore =
      ratingScore * ratingWeight +
      reviewScore * reviewCountWeight +
      completionScore * completionWeight;

    return Math.round(trustScore);
  }

  /**
   * Obtener leaderboard por categoría
   */
  static async getLeaderboard(
    category: 'trust' | 'sharing' | 'community' | 'activity',
    limit: number = 10
  ): Promise<ApiResponse<LeaderboardEntry[]>> {
    try {
      return await withRetry(async () => {
        let orderBy: string;

        switch (category) {
          case 'trust':
            orderBy = 'trustScore';
            break;
          case 'sharing':
            orderBy = 'itemsShared';
            break;
          case 'community':
            orderBy = 'reviewsReceived';
            break;
          case 'activity':
            orderBy = 'daysActive';
            break;
          default:
            throw new Error('Categoría de leaderboard inválida');
        }

        const result = await DatabaseService.query<UserStats>(
          COLLECTIONS.USER_STATS,
          {
            orderBy,
            orderType: 'DESC',
            limit,
          }
        );

        if (!result.success || !result.data) {
          throw new Error('Error al obtener leaderboard');
        }

        // Obtener información de usuarios para el leaderboard
        const leaderboard: LeaderboardEntry[] = result.data.documents.map(
          (stats, index) => ({
            userId: stats.userId,
            userName: `Usuario ${stats.userId.substring(0, 8)}`, // Placeholder
            score: stats[orderBy as keyof UserStats] as number,
            rank: index + 1,
            category,
          })
        );

        return handleApiSuccess(leaderboard);
      });
    } catch (error) {
      return handleApiError<LeaderboardEntry[]>(error);
    }
  }

  /**
   * Generar reporte de estadísticas agregadas
   */
  static async generateStatsReport(
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<ApiResponse<StatsReport>> {
    try {
      return await withRetry(async () => {
        const endDate = new Date();
        const startDate = new Date();

        // Calcular fecha de inicio según el período
        switch (period) {
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        }

        // Obtener todas las estadísticas
        const allStatsResult = await DatabaseService.query<UserStats>(
          COLLECTIONS.USER_STATS,
          {}
        );

        if (!allStatsResult.success || !allStatsResult.data) {
          throw new Error('Error al obtener estadísticas para el reporte');
        }

        const allStats = allStatsResult.data.documents;

        // Filtrar estadísticas por período (simplificado)
        const periodStats = allStats.filter((stats) => {
          const updatedAt = new Date(stats.updatedAt || stats.createdAt || '');
          return updatedAt >= startDate && updatedAt <= endDate;
        });

        // Calcular métricas agregadas
        const totalUsers = allStats.length;
        const activeUsers = periodStats.length;
        const totalItems = allStats.reduce(
          (sum, stats) => sum + stats.itemsCreated,
          0
        );
        const totalReservations = allStats.reduce(
          (sum, stats) => sum + stats.reservationsMade,
          0
        );
        const totalReviews = allStats.reduce(
          (sum, stats) => sum + stats.reviewsGiven,
          0
        );

        const ratingsSum = allStats.reduce(
          (sum, stats) =>
            sum + stats.averageRatingReceived * stats.reviewsReceived,
          0
        );
        const totalRatings = allStats.reduce(
          (sum, stats) => sum + stats.reviewsReceived,
          0
        );
        const averageRating = totalRatings > 0 ? ratingsSum / totalRatings : 0;

        // Obtener top usuarios por trust score
        const topUsers = await this.getLeaderboard('trust', 5);

        const report: StatsReport = {
          period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalUsers,
          activeUsers,
          totalItems,
          totalReservations,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          topCategories: [], // Placeholder - requeriría datos de items
          topUsers: topUsers.success ? topUsers.data || [] : [],
        };

        return handleApiSuccess(report);
      });
    } catch (error) {
      return handleApiError<StatsReport>(error);
    }
  }

  /**
   * Obtener estadísticas de múltiples usuarios
   */
  static async getBulkUserStats(
    userIds: string[]
  ): Promise<ApiResponse<UserStats[]>> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return handleApiError<UserStats[]>(
        new Error('Lista de IDs de usuario requerida')
      );
    }

    try {
      const results = await Promise.all(
        userIds.map((userId) => this.getUserStats(userId))
      );

      const successfulResults = results
        .filter((result) => result.success && result.data)
        .map((result) => result.data!);

      return handleApiSuccess(successfulResults);
    } catch (error) {
      return handleApiError<UserStats[]>(error);
    }
  }

  /**
   * Recalcular todas las estadísticas de un usuario (útil para correcciones)
   */
  static async recalculateUserStats(
    userId: string
  ): Promise<ApiResponse<UserStats>> {
    try {
      // Esta función requeriría acceso a todas las colecciones para recalcular
      // Por ahora, retornamos las estadísticas actuales
      return this.getUserStats(userId);
    } catch (error) {
      return handleApiError<UserStats>(error);
    }
  }
}
