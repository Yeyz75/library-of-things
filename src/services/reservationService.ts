import {
  index,
  save,
  update,
  show,
  approveReservation,
  markAsReturned,
  completeReservation,
} from '../api/reservations';
import { show as getItem } from '../api/items';
import { show as getUser } from '../api/users';
import { NotificationService } from './notificationService';
import type { ReservationModel } from '@/types/models';
import type { ApiResponse } from '@/api/api';

export const reservationService = {
  async getAllReservations() {
    const response = await index();
    if (response.success) {
      return {
        documents: response.data?.documents || [],
        total: response.data?.total || 0,
      };
    }
    throw new Error(response.error || 'Failed to get reservations');
  },

  /**
   * Crea una nueva reserva y envía notificación al propietario
   */
  async createReservation(
    reservationData: Omit<ReservationModel, '$id' | '$createdAt' | '$updatedAt'>
  ): Promise<ApiResponse<ReservationModel>> {
    try {
      // Prevent borrower being the owner on the client/service layer
      if (
        reservationData.borrowerId &&
        reservationData.ownerId &&
        reservationData.borrowerId === reservationData.ownerId
      ) {
        return {
          success: false,
          error:
            'No se puede crear una reserva: el solicitante es el propietario del artículo.',
        } as ApiResponse<ReservationModel>;
      }

      // Crear la reserva
      const reservationResponse = await save(reservationData);

      if (!reservationResponse.success || !reservationResponse.data) {
        return reservationResponse;
      }

      const reservation = reservationResponse.data;

      // Obtener datos necesarios para la notificación
      const [itemResponse, borrowerResponse, ownerResponse] = await Promise.all(
        [
          getItem(reservation.itemId || ''),
          getUser(reservation.borrowerId || ''),
          getUser(reservation.ownerId || ''),
        ]
      );

      // Enviar notificación si todos los datos están disponibles
      if (
        itemResponse.success &&
        borrowerResponse.success &&
        ownerResponse.success
      ) {
        await NotificationService.notifyNewReservation(
          reservation,
          itemResponse.data!,
          borrowerResponse.data!,
          ownerResponse.data!
        );
      }

      return reservationResponse;
    } catch (error) {
      console.error('Error creating reservation:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Error al crear la reserva',
      };
    }
  },

  /**
   * Aprueba una reserva y envía notificación al solicitante
   */
  async approveReservation(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    try {
      // Aprobar la reserva
      const reservationResponse = await approveReservation(reservationId);

      if (!reservationResponse.success || !reservationResponse.data) {
        return reservationResponse;
      }

      const reservation = reservationResponse.data;

      // Obtener datos necesarios para la notificación
      const [itemResponse, borrowerResponse, ownerResponse] = await Promise.all(
        [
          getItem(reservation.itemId || ''),
          getUser(reservation.borrowerId || ''),
          getUser(reservation.ownerId || ''),
        ]
      );

      // Enviar notificación si todos los datos están disponibles
      if (
        itemResponse.success &&
        borrowerResponse.success &&
        ownerResponse.success
      ) {
        await NotificationService.notifyReservationApproved(
          reservation,
          itemResponse.data!,
          borrowerResponse.data!,
          ownerResponse.data!
        );
      }

      return reservationResponse;
    } catch (error) {
      console.error('Error approving reservation:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al aprobar la reserva',
      };
    }
  },

  /**
   * Rechaza una reserva y envía notificación al solicitante
   */
  async rejectReservation(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    try {
      // Cambiar estado a cancelled (rechazada)
      const reservationResponse = await update(reservationId, {
        status: 'cancelled',
      });

      if (!reservationResponse.success || !reservationResponse.data) {
        return reservationResponse;
      }

      const reservation = reservationResponse.data;

      // Obtener datos necesarios para la notificación
      const [itemResponse, borrowerResponse, ownerResponse] = await Promise.all(
        [
          getItem(reservation.itemId || ''),
          getUser(reservation.borrowerId || ''),
          getUser(reservation.ownerId || ''),
        ]
      );

      // Enviar notificación si todos los datos están disponibles
      if (
        itemResponse.success &&
        borrowerResponse.success &&
        ownerResponse.success
      ) {
        await NotificationService.notifyReservationRejected(
          reservation,
          itemResponse.data!,
          borrowerResponse.data!,
          ownerResponse.data!
        );
      }

      return reservationResponse;
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al rechazar la reserva',
      };
    }
  },

  /**
   * Marca una reserva como devuelta y envía confirmación
   */
  async markAsReturned(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    try {
      // Marcar como devuelta
      const reservationResponse = await markAsReturned(reservationId);

      if (!reservationResponse.success || !reservationResponse.data) {
        return reservationResponse;
      }

      const reservation = reservationResponse.data;

      // Obtener datos necesarios para la notificación
      const [itemResponse, borrowerResponse, ownerResponse] = await Promise.all(
        [
          getItem(reservation.itemId || ''),
          getUser(reservation.borrowerId || ''),
          getUser(reservation.ownerId || ''),
        ]
      );

      // Enviar notificación si todos los datos están disponibles
      if (
        itemResponse.success &&
        borrowerResponse.success &&
        ownerResponse.success
      ) {
        await NotificationService.notifyReturnConfirmation(
          reservation,
          itemResponse.data!,
          borrowerResponse.data!,
          ownerResponse.data!
        );
      }

      return reservationResponse;
    } catch (error) {
      console.error('Error marking reservation as returned:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al marcar como devuelto',
      };
    }
  },

  /**
   * Completa una reserva
   */
  async completeReservation(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    try {
      return await completeReservation(reservationId);
    } catch (error) {
      console.error('Error completing reservation:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al completar la reserva',
      };
    }
  },

  /**
   * Obtiene una reserva por ID
   */
  async getReservation(
    reservationId: string
  ): Promise<ApiResponse<ReservationModel>> {
    try {
      return await show(reservationId);
    } catch (error) {
      console.error('Error getting reservation:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al obtener la reserva',
      };
    }
  },

  /**
   * Procesa recordatorios automáticos para reservas que comienzan mañana
   */
  async processLoanReminders(): Promise<
    ApiResponse<{ processed: number; errors: number }>
  > {
    try {
      // Calcular fecha de mañana
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Obtener reservas que comienzan mañana
      const reservationsResponse = await index({
        filters: [`startDate=${tomorrowStr}`, 'status=approved'],
      });

      if (!reservationsResponse.success || !reservationsResponse.data) {
        return {
          success: false,
          error: 'Error al obtener reservas para recordatorios',
        };
      }

      const reservations = reservationsResponse.data.documents;
      let processed = 0;
      let errors = 0;

      // Procesar cada reserva
      for (const reservation of reservations) {
        try {
          // Obtener datos necesarios
          const [itemResponse, borrowerResponse, ownerResponse] =
            await Promise.all([
              getItem(reservation.itemId || ''),
              getUser(reservation.borrowerId || ''),
              getUser(reservation.ownerId || ''),
            ]);

          if (
            itemResponse.success &&
            borrowerResponse.success &&
            ownerResponse.success
          ) {
            await NotificationService.sendLoanReminder(
              reservation,
              itemResponse.data!,
              borrowerResponse.data!,
              ownerResponse.data!
            );
            processed++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(
            `Error processing reminder for reservation ${reservation.$id}:`,
            error
          );
          errors++;
        }
      }

      return {
        success: true,
        data: { processed, errors },
        message: `Procesados ${processed} recordatorios, ${errors} errores`,
      };
    } catch (error) {
      console.error('Error processing loan reminders:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar recordatorios',
      };
    }
  },
};
