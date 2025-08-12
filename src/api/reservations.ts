import { apiResource, COLLECTIONS, Query, type ApiResponse } from './api';
import type { ReservationModel, ReservationStatusModel } from '@/types/models';

// Endpoint para reservations
const endpoint = COLLECTIONS.RESERVATIONS;

// Exportar métodos estándar usando destructuring
export const { index, show, save, update, remove, search, count } =
  apiResource<ReservationModel>(endpoint);

// Métodos adicionales específicos para reservations
export const reservationsAPI = {
  // Obtener reservas por estado
  async getReservationsByStatus(
    status: ReservationStatusModel
  ): Promise<ApiResponse<{ documents: ReservationModel[]; total: number }>> {
    return index({
      filters: [Query.equal('status', status ?? '')],
    });
  },

  // Obtener reservas por borrower (usuario que pide prestado)
  async getReservationsByBorrower(
    borrowerId: string
  ): Promise<ApiResponse<{ documents: ReservationModel[]; total: number }>> {
    return index({
      filters: [Query.equal('borrowerId', borrowerId)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Obtener reservas por owner (propietario del item)
  async getReservationsByOwner(
    ownerId: string
  ): Promise<ApiResponse<{ documents: ReservationModel[]; total: number }>> {
    return index({
      filters: [Query.equal('ownerId', ownerId)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Obtener reservas por item
  async getReservationsByItem(
    itemId: string
  ): Promise<ApiResponse<{ documents: ReservationModel[]; total: number }>> {
    return index({
      filters: [Query.equal('itemId', itemId)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Obtener reservas activas
  async getActiveReservations(): Promise<
    ApiResponse<{ documents: ReservationModel[]; total: number }>
  > {
    return index({
      filters: [Query.equal('status', 'active')],
    });
  },

  // Obtener reservas pendientes
  async getPendingReservations(): Promise<
    ApiResponse<{ documents: ReservationModel[]; total: number }>
  > {
    return index({
      filters: [Query.equal('status', 'pending')],
      orderBy: '$createdAt',
      orderType: 'ASC',
    });
  },

  // Obtener reservas completadas
  async getCompletedReservations(): Promise<
    ApiResponse<{ documents: ReservationModel[]; total: number }>
  > {
    return index({
      filters: [Query.equal('status', 'completed')],
    });
  },

  // Obtener reservas por rango de fechas
  async getReservationsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{ documents: ReservationModel[]; total: number }>> {
    return index({
      filters: [
        Query.greaterThanEqual('startDate', startDate),
        Query.lessThanEqual('endDate', endDate),
      ],
    });
  },

  // Obtener reservas que necesitan review
  async getReservationsNeedingReview(): Promise<
    ApiResponse<{ documents: ReservationModel[]; total: number }>
  > {
    return index({
      filters: [
        Query.equal('status', 'completed'),
        Query.equal('isReviewedByBorrower', false),
      ],
    });
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
