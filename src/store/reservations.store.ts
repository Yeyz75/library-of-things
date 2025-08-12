import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { reservationsAPI } from '@/api';
import {
  index as getReservations,
  show as getReservation,
  save as saveReservation,
  remove as deleteReservationAPI,
} from '@/api/reservations';
import type { ReservationModel, ReservationStatusModel } from '@/types/models';

export const useReservationsStore = defineStore('reservations', () => {
  // State
  const reservations = ref<ReservationModel[]>([]);
  const currentReservation = ref<ReservationModel | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const borrowedReservations = computed(() =>
    reservations.value.filter((r) => r.status === 'active')
  );

  const pendingReservations = computed(() =>
    reservations.value.filter((r) => r.status === 'pending')
  );

  const reservationsByStatus = computed(() => {
    return reservations.value.reduce(
      (acc, reservation) => {
        const status = reservation.status as ReservationStatusModel | undefined;
        if (typeof status !== 'undefined') {
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(reservation);
        }
        return acc;
      },
      {} as Record<string, ReservationModel[]>
    );
  });

  // Actions
  async function fetchReservations(filters?: {
    borrowerId?: string;
    ownerId?: string;
    status?: ReservationStatusModel;
    statuses?: ReservationStatusModel[]; // Nueva opción para múltiples status
  }) {
    isLoading.value = true;
    error.value = null;

    try {
      let response;

      if (filters?.borrowerId) {
        response = await reservationsAPI.getReservationsByBorrower(
          filters.borrowerId
        );
      } else if (filters?.ownerId) {
        response = await reservationsAPI.getReservationsByOwner(
          filters.ownerId
        );
      } else if (filters?.status) {
        response = await reservationsAPI.getReservationsByStatus(
          filters.status
        );
      } else {
        response = await getReservations({
          orderBy: '$createdAt',
          orderType: 'DESC',
        });
      }

      if (response.success && response.data) {
        let fetchedReservations = response.data.documents;

        // Filtrar por múltiples status si se especifica
        if (filters?.statuses && filters.statuses.length > 0) {
          fetchedReservations = fetchedReservations.filter((reservation) =>
            filters.statuses!.includes(
              reservation.status as ReservationStatusModel
            )
          );
        }

        reservations.value = fetchedReservations;
      } else {
        throw new Error(response.error || 'Failed to fetch reservations');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch reservations';
      error.value = errorMessage;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchReservationById(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await getReservation(id);
      if (response.success && response.data) {
        currentReservation.value = response.data;
      } else {
        throw new Error(response.error || 'Reservation not found');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Reservation not found';
      error.value = errorMessage;
    } finally {
      isLoading.value = false;
    }
  }

  async function createReservation(
    reservationData: Omit<ReservationModel, '$id' | '$createdAt' | '$updatedAt'>
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await saveReservation(reservationData);

      if (response.success && response.data) {
        reservations.value.unshift(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create reservation');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create reservation';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateReservationStatus(
    id: string,
    status: ReservationStatusModel
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await reservationsAPI.updateStatus(id, status);

      if (response.success && response.data) {
        const updatedReservation = response.data;

        // Update local state
        const index = reservations.value.findIndex((r) => r.$id === id);
        if (index !== -1) {
          reservations.value[index] = updatedReservation;
        }
        if (currentReservation.value?.$id === id) {
          currentReservation.value = updatedReservation;
        }
      } else {
        throw new Error(response.error || 'Failed to update reservation');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update reservation';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteReservation(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await deleteReservationAPI(id);

      if (response.success) {
        // Remove from local state
        reservations.value = reservations.value.filter((r) => r.$id !== id);
        if (currentReservation.value?.$id === id) {
          currentReservation.value = null;
        }
      } else {
        throw new Error(response.error || 'Failed to delete reservation');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete reservation';
      error.value = errorMessage;
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
