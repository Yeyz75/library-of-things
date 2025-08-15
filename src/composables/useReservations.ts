import { ref } from 'vue';
import { reservationsAPI } from '@/api';
import { index as getReservationsIndex } from '@/api/reservations';
import { useUIStore } from '@/store/ui.store';
import type { ReservationModel, ReservationStatusModel } from '@/types/models';

export function useReservations() {
  const reservations = ref<ReservationModel[]>([]);
  const ui = useUIStore();

  // Helper para normalizar distintas formas de respuesta (PaginatedResponse | ApiResponse | array)
  const extractDocuments = <T>(response: unknown): T[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response as T[];
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      if ('data' in obj && Array.isArray(obj['data'] as unknown[])) {
        return obj['data'] as T[];
      }
      if (
        'data' in obj &&
        obj['data'] !== undefined &&
        typeof obj['data'] === 'object'
      ) {
        const inner = obj['data'] as Record<string, unknown>;
        if (
          'documents' in inner &&
          Array.isArray(inner['documents'] as unknown[])
        ) {
          return inner['documents'] as T[];
        }
      }
      if ('documents' in obj && Array.isArray(obj['documents'] as unknown[])) {
        return obj['documents'] as T[];
      }
    }
    return [];
  };

  const loadReservations = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      // getReservationsIndex() devuelve ApiResponse<{documents,total}>
      const response = await getReservationsIndex();
      const respObj = response as {
        success?: boolean;
        data?: { documents?: ReservationModel[] };
        error?: string;
      };
      if (
        respObj.success &&
        respObj.data &&
        Array.isArray(respObj.data.documents)
      ) {
        reservations.value = respObj.data.documents;
      } else {
        throw new Error(respObj.error || 'Error al cargar las reservas');
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
      const docs = extractDocuments<ReservationModel>(response);
      if (docs.length > 0) {
        reservations.value = docs;
      } else {
        const maybe = response as unknown as Record<string, unknown>;
        throw new Error(
          (maybe?.error as string) || 'Error al cargar reservas por estado'
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
      const docs = extractDocuments<ReservationModel>(response);
      if (docs.length > 0) {
        reservations.value = docs;
      } else {
        const maybe = response as unknown as Record<string, unknown>;
        throw new Error(
          (maybe?.error as string) || 'Error al cargar reservas del usuario'
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
      const docs = extractDocuments<ReservationModel>(response);
      if (docs.length > 0) {
        reservations.value = docs;
      } else {
        const maybe = response as unknown as Record<string, unknown>;
        throw new Error(
          (maybe?.error as string) || 'Error al cargar reservas del propietario'
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
