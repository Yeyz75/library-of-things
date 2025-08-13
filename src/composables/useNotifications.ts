import { ref, readonly, type Ref } from 'vue';
import { NotificationService } from '@/services/notificationService';
import { EmailService } from '@/services/emailService';
import type { ReservationModel, ItemModel, UserModel } from '@/types/models';

/**
 * Composable para manejar notificaciones por email
 */
export function useNotifications() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Envía notificación de nueva reserva
   */
  const notifyNewReservation = async (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await NotificationService.notifyNewReservation(
        reservation,
        item,
        borrower,
        owner
      );

      if (!result.success) {
        error.value = result.error || 'Error al enviar notificación';
        return false;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Envía notificación de reserva aprobada
   */
  const notifyReservationApproved = async (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await NotificationService.notifyReservationApproved(
        reservation,
        item,
        borrower,
        owner
      );

      if (!result.success) {
        error.value = result.error || 'Error al enviar notificación';
        return false;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Envía notificación de reserva rechazada
   */
  const notifyReservationRejected = async (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await NotificationService.notifyReservationRejected(
        reservation,
        item,
        borrower,
        owner
      );

      if (!result.success) {
        error.value = result.error || 'Error al enviar notificación';
        return false;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Envía recordatorio de préstamo
   */
  const sendLoanReminder = async (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await NotificationService.sendLoanReminder(
        reservation,
        item,
        borrower,
        owner
      );

      if (!result.success) {
        error.value = result.error || 'Error al enviar recordatorio';
        return false;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Envía confirmación de devolución
   */
  const notifyReturnConfirmation = async (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await NotificationService.notifyReturnConfirmation(
        reservation,
        item,
        borrower,
        owner
      );

      if (!result.success) {
        error.value = result.error || 'Error al enviar confirmación';
        return false;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Procesa recordatorios automáticos
   */
  const processAutomaticReminders = async (): Promise<{
    processed: number;
    errors: number;
  } | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await NotificationService.processAutomaticReminders();

      if (!result.success) {
        error.value = result.error || 'Error al procesar recordatorios';
        return null;
      }

      return result.data || { processed: 0, errors: 0 };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Envía una notificación personalizada
   */
  const sendCustomNotification = async (
    to: string,
    toName: string,
    subject: string,
    templateId: string,
    templateData: Record<string, unknown>
  ): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await EmailService.sendNotification({
        to,
        toName,
        subject,
        templateId,
        templateData,
      });

      if (!result.success) {
        error.value = result.error || 'Error al enviar notificación';
        return false;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Limpia el error actual
   */
  const clearError = () => {
    error.value = null;
  };

  return {
    // Estado
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Métodos de notificación
    notifyNewReservation,
    notifyReservationApproved,
    notifyReservationRejected,
    sendLoanReminder,
    notifyReturnConfirmation,
    processAutomaticReminders,
    sendCustomNotification,

    // Utilidades
    clearError,
  };
}

/**
 * Tipos para el composable
 */
export interface NotificationComposable {
  isLoading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  notifyNewReservation: (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ) => Promise<boolean>;
  notifyReservationApproved: (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ) => Promise<boolean>;
  notifyReservationRejected: (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ) => Promise<boolean>;
  sendLoanReminder: (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ) => Promise<boolean>;
  notifyReturnConfirmation: (
    reservation: ReservationModel,
    item: ItemModel,
    borrower: UserModel,
    owner: UserModel
  ) => Promise<boolean>;
  processAutomaticReminders: () => Promise<{
    processed: number;
    errors: number;
  } | null>;
  sendCustomNotification: (
    to: string,
    toName: string,
    subject: string,
    templateId: string,
    templateData: Record<string, unknown>
  ) => Promise<boolean>;
  clearError: () => void;
}
