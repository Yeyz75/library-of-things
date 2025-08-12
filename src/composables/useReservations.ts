import { ref } from 'vue';
import { reservationsAPI } from '@/api';
import { index as getReservationsIndex } from '@/api/reservations';
import { useUIStore } from '@/store/ui.store';
import type { ReservationModel, ReservationStatusModel } from '@/types/models';

export function useReservations() {
  const reservations = ref<ReservationModel[]>([]);
  const ui = useUIStore();

  const loadReservations = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await getReservationsIndex();
      if (response.success && response.data) {
        reservations.value = response.data.documents;
      } else {
        throw new Error(response.error || 'Error al cargar las reservas');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar las reservas';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  const loadReservationsByStatus = async (
    status: ReservationStatusModel
  ): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await reservationsAPI.getReservationsByStatus(status);
      if (response.success && response.data) {
        reservations.value = response.data.documents;
      } else {
        throw new Error(
          response.error || 'Error al cargar reservas por estado'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al cargar reservas por estado';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  const loadUserReservations = async (userId: string): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await reservationsAPI.getReservationsByBorrower(userId);
      if (response.success && response.data) {
        reservations.value = response.data.documents;
      } else {
        throw new Error(
          response.error || 'Error al cargar reservas del usuario'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al cargar reservas del usuario';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  const loadOwnerReservations = async (ownerId: string): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await reservationsAPI.getReservationsByOwner(ownerId);
      if (response.success && response.data) {
        reservations.value = response.data.documents;
      } else {
        throw new Error(
          response.error || 'Error al cargar reservas del propietario'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al cargar reservas del propietario';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  const updateReservationStatus = async (
    reservationId: string,
    status: ReservationStatusModel
  ): Promise<boolean> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await reservationsAPI.updateStatus(
        reservationId,
        status
      );
      if (response.success && response.data) {
        // Update local state
        const index = reservations.value.findIndex(
          (r) => r.$id === reservationId
        );
        if (index !== -1) {
          reservations.value[index] = response.data;
        }
        return true;
      } else {
        throw new Error(
          response.error || 'Error al actualizar estado de reserva'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al actualizar estado de reserva';
      ui.setError(message);
      return false;
    } finally {
      ui.setLoading(false);
    }
  };

  return {
    reservations,
    loading: ui.loading,
    error: ui.error,
    loadReservations,
    loadReservationsByStatus,
    loadUserReservations,
    loadOwnerReservations,
    updateReservationStatus,
  };
}
