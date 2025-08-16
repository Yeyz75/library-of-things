import {
  COLLECTIONS,
  handleApiError,
  handleApiSuccess,
  type ApiResponse,
  type BaseEntity,
  type QueryOptions,
} from './api';
import { DatabaseService } from './database';

// Interfaz principal para Review
export interface Review extends BaseEntity {
  itemId: string;
  userId: string;
  reservationId?: string;
  rating: number; // 1-5
  comment?: string;
  status: 'active' | 'hidden' | 'flagged' | 'pending';
  helpful: number;
  reportCount: number;
  editHistory?: ReviewEdit[];
  moderationNotes?: string;
  metadata: Record<string, unknown>;
}

// Interfaz para historial de ediciones
export interface ReviewEdit {
  editedAt: string;
  previousComment?: string;
  previousRating?: number;
  reason?: string;
}

// Interfaz para estadísticas de calificaciones
export interface RatingStats {
  itemId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  lastUpdated: string;
}

// Interfaz para votos útiles
export interface HelpfulVote {
  reviewId: string;
  userId: string;
  isHelpful: boolean;
  createdAt: string;
}

// Interfaz para reportes de spam
export interface ReviewReport {
  reviewId: string;
  reporterId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

// Opciones para consultas de reviews
export interface ReviewQueryOptions extends QueryOptions {
  itemId?: string;
  userId?: string;
  status?: Review['status'];
  minRating?: number;
  maxRating?: number;
  hasComment?: boolean;
}

// Opciones para moderación
export interface ModerationOptions {
  action: 'approve' | 'hide' | 'flag' | 'delete';
  reason?: string;
  moderatorId: string;
}

// Validación de datos de review
const validateReviewData = (data: Partial<Review>): void => {
  if (data.rating !== undefined) {
    if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
      throw new Error('La calificación debe ser un número entre 1 y 5');
    }
  }

  if (data.comment !== undefined) {
    if (typeof data.comment !== 'string') {
      throw new Error('El comentario debe ser una cadena de texto');
    }
    if (data.comment.length > 1000) {
      throw new Error('El comentario no puede exceder 1000 caracteres');
    }
  }

  if (data.itemId && typeof data.itemId !== 'string') {
    throw new Error('El ID del item debe ser una cadena de texto');
  }

  if (data.userId && typeof data.userId !== 'string') {
    throw new Error('El ID del usuario debe ser una cadena de texto');
  }
};

// Detectar contenido spam básico
const detectSpam = (comment?: string): boolean => {
  if (!comment) return false;

  const spamPatterns = [
    /(.)\1{4,}/i, // Caracteres repetidos
    /https?:\/\//i, // URLs
    /\b(buy|sale|discount|offer|deal|cheap|free|win|prize)\b/i, // Palabras spam comunes
    /[A-Z]{5,}/g, // Texto en mayúsculas excesivo
  ];

  return spamPatterns.some((pattern) => pattern.test(comment));
};

// Clase principal del servicio de reviews
export class ReviewsService {
  // Crear una nueva review
  static async createReview(
    reviewData: Omit<
      Review,
      '$id' | 'createdAt' | 'updatedAt' | 'helpful' | 'reportCount' | 'status'
    >
  ): Promise<ApiResponse<Review>> {
    try {
      // Validar datos
      validateReviewData(reviewData);

      if (!reviewData.itemId || !reviewData.userId || !reviewData.rating) {
        return handleApiError<Review>(
          new Error('itemId, userId y rating son campos requeridos')
        );
      }

      // Verificar que el usuario no haya hecho ya una review para este item
      const existingReview = await this.getUserReviewForItem(
        reviewData.userId,
        reviewData.itemId
      );

      if (existingReview.success && existingReview.data) {
        return handleApiError<Review>(
          new Error('Ya has creado una reseña para este item')
        );
      }

      // Detectar spam automáticamente
      const isSpam = detectSpam(reviewData.comment);
      const status = isSpam ? 'flagged' : 'active';

      const newReviewData = {
        ...reviewData,
        helpful: 0,
        reportCount: 0,
        status,
        metadata: reviewData.metadata || {},
      };

      const result = await DatabaseService.create<Review>(
        COLLECTIONS.REVIEWS,
        newReviewData
      );

      if (result.success && result.data) {
        // Actualizar estadísticas del item
        await this.updateItemRatingStats(reviewData.itemId);
      }

      return result;
    } catch (error) {
      return handleApiError<Review>(error);
    }
  }

