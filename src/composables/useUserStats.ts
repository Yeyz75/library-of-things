import { ref, computed, readonly, type Ref } from 'vue';
import {
  UserStatsService,
  type UserStats,
  type LeaderboardEntry,
} from '../api/userStats';
import {
  UserStatsIntegration,
  UserStatsFormatter,
} from '../api/userStatsIntegration';

/**
 * Composable para gestión de estadísticas de usuario en componentes Vue
 */
export function useUserStats(userId?: string) {
  // Estado reactivo
  const stats: Ref<UserStats | null> = ref(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Estado para leaderboards
  const leaderboards = ref<{
    trust: LeaderboardEntry[];
    sharing: LeaderboardEntry[];
    community: LeaderboardEntry[];
    activity: LeaderboardEntry[];
  }>({
    trust: [],
    sharing: [],
    community: [],
    activity: [],
  });

  // Propiedades computadas
  const trustLevel = computed(() => {
    if (!stats.value) return null;
    return UserStatsFormatter.formatTrustLevel(stats.value.trustScore);
  });

  const trustScoreFormatted = computed(() => {
    if (!stats.value) return '';
    return UserStatsFormatter.formatTrustScore(stats.value.trustScore);
  });

  const motivationalMessage = computed(() => {
    // stats.value puede ser null; convertir a undefined para coincidir con la firma
    return UserStatsFormatter.getMotivationalMessage(stats.value ?? undefined);
  });

  const completedAchievements = computed(() => {
    if (!stats.value) return [];
    return stats.value.achievements.filter(
      (achievement) => achievement.isCompleted
    );
  });

  const inProgressAchievements = computed(() => {
    if (!stats.value) return [];
    return stats.value.achievements
      .filter(
        (achievement) => !achievement.isCompleted && achievement.progress > 0
      )
      .sort((a, b) => b.progress / b.maxProgress - a.progress / a.maxProgress);
  });

  const monthlyStatsChart = computed(() => {
    if (!stats.value || !stats.value.monthlyStats) return [];

    return stats.value.monthlyStats
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((monthStats) => ({
        month: monthStats.month,
        items: monthStats.itemsCreated,
        reservations: monthStats.reservationsMade,
        reviews: monthStats.reviewsGiven,
      }));
  });

  // Métodos principales
  const loadUserStats = async (targetUserId?: string): Promise<void> => {
    const userIdToUse = targetUserId || userId;
    if (!userIdToUse) {
      error.value = 'ID de usuario requerido';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await UserStatsService.getUserStats(userIdToUse);

      if (result.success && result.data) {
        stats.value = result.data;
      } else {
        error.value = result.error || 'Error al cargar estadísticas';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading.value = false;
    }
  };

  const refreshStats = async (): Promise<void> => {
    await loadUserStats();
  };

  const loadLeaderboards = async (): Promise<void> => {
    try {
      const [trustResult, sharingResult, communityResult, activityResult] =
        await Promise.all([
          UserStatsService.getLeaderboard('trust', 10),
          UserStatsService.getLeaderboard('sharing', 10),
          UserStatsService.getLeaderboard('community', 10),
          UserStatsService.getLeaderboard('activity', 10),
        ]);

      leaderboards.value = {
        trust: trustResult.success ? trustResult.data || [] : [],
        sharing: sharingResult.success ? sharingResult.data || [] : [],
        community: communityResult.success ? communityResult.data || [] : [],
        activity: activityResult.success ? activityResult.data || [] : [],
      };
    } catch (err) {
      console.error('Error cargando leaderboards:', err);
    }
  };

  // Métodos de integración para acciones del usuario
  const handleItemCreated = async (itemId: string): Promise<void> => {
    if (!userId) return;

    try {
      await UserStatsIntegration.handleItemCreated(userId, itemId);
      await refreshStats();
    } catch (err) {
      console.error('Error actualizando estadísticas al crear item:', err);
    }
  };

  const handleReservationMade = async (
    ownerId: string,
    reservationId: string
  ): Promise<void> => {
    if (!userId) return;

    try {
      await UserStatsIntegration.handleReservationCreated(
        userId,
        ownerId,
        reservationId
      );
      await refreshStats();
    } catch (err) {
      console.error('Error actualizando estadísticas al hacer reserva:', err);
    }
  };

  const handleReservationCompleted = async (
    otherUserId: string,
    reservationId: string,
    isOwner: boolean
  ): Promise<void> => {
    if (!userId) return;

    try {
      if (isOwner) {
        await UserStatsIntegration.handleReservationCompleted(
          otherUserId,
          userId,
          reservationId
        );
      } else {
        await UserStatsIntegration.handleReservationCompleted(
          userId,
          otherUserId,
          reservationId
        );
      }
      await refreshStats();
    } catch (err) {
      console.error(
        'Error actualizando estadísticas al completar reserva:',
        err
      );
    }
  };

  const handleReviewGiven = async (
    reviewedUserId: string,
    rating: number,
    reviewId: string
  ): Promise<void> => {
    if (!userId) return;

    try {
      await UserStatsIntegration.handleReviewCreated(
        userId,
        reviewedUserId,
        rating,
        reviewId
      );
      await refreshStats();
    } catch (err) {
      console.error('Error actualizando estadísticas al dar reseña:', err);
    }
  };

  const handleUserLogin = async (): Promise<void> => {
    if (!userId) return;

    try {
      await UserStatsIntegration.handleUserLogin(userId);
      await refreshStats();
    } catch (err) {
      console.error('Error actualizando estadísticas al iniciar sesión:', err);
    }
  };

  // Métodos de utilidad
  const getDashboardStats = async () => {
    if (!userId) return null;

    try {
      const result = await UserStatsIntegration.getUserDashboardStats(userId);
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Error obteniendo estadísticas del dashboard:', err);
      return null;
    }
  };

  const getProgressMetrics = async () => {
    if (!userId) return null;

    try {
      const result = await UserStatsIntegration.getUserProgressMetrics(userId);
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Error obteniendo métricas de progreso:', err);
      return null;
    }
  };

  const getActivitySummary = async (days: number = 7) => {
    if (!userId) return null;

    try {
      const result = await UserStatsIntegration.getActivitySummary(
        userId,
        days
      );
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Error obteniendo resumen de actividad:', err);
      return null;
    }
  };

  const formatAchievementProgress = (
    progress: number,
    maxProgress: number
  ): string => {
    return UserStatsFormatter.formatAchievementProgress(progress, maxProgress);
  };

  // Métodos de comparación y ranking
  const getUserRank = (
    category: 'trust' | 'sharing' | 'community' | 'activity'
  ): number => {
    if (!userId || !leaderboards.value[category]) return 0;

    const userEntry = leaderboards.value[category].find(
      (entry) => entry.userId === userId
    );
    return userEntry?.rank || 0;
  };

  const isInTopTen = (
    category: 'trust' | 'sharing' | 'community' | 'activity'
  ): boolean => {
    const rank = getUserRank(category);
    return rank > 0 && rank <= 10;
  };

  // Métodos de gamificación
  const getNextAchievement = () => {
    if (!stats.value) return null;

    const nextAchievement = stats.value.achievements
      .filter((achievement) => !achievement.isCompleted)
      .sort(
        (a, b) => b.progress / b.maxProgress - a.progress / a.maxProgress
      )[0];

    return nextAchievement || null;
  };

  const getAchievementsByCategory = (category: string) => {
    if (!stats.value) return [];

    return stats.value.achievements.filter(
      (achievement) => achievement.category === category
    );
  };

  const getTrustLevelProgress = () => {
    if (!stats.value) return null;

    const trustScore = stats.value.trustScore;
    const currentLevel = Math.floor(trustScore / 25);
    const progressInLevel = trustScore % 25;
    const progressPercentage = (progressInLevel / 25) * 100;

    const levels = ['Bronze', 'Silver', 'Gold', 'Platinum'];

    return {
      currentLevel: levels[Math.min(currentLevel, 3)],
      nextLevel: levels[Math.min(currentLevel + 1, 3)],
      progressPercentage: Math.round(progressPercentage),
      pointsToNext: 25 - progressInLevel,
    };
  };

  // Retornar API del composable
  return {
    // Estado
    stats: readonly(stats),
    loading: readonly(loading),
    error: readonly(error),
    leaderboards: readonly(leaderboards),

    // Propiedades computadas
    trustLevel,
    trustScoreFormatted,
    motivationalMessage,
    completedAchievements,
    inProgressAchievements,
    monthlyStatsChart,

    // Métodos principales
    loadUserStats,
    refreshStats,
    loadLeaderboards,

    // Métodos de integración
    handleItemCreated,
    handleReservationMade,
    handleReservationCompleted,
    handleReviewGiven,
    handleUserLogin,

    // Métodos de utilidad
    getDashboardStats,
    getProgressMetrics,
    getActivitySummary,
    formatAchievementProgress,

    // Métodos de ranking
    getUserRank,
    isInTopTen,

    // Métodos de gamificación
    getNextAchievement,
    getAchievementsByCategory,
    getTrustLevelProgress,
  };
}

/**
 * Composable específico para leaderboards
 */
export function useLeaderboards() {
  const leaderboards = ref<{
    trust: LeaderboardEntry[];
    sharing: LeaderboardEntry[];
    community: LeaderboardEntry[];
    activity: LeaderboardEntry[];
  }>({
    trust: [],
    sharing: [],
    community: [],
    activity: [],
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadLeaderboard = async (
    category: 'trust' | 'sharing' | 'community' | 'activity',
    limit: number = 10
  ): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await UserStatsService.getLeaderboard(category, limit);

      if (result.success && result.data) {
        leaderboards.value[category] = result.data;
      } else {
        error.value = result.error || 'Error al cargar leaderboard';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading.value = false;
    }
  };

  const loadAllLeaderboards = async (limit: number = 10): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const [trustResult, sharingResult, communityResult, activityResult] =
        await Promise.all([
          UserStatsService.getLeaderboard('trust', limit),
          UserStatsService.getLeaderboard('sharing', limit),
          UserStatsService.getLeaderboard('community', limit),
          UserStatsService.getLeaderboard('activity', limit),
        ]);

      leaderboards.value = {
        trust: trustResult.success ? trustResult.data || [] : [],
        sharing: sharingResult.success ? sharingResult.data || [] : [],
        community: communityResult.success ? communityResult.data || [] : [],
        activity: activityResult.success ? activityResult.data || [] : [],
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading.value = false;
    }
  };

  return {
    leaderboards: readonly(leaderboards),
    loading: readonly(loading),
    error: readonly(error),
    loadLeaderboard,
    loadAllLeaderboards,
  };
}

/**
 * Composable para reportes de estadísticas
 */
export function useStatsReports() {
  const reports = ref<
    Record<
      string,
      Awaited<ReturnType<typeof UserStatsService.generateStatsReport>>['data']
    >
  >({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  const generateReport = async (
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await UserStatsService.generateStatsReport(period);

      if (result.success && result.data) {
        reports.value[period] = result.data;
      } else {
        error.value = result.error || 'Error al generar reporte';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      loading.value = false;
    }
  };

  const getReport = (period: 'week' | 'month' | 'quarter' | 'year') => {
    return reports.value[period] || null;
  };

  return {
    reports: readonly(reports),
    loading: readonly(loading),
    error: readonly(error),
    generateReport,
    getReport,
  };
}
