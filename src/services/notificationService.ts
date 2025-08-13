import {
  EmailService,
  type ReservationEmailData,
  type ReminderEmailData,
} from './emailService';
import type { ReservationModel, ItemModel, UserModel } from '@/types/models';
import type { ApiResponse } from '@/api/api';

/**
 * Servicio de notificaciones que orquesta el envío de emails
 * para diferentes eventos del sistema de reservas
 */
export class NotificationService {
  /**
   * Envía notificación cuando se crea una nueva reserva
   */
  static async notifyNewReservation(
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<ApiResponse<void>> {
    try {
      const emailData: ReservationEmailData = {
        reservationId: reservation.$id || '',
        itemTitle: item.title || '',
        itemImageUrl: item.imageUrls?.[0],
        borrowerName: borrower.name || '',
        borrowerEmail: borrower.email || '',
        ownerName: owner.name || '',
        ownerEmail: owner.email || '',
        startDate: reservation.startDate || '',
        endDate: reservation.endDate || '',
        message: reservation.message,
      };

      return await EmailService.sendNewReservationNotification(emailData);
    } catch (error) {
      console.error('Error in notifyNewReservation:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al enviar notificación de nueva reserva',
      };
    }
  }

  /**
   * Envía notificación cuando una reserva es aprobada
   */
  static async notifyReservationApproved(
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<ApiResponse<void>> {
    try {
      const emailData: ReservationEmailData = {
        reservationId: reservation.$id || '',
        itemTitle: item.title || '',
        itemImageUrl: item.imageUrls?.[0],
        borrowerName: borrower.name || '',
        borrowerEmail: borrower.email || '',
        ownerName: owner.name || '',
        ownerEmail: owner.email || '',
        startDate: reservation.startDate || '',
        endDate: reservation.endDate || '',
        message: reservation.message,
      };

      return await EmailService.sendReservationApprovedNotification(emailData);
    } catch (error) {
      console.error('Error in notifyReservationApproved:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al enviar notificación de reserva aprobada',
      };
    }
  }

  /**
   * Envía notificación cuando una reserva es rechazada
   */
  static async notifyReservationRejected(
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<ApiResponse<void>> {
    try {
      const emailData: ReservationEmailData = {
        reservationId: reservation.$id || '',
        itemTitle: item.title || '',
        itemImageUrl: item.imageUrls?.[0],
        borrowerName: borrower.name || '',
        borrowerEmail: borrower.email || '',
        ownerName: owner.name || '',
        ownerEmail: owner.email || '',
        startDate: reservation.startDate || '',
        endDate: reservation.endDate || '',
        message: reservation.message,
      };

      return await EmailService.sendReservationRejectedNotification(emailData);
    } catch (error) {
      console.error('Error in notifyReservationRejected:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al enviar notificación de reserva rechazada',
      };
    }
  }

  /**
   * Envía recordatorio 1 día antes del préstamo
   */
  static async sendLoanReminder(
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<ApiResponse<void>> {
    try {
      const startDate = new Date(reservation.startDate || '');
      const today = new Date();
      const daysUntilStart = Math.ceil(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const emailData: ReminderEmailData = {
        reservationId: reservation.$id || '',
        itemTitle: item.title || '',
        itemImageUrl: item.imageUrls?.[0],
        borrowerName: borrower.name || '',
        borrowerEmail: borrower.email || '',
        ownerName: owner.name || '',
        ownerEmail: owner.email || '',
        startDate: reservation.startDate || '',
        endDate: reservation.endDate || '',
        message: reservation.message,
        daysUntilStart,
      };

      return await EmailService.sendLoanReminderNotification(emailData);
    } catch (error) {
      console.error('Error in sendLoanReminder:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al enviar recordatorio de préstamo',
      };
    }
  }

  /**
   * Envía confirmación de devolución
   */
  static async notifyReturnConfirmation(
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<ApiResponse<void>> {
    try {
      const emailData: ReservationEmailData = {
        reservationId: reservation.$id || '',
        itemTitle: item.title || '',
        itemImageUrl: item.imageUrls?.[0],
        borrowerName: borrower.name || '',
        borrowerEmail: borrower.email || '',
        ownerName: owner.name || '',
        ownerEmail: owner.email || '',
        startDate: reservation.startDate || '',
        endDate: reservation.endDate || '',
        message: reservation.message,
      };

      return await EmailService.sendReturnConfirmationNotification(emailData);
    } catch (error) {
      console.error('Error in notifyReturnConfirmation:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al enviar confirmación de devolución',
      };
    }
  }

  /**
   * Procesa recordatorios automáticos para reservas que comienzan mañana
   */
  static async processAutomaticReminders(): Promise<
    ApiResponse<{ processed: number; errors: number }>
  > {
    try {
      // Esta función sería llamada por un cron job o tarea programada
      // Por ahora, retornamos una implementación básica

      console.log('Processing automatic reminders...');

      // TODO: Implementar lógica para:
      // 1. Obtener reservas que comienzan mañana
      // 2. Para cada reserva, obtener datos del item, borrower y owner
      // 3. Enviar recordatorio usando sendLoanReminder

      return {
        success: true,
        data: {
          processed: 0,
          errors: 0,
        },
        message: 'Recordatorios automáticos procesados',
      };
    } catch (error) {
      console.error('Error in processAutomaticReminders:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar recordatorios automáticos',
      };
    }
  }
}