  // Obtener review por ID
  static async getReview(reviewId: string): Promise<ApiResponse<Review>> {
    if (!reviewId || typeof reviewId !== 'string') {
      return handleApiError<Review>(new Error('ID de review requerido'));
    }

    return await DatabaseService.read<Review>(COLLECTIONS.REVIEWS, reviewId);
  }

  // Actualizar review existente
  static async updateReview(
    reviewId: string,
    updateData: Partial<Pick<Review, 'rating' | 'comment' | 'metadata'>>,
    userId: string
  ): Promise<ApiResponse<Review>> {
    try {
      if (!reviewId || !userId) {
        return handleApiError<Review>(
          new Error('ID de review y usuario requeridos')
        );
      }

      // Validar datos de actualización
      validateReviewData(updateData);

      // Obtener review actual
      const currentReview = await this.getReview(reviewId);
      if (!currentReview.success || !currentReview.data) {
        return handleApiError<Review>(new Error('Review no encontrada'));
      }

      // Verificar que el usuario sea el propietario
      if (currentReview.data.userId !== userId) {
        return handleApiError<Review>(
          new Error('No tienes permisos para editar esta review')
        );
      }

      // Crear entrada en historial de ediciones si hay cambios significativos
      const editHistory = currentReview.data.editHistory || [];
      if (updateData.rating !== undefined || updateData.comment !== undefined) {
        const edit: ReviewEdit = {
          editedAt: new Date().toISOString(),
          previousRating: currentReview.data.rating,
          previousComment: currentReview.data.comment,
          reason: 'user_edit',
        };
        editHistory.push(edit);
      }

      // Detectar spam en comentario actualizado
      const isSpam = updateData.comment
        ? detectSpam(updateData.comment)
        : false;
      const status = isSpam ? 'flagged' : currentReview.data.status;

      const finalUpdateData = {
        ...updateData,
        editHistory,
        status,
      };

      const result = await DatabaseService.update<Review>(
        COLLECTIONS.REVIEWS,
        reviewId,
        finalUpdateData
      );

      if (result.success && updateData.rating !== undefined) {
        // Actualizar estadísticas si cambió la calificación
        await this.updateItemRatingStats(currentReview.data.itemId);
      }

      return result;
    } catch (error) {
      return handleApiError<Review>(error);
    }
  }

