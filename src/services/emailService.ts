import { functions } from '@/api/api';
import type { ApiResponse } from '@/api/api';

// Tipos para el sistema de notificaciones
export interface EmailNotificationData {
  to: string;
  toName?: string;
  subject: string;
  templateId: string;
  templateData: Record<string, unknown>;
}

export interface ReservationEmailData {
  reservationId: string;
  itemTitle: string;
  itemImageUrl?: string;
  borrowerName: string;
  borrowerEmail: string;
  ownerName: string;
  ownerEmail: string;
  startDate: string;
  endDate: string;
  message?: string;
  reservationUrl?: string;
}

export interface ReminderEmailData extends ReservationEmailData {
  daysUntilStart: number;
}

export type EmailTemplateType =
  | 'new-reservation'
  | 'reservation-approved'
  | 'reservation-rejected'
  | 'loan-reminder'
  | 'return-confirmation';

// Servicio principal de email
export class EmailService {
  private static readonly FUNCTION_ID = 'send-email-notification';

  /**
   * Envía una notificación por email usando Appwrite Functions
   */
  static async sendNotification(
    data: EmailNotificationData
  ): Promise<ApiResponse<void>> {
    try {
      const response = await functions.createExecution(
        this.FUNCTION_ID,
        JSON.stringify(data),
        false // async = false para obtener respuesta inmediata
      );

      if (response.status === 'completed') {
        return {
          success: true,
          message: 'Email enviado exitosamente',
        };
      } else {
        // Usar una propiedad válida o mostrar mensaje genérico
        return {
          success: false,
          error: response.errors || 'Error al enviar email',
        };
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al enviar email',
      };
    }
  }

  /**
   * Notificación de nueva reserva al propietario
   */
  static async sendNewReservationNotification(
    data: ReservationEmailData
  ): Promise<ApiResponse<void>> {
    const emailData: EmailNotificationData = {
      to: data.ownerEmail,
      toName: data.ownerName,
      subject: `Nueva solicitud de préstamo: ${data.itemTitle}`,
      templateId: 'new-reservation',
      templateData: {
        ownerName: data.ownerName,
        borrowerName: data.borrowerName,
        itemTitle: data.itemTitle,
        itemImageUrl: data.itemImageUrl,
        startDate: this.formatDate(data.startDate),
        endDate: this.formatDate(data.endDate),
        message: data.message,
        reservationUrl:
          data.reservationUrl ||
          `${window.location.origin}/reservations/${data.reservationId}`,
        actionUrl: `${window.location.origin}/reservations/${data.reservationId}?action=approve`,
      },
    };

    return this.sendNotification(emailData);
  }

  /**
   * Notificación de reserva aprobada al solicitante
   */
  static async sendReservationApprovedNotification(
    data: ReservationEmailData
  ): Promise<ApiResponse<void>> {
    const emailData: EmailNotificationData = {
      to: data.borrowerEmail,
      toName: data.borrowerName,
      subject: `¡Reserva aprobada! ${data.itemTitle}`,
      templateId: 'reservation-approved',
      templateData: {
        borrowerName: data.borrowerName,
        ownerName: data.ownerName,
        itemTitle: data.itemTitle,
        itemImageUrl: data.itemImageUrl,
        startDate: this.formatDate(data.startDate),
        endDate: this.formatDate(data.endDate),
        reservationUrl:
          data.reservationUrl ||
          `${window.location.origin}/reservations/${data.reservationId}`,
        contactInfo: `Puedes contactar con ${data.ownerName} en: ${data.ownerEmail}`,
      },
    };

    return this.sendNotification(emailData);
  }

  /**
   * Notificación de reserva rechazada al solicitante
   */
  static async sendReservationRejectedNotification(
    data: ReservationEmailData
  ): Promise<ApiResponse<void>> {
    const emailData: EmailNotificationData = {
      to: data.borrowerEmail,
      toName: data.borrowerName,
      subject: `Reserva no aprobada: ${data.itemTitle}`,
      templateId: 'reservation-rejected',
      templateData: {
        borrowerName: data.borrowerName,
        ownerName: data.ownerName,
        itemTitle: data.itemTitle,
        itemImageUrl: data.itemImageUrl,
        startDate: this.formatDate(data.startDate),
        endDate: this.formatDate(data.endDate),
        exploreUrl: `${window.location.origin}/explore`,
      },
    };

    return this.sendNotification(emailData);
  }

