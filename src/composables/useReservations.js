import { ref } from 'vue';
import { reservationService } from '@/services/reservationService';
import { useUIStore } from '@/store/ui.store';

export function useReservations() {
  const reservations = ref([]);
  const ui = useUIStore();

  const loadReservations = async () => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await reservationService.getAllReservations();
      reservations.value = response.documents;
    } catch (err) {
      ui.setError(err.message || 'Error al cargar las reservas');
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
