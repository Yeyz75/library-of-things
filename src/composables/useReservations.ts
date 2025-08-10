import { ref } from 'vue';
import { reservationService } from '@/services/reservationService';
import { useUIStore } from '@/store/ui.store';
import type { Reservation } from '@/types';

export function useReservations() {
  const reservations = ref<Reservation[]>([]);
  const ui = useUIStore();

  const loadReservations = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await reservationService.getAllReservations();
      reservations.value = response.documents as unknown as Reservation[];
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar las reservas';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  return {
    reservations,
    loading: ui.loading,
    error: ui.error,
    loadReservations,
  };
}
