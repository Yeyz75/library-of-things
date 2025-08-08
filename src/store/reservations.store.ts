import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { reservationsService } from '@/services/reservations.service';
import type { Reservation, ReservationStatus } from '@/types';

export const useReservationsStore = defineStore('reservations', () => {
  // State
  const reservations = ref<Reservation[]>([]);
  const currentReservation = ref<Reservation | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const borrowedReservations = computed(() =>
    reservations.value.filter(r => r.status === 'active')
  );

  const pendingReservations = computed(() =>
    reservations.value.filter(r => r.status === 'pending')
  );

  const reservationsByStatus = computed(() => {
    return reservations.value.reduce((acc, reservation) => {
      if (!acc[reservation.status]) {
        acc[reservation.status] = [];
      }
      acc[reservation.status].push(reservation);
      return acc;
    }, {} as Record<ReservationStatus, Reservation[]>);
  });

  // Actions
  async function fetchReservations(filters?: {
    borrowerId?: string;
    ownerId?: string;
    status?: ReservationStatus;
  }) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await reservationsService.getReservations(filters);
      if (response.success && response.data) {
        reservations.value = response.data;
      } else {
        error.value = response.error || 'Failed to fetch reservations';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch reservations';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchReservationById(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await reservationsService.getReservationById(id);
      if (response.success && response.data) {
        currentReservation.value = response.data;
      } else {
        error.value = response.error || 'Reservation not found';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch reservation';
    } finally {
      isLoading.value = false;
    }
  }

  async function createReservation(
    reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await reservationsService.createReservation(reservationData);
      if (response.success && response.data) {
        // Refresh reservations list
        await fetchReservations();
        return response.data;
      } else {
        error.value = response.error || 'Failed to create reservation';
        throw new Error(error.value);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create reservation';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateReservationStatus(id: string, status: ReservationStatus) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await reservationsService.updateReservationStatus(id, status);
      if (response.success) {
        // Update local state
        const index = reservations.value.findIndex(r => r.id === id);
        if (index !== -1) {
          reservations.value[index].status = status;
        }
        if (currentReservation.value?.id === id) {
          currentReservation.value.status = status;
        }
      } else {
        error.value = response.error || 'Failed to update reservation';
        throw new Error(error.value);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update reservation';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteReservation(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await reservationsService.deleteReservation(id);
      if (response.success) {
        // Remove from local state
        reservations.value = reservations.value.filter(r => r.id !== id);
        if (currentReservation.value?.id === id) {
          currentReservation.value = null;
        }
      } else {
        error.value = response.error || 'Failed to delete reservation';
        throw new Error(error.value);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete reservation';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentReservation() {
    currentReservation.value = null;
  }

  return {
    // State
    reservations,
    currentReservation,
    isLoading,
    error,
    // Getters
    borrowedReservations,
    pendingReservations,
    reservationsByStatus,
    // Actions
    fetchReservations,
    fetchReservationById,
    createReservation,
    updateReservationStatus,
    deleteReservation,
    clearError,
    clearCurrentReservation,
  };
});