  /**
   * Recordatorio 1 día antes del préstamo
   */
  static async sendLoanReminderNotification(
    data: ReminderEmailData
  ): Promise<ApiResponse<void>> {
    // Enviar recordatorio al borrower
    const borrowerEmailData: EmailNotificationData = {
      to: data.borrowerEmail,
      toName: data.borrowerName,
      subject: `Recordatorio: Tu préstamo de ${data.itemTitle} comienza mañana`,
      templateId: 'loan-reminder',
      templateData: {
        recipientName: data.borrowerName,
        recipientType: 'borrower',
        itemTitle: data.itemTitle,
        itemImageUrl: data.itemImageUrl,
        startDate: this.formatDate(data.startDate),
        endDate: this.formatDate(data.endDate),
        contactName: data.ownerName,
        contactEmail: data.ownerEmail,
        reservationUrl:
          data.reservationUrl ||
          `${window.location.origin}/reservations/${data.reservationId}`,
        daysUntilStart: data.daysUntilStart,
      },
    };

    // Enviar recordatorio al owner
    const ownerEmailData: EmailNotificationData = {
      to: data.ownerEmail,
      toName: data.ownerName,
      subject: `Recordatorio: Préstamo de ${data.itemTitle} comienza mañana`,
      templateId: 'loan-reminder',
      templateData: {
        recipientName: data.ownerName,
        recipientType: 'owner',
        itemTitle: data.itemTitle,
        itemImageUrl: data.itemImageUrl,
        startDate: this.formatDate(data.startDate),
        endDate: this.formatDate(data.endDate),
        contactName: data.borrowerName,
        contactEmail: data.borrowerEmail,
        reservationUrl:
          data.reservationUrl ||
          `${window.location.origin}/reservations/${data.reservationId}`,
        daysUntilStart: data.daysUntilStart,
      },
    };

    // Enviar ambos emails
    const [borrowerResult, ownerResult] = await Promise.all([
      this.sendNotification(borrowerEmailData),
      this.sendNotification(ownerEmailData),
    ]);

    // Retornar éxito si al menos uno se envió correctamente
    if (borrowerResult.success || ownerResult.success) {
      return {
        success: true,
        message: 'Recordatorios enviados',
      };
    }

    return {
      success: false,
      error: 'Error al enviar recordatorios',
    };
  }

  /**
   * Confirmación de devolución
   */
  static async sendReturnConfirmationNotification(
    data: ReservationEmailData
  ): Promise<ApiResponse<void>> {
    // Notificar al borrower
    const borrowerEmailData: EmailNotificationData = {
      to: data.borrowerEmail,
      toName: data.borrowerName,
      subject: `Devolución confirmada: ${data.itemTitle}`,
      templateId: 'return-confirmation',
      templateData: {
        recipientName: data.borrowerName,
        recipientType: 'borrower',
        itemTitle: data.itemTitle,
        itemImageUrl: data.itemImageUrl,
        ownerName: data.ownerName,
        returnDate: this.formatDate(new Date().toISOString()),
        reviewUrl: `${window.location.origin}/reservations/${data.reservationId}/review`,
      },
    };

    // Notificar al owner
    const ownerEmailData: EmailNotificationData = {
      to: data.ownerEmail,
      toName: data.ownerName,
      subject: `Item devuelto: ${data.itemTitle}`,
      templateId: 'return-confirmation',
      templateData: {
        recipientName: data.ownerName,
        recipientType: 'owner',
        itemTitle: data.itemTitle,
        itemImageUrl: data.itemImageUrl,
        borrowerName: data.borrowerName,
        returnDate: this.formatDate(new Date().toISOString()),
        reviewUrl: `${window.location.origin}/reservations/${data.reservationId}/review`,
      },
    };

    // Enviar ambos emails
    const [borrowerResult, ownerResult] = await Promise.all([
      this.sendNotification(borrowerEmailData),
      this.sendNotification(ownerEmailData),
    ]);

    if (borrowerResult.success || ownerResult.success) {
      return {
        success: true,
        message: 'Confirmaciones de devolución enviadas',
      };
    }

    return {
      success: false,
      error: 'Error al enviar confirmaciones de devolución',
    };
  }

  /**
   * Formatea una fecha para mostrar en emails
   */
  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