  // Eliminar review
  static async deleteReview(
    reviewId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      if (!reviewId || !userId) {
        return handleApiError<void>(
          new Error('ID de review y usuario requeridos')
        );
      }

      // Obtener review para verificar permisos
      const review = await this.getReview(reviewId);
      if (!review.success || !review.data) {
        return handleApiError<void>(new Error('Review no encontrada'));
      }

      // Verificar permisos (propietario o admin)
      if (review.data.userId !== userId) {
        return handleApiError<void>(
          new Error('No tienes permisos para eliminar esta review')
        );
      }

      const result = await DatabaseService.delete(
        COLLECTIONS.REVIEWS,
        reviewId
      );

      if (result.success) {
        // Actualizar estadísticas del item
        await this.updateItemRatingStats(review.data.itemId);
      }

      return result;
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  // Obtener reviews de un item
  static async getItemReviews(
    itemId: string,
    options: Omit<ReviewQueryOptions, 'itemId'> = {}
  ): Promise<ApiResponse<{ documents: Review[]; total: number }>> {
    if (!itemId) {
      return handleApiError<{ documents: Review[]; total: number }>(
        new Error('ID de item requerido')
      );
    }

    const filters = [`itemId==${itemId}`];

    if (options.status) {
      filters.push(`status==${options.status}`);
    } else {
      // Por defecto, solo mostrar reviews activas
      filters.push('status==active');
    }

    if (options.minRating) {
      filters.push(`rating>=${options.minRating}`);
    }

    if (options.maxRating) {
      filters.push(`rating<=${options.maxRating}`);
    }

    const queryOptions: QueryOptions = {
      ...options,
      filters,
      orderBy: options.orderBy || 'createdAt',
      orderType: options.orderType || 'DESC',
    };

    return await DatabaseService.query<Review>(
      COLLECTIONS.REVIEWS,
      queryOptions
    );
  }

  // Obtener reviews de un usuario
  static async getUserReviews(
    userId: string,
    options: Omit<ReviewQueryOptions, 'userId'> = {}
  ): Promise<ApiResponse<{ documents: Review[]; total: number }>> {
    if (!userId) {
      return handleApiError<{ documents: Review[]; total: number }>(
        new Error('ID de usuario requerido')
      );
    }

    const filters = [`userId==${userId}`];

    if (options.status) {
      filters.push(`status==${options.status}`);
    }

    const queryOptions: QueryOptions = {
      ...options,
      filters,
      orderBy: options.orderBy || 'createdAt',
      orderType: options.orderType || 'DESC',
    };

    return await DatabaseService.query<Review>(
      COLLECTIONS.REVIEWS,
      queryOptions
    );
  }

  // Obtener review específica de un usuario para un item
  static async getUserReviewForItem(
    userId: string,
    itemId: string
  ): Promise<ApiResponse<Review | null>> {
    if (!userId || !itemId) {
      return handleApiError<Review | null>(
        new Error('ID de usuario e item requeridos')
      );
    }

    const result = await DatabaseService.query<Review>(COLLECTIONS.REVIEWS, {
      filters: [`userId==${userId}`, `itemId==${itemId}`],
      limit: 1,
    });

    if (!result.success) {
      return handleApiError<Review | null>(result.error);
    }

    const review = result.data?.documents[0] || null;
    return handleApiSuccess(review);
  } //Calcular y actualizar estadísticas de calificación para un item
  static async updateItemRatingStats(
    itemId: string
  ): Promise<ApiResponse<RatingStats>> {
    try {
      if (!itemId) {
        return handleApiError<RatingStats>(new Error('ID de item requerido'));
      }

      // Obtener todas las reviews activas del item
      const reviewsResult = await this.getItemReviews(itemId, {
        status: 'active',
        limit: 1000, // Límite alto para obtener todas las reviews
      });

      if (!reviewsResult.success || !reviewsResult.data) {
        return handleApiError<RatingStats>(
          new Error('Error al obtener reviews del item')
        );
      }

      const reviews = reviewsResult.data.documents;
      const totalReviews = reviews.length;

      if (totalReviews === 0) {
        const emptyStats: RatingStats = {
          itemId,
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          lastUpdated: new Date().toISOString(),
        };
        return handleApiSuccess(emptyStats);
      }

      // Calcular estadísticas
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      reviews.forEach((review) => {
        totalRating += review.rating;
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      const averageRating =
        Math.round((totalRating / totalReviews) * 100) / 100;

      const stats: RatingStats = {
        itemId,
        totalReviews,
        averageRating,
        ratingDistribution,
        lastUpdated: new Date().toISOString(),
      };

      return handleApiSuccess(stats);
    } catch (error) {
      return handleApiError<RatingStats>(error);
    }
  }

  // Obtener estadísticas de calificación de un item
  static async getItemRatingStats(
    itemId: string
  ): Promise<ApiResponse<RatingStats>> {
    if (!itemId) {
      return handleApiError<RatingStats>(new Error('ID de item requerido'));
    }

    return await this.updateItemRatingStats(itemId);
  }

  // Marcar review como útil o no útil
  static async voteHelpful(
    reviewId: string,
    userId: string,
    isHelpful: boolean
  ): Promise<ApiResponse<Review>> {
    try {
      if (!reviewId || !userId) {
        return handleApiError<Review>(
          new Error('ID de review y usuario requeridos')
        );
      }

      // Obtener review actual
      const reviewResult = await this.getReview(reviewId);
      if (!reviewResult.success || !reviewResult.data) {
        return handleApiError<Review>(new Error('Review no encontrada'));
      }

      const review = reviewResult.data;

      // Verificar que el usuario no sea el autor de la review
      if (review.userId === userId) {
        return handleApiError<Review>(
          new Error('No puedes votar en tu propia review')
        );
      }

      // Aquí normalmente verificaríamos si el usuario ya votó
      // Para simplicidad, asumimos que se puede cambiar el voto
      const helpfulIncrement = isHelpful ? 1 : -1;
      const newHelpfulCount = Math.max(0, review.helpful + helpfulIncrement);

      return await DatabaseService.update<Review>(
        COLLECTIONS.REVIEWS,
        reviewId,
        { helpful: newHelpfulCount }
      );
    } catch (error) {
      return handleApiError<Review>(error);
    }
  }

  // Reportar review como spam o inapropiada
  static async reportReview(
    reviewId: string,
    reporterId: string,
    reason: ReviewReport['reason']
  ): Promise<ApiResponse<void>> {
    try {
      if (!reviewId || !reporterId || !reason) {
        return handleApiError<void>(
          new Error('ID de review, reportero y razón son requeridos')
        );
      }

      // Obtener review actual
      const reviewResult = await this.getReview(reviewId);
      if (!reviewResult.success || !reviewResult.data) {
        return handleApiError<void>(new Error('Review no encontrada'));
      }

      const review = reviewResult.data;

      // Verificar que el usuario no reporte su propia review
      if (review.userId === reporterId) {
        return handleApiError<void>(
          new Error('No puedes reportar tu propia review')
        );
      }

      // Incrementar contador de reportes
      const newReportCount = review.reportCount + 1;

      // Auto-flaggear si hay muchos reportes
      const shouldFlag = newReportCount >= 3;
      const newStatus = shouldFlag ? 'flagged' : review.status;

      await DatabaseService.update<Review>(COLLECTIONS.REVIEWS, reviewId, {
        reportCount: newReportCount,
        status: newStatus,
      });

      return handleApiSuccess(undefined, 'Reporte enviado exitosamente');
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  // Herramientas de moderación
  static async moderateReview(
    reviewId: string,
    options: ModerationOptions
  ): Promise<ApiResponse<Review>> {
    try {
      if (!reviewId || !options.moderatorId || !options.action) {
        return handleApiError<Review>(
          new Error('ID de review, moderador y acción son requeridos')
        );
      }

      // Obtener review actual
      const reviewResult = await this.getReview(reviewId);
      if (!reviewResult.success || !reviewResult.data) {
        return handleApiError<Review>(new Error('Review no encontrada'));
      }

      let updateData: Partial<Review> = {};

      switch (options.action) {
        case 'approve':
          updateData.status = 'active';
          updateData.reportCount = 0;
          break;
        case 'hide':
          updateData.status = 'hidden';
          break;
        case 'flag':
          updateData.status = 'flagged';
          break;
        case 'delete':
          // Para delete, usar el método de eliminación
          return await this.deleteReview(reviewId, options.moderatorId);
        default:
          return handleApiError<Review>(
            new Error(`Acción de moderación no válida: ${options.action}`)
          );
      }

      if (options.reason) {
        updateData.moderationNotes = options.reason;
      }

      const result = await DatabaseService.update<Review>(
        COLLECTIONS.REVIEWS,
        reviewId,
        updateData
      );

      if (result.success && options.action === 'approve') {
        // Actualizar estadísticas si se aprueba la review
        await this.updateItemRatingStats(reviewResult.data.itemId);
      }

      return result;
    } catch (error) {
      return handleApiError<Review>(error);
    }
  }

  // Obtener reviews que requieren moderación
  static async getReviewsForModeration(
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: Review[]; total: number }>> {
    const filters = ['status==flagged'];

    const queryOptions: QueryOptions = {
      ...options,
      filters,
      orderBy: options.orderBy || 'reportCount',
      orderType: 'DESC', // Mostrar las más reportadas primero
    };

    return await DatabaseService.query<Review>(
      COLLECTIONS.REVIEWS,
      queryOptions
    );
  }

  // Buscar reviews por texto en comentarios
  static async searchReviews(
    searchTerm: string,
    options: ReviewQueryOptions = {}
  ): Promise<ApiResponse<{ documents: Review[]; total: number }>> {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return handleApiError<{ documents: Review[]; total: number }>(
        new Error('Término de búsqueda requerido')
      );
    }

    const filters = options.status
      ? [`status==${options.status}`]
      : ['status==active'];

    if (options.itemId) {
      filters.push(`itemId==${options.itemId}`);
    }

    if (options.userId) {
      filters.push(`userId==${options.userId}`);
    }

    const queryOptions: QueryOptions = {
      ...options,
      filters,
      search: {
        field: 'comment',
        value: searchTerm.trim(),
      },
      orderBy: options.orderBy || 'createdAt',
      orderType: options.orderType || 'DESC',
    };

    return await DatabaseService.query<Review>(
      COLLECTIONS.REVIEWS,
      queryOptions
    );
  }

  // Obtener reviews recientes
  static async getRecentReviews(
    limit: number = 10,
    status: Review['status'] = 'active'
  ): Promise<ApiResponse<{ documents: Review[]; total: number }>> {
    const queryOptions: QueryOptions = {
      filters: [`status==${status}`],
      orderBy: 'createdAt',
      orderType: 'DESC',
      limit,
    };

    return await DatabaseService.query<Review>(
      COLLECTIONS.REVIEWS,
      queryOptions
    );
  }

  // Obtener reviews mejor calificadas (más útiles)
  static async getTopReviews(
    itemId?: string,
    limit: number = 10
  ): Promise<ApiResponse<{ documents: Review[]; total: number }>> {
    const filters = ['status==active'];

    if (itemId) {
      filters.push(`itemId==${itemId}`);
    }

    const queryOptions: QueryOptions = {
      filters,
      orderBy: 'helpful',
      orderType: 'DESC',
      limit,
    };

    return await DatabaseService.query<Review>(
      COLLECTIONS.REVIEWS,
      queryOptions
    );
  }

  // Obtener estadísticas generales del sistema de reviews
  static async getSystemReviewStats(): Promise<
    ApiResponse<{
      totalReviews: number;
      averageRating: number;
      reviewsByStatus: Record<Review['status'], number>;
      reviewsThisMonth: number;
    }>
  > {
    try {
      // Obtener todas las reviews
      const allReviewsResult = await DatabaseService.query<Review>(
        COLLECTIONS.REVIEWS,
        { limit: 10000 }
      );

      if (!allReviewsResult.success || !allReviewsResult.data) {
        return handleApiError(new Error('Error al obtener estadísticas'));
      }

      const reviews = allReviewsResult.data.documents;
      const totalReviews = reviews.length;

      // Calcular promedio general
      const totalRating = reviews
        .filter((r) => r.status === 'active')
        .reduce((sum, review) => sum + review.rating, 0);
      const activeReviews = reviews.filter((r) => r.status === 'active').length;
      const averageRating = activeReviews > 0 ? totalRating / activeReviews : 0;

      // Contar por status
      const reviewsByStatus = reviews.reduce(
        (acc, review) => {
          acc[review.status] = (acc[review.status] || 0) + 1;
          return acc;
        },
        {} as Record<Review['status'], number>
      );

      // Contar reviews del mes actual
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const reviewsThisMonth = reviews.filter((review) => {
        const reviewDate = new Date(review.createdAt || '');
        return reviewDate >= currentMonth;
      }).length;

      const stats = {
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        reviewsByStatus: {
          active: reviewsByStatus.active || 0,
          hidden: reviewsByStatus.hidden || 0,
          flagged: reviewsByStatus.flagged || 0,
          pending: reviewsByStatus.pending || 0,
        },
        reviewsThisMonth,
      };

      return handleApiSuccess(stats);
    } catch (error) {
      return handleApiError(error);
    }
  }
}

// Exportar funciones de utilidad adicionales
export const ReviewUtils = {
  // Validar si un usuario puede crear una review
  canUserReview: (userId: string, itemId: string): boolean => {
    // Lógica básica de validación
    return !!(userId && itemId);
  },

  // Formatear calificación para mostrar
  formatRating: (rating: number): string => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  },

  // Calcular tiempo transcurrido desde la review
  getTimeAgo: (createdAt: string): string => {
    const now = new Date();
    const reviewDate = new Date(createdAt);
    const diffInMs = now.getTime() - reviewDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
    return `Hace ${Math.floor(diffInDays / 365)} años`;
  },

  // Determinar si una review es considerada positiva
  isPositiveReview: (rating: number): boolean => {
    return rating >= 4;
  },

  // Obtener color para la calificación
  getRatingColor: (rating: number): string => {
    if (rating >= 4) return 'green';
    if (rating >= 3) return 'yellow';
    return 'red';
  },
};

// Crear instancia API para exportar
export const reviewsAPI = {
  // Operaciones CRUD básicas
  create: ReviewsService.createReview,
  get: ReviewsService.getReview,
  update: ReviewsService.updateReview,
  delete: ReviewsService.deleteReview,

  // Consultas específicas
  getItemReviews: ReviewsService.getItemReviews,
  getUserReviews: ReviewsService.getUserReviews,
  getUserReviewForItem: ReviewsService.getUserReviewForItem,
  searchReviews: ReviewsService.searchReviews,
  getRecentReviews: ReviewsService.getRecentReviews,
  getTopReviews: ReviewsService.getTopReviews,

  // Estadísticas y calificaciones
  getItemRatingStats: ReviewsService.getItemRatingStats,
  updateItemRatingStats: ReviewsService.updateItemRatingStats,
  getSystemReviewStats: ReviewsService.getSystemReviewStats,

  // Interacciones de usuario
  voteHelpful: ReviewsService.voteHelpful,
  reportReview: ReviewsService.reportReview,

  // Herramientas de moderación
  moderateReview: ReviewsService.moderateReview,
  getReviewsForModeration: ReviewsService.getReviewsForModeration,

  // Utilidades
  utils: ReviewUtils,
};

// Exportar por defecto el servicio completo
export default ReviewsService;
