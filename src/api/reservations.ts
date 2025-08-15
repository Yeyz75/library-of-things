import { apiResource, COLLECTIONS, Query, type ApiResponse } from './api';
import type { ReservationModel, ReservationStatusModel } from '@/types/models';
import type { PaginatedResponse } from '@/types/pagination';

// Endpoint para reservations
const endpoint = COLLECTIONS.RESERVATIONS;

// Exportar métodos estándar usando destructuring
export const { index, show, save, update, remove, search, count } =
  apiResource<ReservationModel>(endpoint);

// Métodos adicionales específicos para reservations
export const reservationsAPI = {
  // Obtener reservas por estado con paginación
  async getReservationsByStatus(
    status: ReservationStatusModel,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const response = await index({
      filters: [Query.equal('status', status ?? '')],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(response.error || 'Failed to fetch reservations by status');
  },

  // Obtener reservas por borrower (usuario que pide prestado) con paginación
  async getReservationsByBorrower(
    borrowerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const response = await index({
      filters: [Query.equal('borrowerId', borrowerId)],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(
      response.error || 'Failed to fetch reservations by borrower'
    );
  },

  // Obtener reservas por owner (propietario del item) con paginación
  async getReservationsByOwner(
    ownerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const response = await index({
      filters: [Query.equal('ownerId', ownerId)],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(response.error || 'Failed to fetch reservations by owner');
  },

  // Obtener reservas prestadas (como borrower) con paginación
  async getBorrowedReservations(
    borrowerId: string,
    page: number = 1,
    pageSize: number = 10,
    statuses: ReservationStatusModel[] = ['active', 'pending', 'approved']
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const cleanStatuses = statuses.filter(
      (s) => typeof s === 'string'
    ) as string[];
    const filters = [Query.equal('borrowerId', borrowerId)];

    if (cleanStatuses.length > 0) {
      filters.push(Query.equal('status', cleanStatuses));
    }

    const response = await index({
      filters,
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(response.error || 'Failed to fetch borrowed reservations');
  },

  // Obtener reservas prestando (como owner) con paginación
  async getLendingReservations(
    ownerId: string,
    page: number = 1,
    pageSize: number = 10,
    statuses: ReservationStatusModel[] = ['active', 'pending', 'approved']
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const cleanStatuses = statuses.filter(
      (s) => typeof s === 'string'
    ) as string[];
    const filters = [Query.equal('ownerId', ownerId)];

    if (cleanStatuses.length > 0) {
      filters.push(Query.equal('status', cleanStatuses));
    }

    const response = await index({
      filters,
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(response.error || 'Failed to fetch lending reservations');
  },

  // Obtener reservas por item con paginación
  async getReservationsByItem(
    itemId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const response = await index({
      filters: [Query.equal('itemId', itemId)],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(response.error || 'Failed to fetch reservations by item');
  },

  // Obtener reservas activas con paginación
  async getActiveReservations(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    return this.getReservationsByStatus('active', page, pageSize);
  },

  // Obtener reservas pendientes con paginación
  async getPendingReservations(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const response = await index({
      filters: [Query.equal('status', 'pending')],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'ASC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(response.error || 'Failed to fetch pending reservations');
  },

  // Obtener reservas completadas con paginación
  async getCompletedReservations(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    return this.getReservationsByStatus('completed', page, pageSize);
  },

  // Obtener reservas por rango de fechas con paginación
  async getReservationsByDateRange(
    startDate: string,
    endDate: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const response = await index({
      filters: [
        Query.greaterThanEqual('startDate', startDate),
        Query.lessThanEqual('endDate', endDate),
      ],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(
      response.error || 'Failed to fetch reservations by date range'
    );
  },

  // Obtener reservas que necesitan review con paginación
  async getReservationsNeedingReview(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<ReservationModel>> {
    const offset = (page - 1) * pageSize;
    const response = await index({
      filters: [
        Query.equal('status', 'completed'),
        Query.equal('isReviewedByBorrower', false),
      ],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    if (response.success && response.data) {
      const totalPages = Math.ceil(response.data.total / pageSize);
      return {
        data: response.data.documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: response.data.total,
          itemsPerPage: pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }

    throw new Error(
      response.error || 'Failed to fetch reservations needing review'
    );
  },

  // Actualizar estado de la reserva
  async updateStatus(
    reservationId: string,
    status: ReservationStatusModel
  ): Promise<ApiResponse<ReservationModel>> {
    return update(reservationId, { status });
  },

  // Aprobar reserva
  async approveReservation(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    return update(reservationId, { status: 'approved' });
  },

  // Activar reserva (cuando comienza el préstamo)
  async activateReservation(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    return update(reservationId, { status: 'active' });
  },

  // Marcar como devuelto
  async markAsReturned(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    return update(reservationId, { status: 'returned' });
  },

  // Completar reserva
  async completeReservation(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    return update(reservationId, { status: 'completed' });
  },

  // Cancelar reserva
  async cancelReservation(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    return update(reservationId, { status: 'cancelled' });
  },

  // Marcar como revisado por borrower
  async markReviewedByBorrower(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    return update(reservationId, { isReviewedByBorrower: true });
  },

  // Marcar como revisado por owner
  async markReviewedByOwner(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    return update(reservationId, { isReviewedByOwner: true });
  },

  // Obtener estadísticas de reservas por usuario
  async getUserReservationStats(userId: string): Promise<
    ApiResponse<{
      total: number;
      pending: number;
      active: number;
      completed: number;
      cancelled: number;
    }>
  > {
    try {
      const [totalRes, pendingRes, activeRes, completedRes, cancelledRes] =
        await Promise.all([
          count([Query.equal('borrowerId', userId)]),
          count([
            Query.equal('borrowerId', userId),
            Query.equal('status', 'pending'),
          ]),
          count([
            Query.equal('borrowerId', userId),
            Query.equal('status', 'active'),
          ]),
          count([
            Query.equal('borrowerId', userId),
            Query.equal('status', 'completed'),
          ]),
          count([
            Query.equal('borrowerId', userId),
            Query.equal('status', 'cancelled'),
          ]),
        ]);

      const stats = {
        total: totalRes.data || 0,
        pending: pendingRes.data || 0,
        active: activeRes.data || 0,
        completed: completedRes.data || 0,
        cancelled: cancelledRes.data || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al obtener estadísticas',
      };
    }
  },
};

// Exportar también los métodos adicionales individualmente
export const {
  getReservationsByStatus,
  getReservationsByBorrower,
  getReservationsByOwner,
  getBorrowedReservations,
  getLendingReservations,
  getReservationsByItem,
  getActiveReservations,
  getPendingReservations,
  getCompletedReservations,
  getReservationsByDateRange,
  getReservationsNeedingReview,
  updateStatus,
  approveReservation,
  activateReservation,
  markAsReturned,
  completeReservation,
  cancelReservation,
  markReviewedByBorrower,
  markReviewedByOwner,
  getUserReservationStats,
} = reservationsAPI;
