import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '@/lib/appwrite';
import type { Reservation, ReservationStatus } from '@/types';

export const useReservationsStore = defineStore('reservations', () => {
  // State
  const reservations = ref<Reservation[]>([]);
  const currentReservation = ref<Reservation | null>(null);
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
        if (!acc[reservation.status]) {
          acc[reservation.status] = [];
        }
        acc[reservation.status].push(reservation);
        return acc;
      },
      {} as Record<ReservationStatus, Reservation[]>
    );
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
      const queries = [];

      if (filters?.borrowerId) {
        queries.push(Query.equal('borrowerId', filters.borrowerId));
      }

      if (filters?.ownerId) {
        queries.push(Query.equal('ownerId', filters.ownerId));
      }

      if (filters?.status) {
        queries.push(Query.equal('status', filters.status));
      }

      queries.push(Query.orderDesc('$createdAt'));

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        queries
      );

      reservations.value = response.documents as unknown as Reservation[];
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
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        id
      );
      currentReservation.value = response as unknown as Reservation;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Reservation not found';
      error.value = errorMessage;
    } finally {
      isLoading.value = false;
    }
  }

  async function createReservation(
    reservationData: Omit<Reservation, '$id' | '$createdAt' | '$updatedAt'>
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        ID.unique(),
        reservationData
      );

      const newReservation = response as unknown as Reservation;
      reservations.value.unshift(newReservation);
      return newReservation;
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
    status: ReservationStatus
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        id,
        { status }
      );

      const updatedReservation = response as unknown as Reservation;

      // Update local state
      const index = reservations.value.findIndex((r) => r.$id === id);
      if (index !== -1) {
        reservations.value[index] = updatedReservation;
      }
      if (currentReservation.value?.$id === id) {
        currentReservation.value = updatedReservation;
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
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.RESERVATIONS, id);

      // Remove from local state
      reservations.value = reservations.value.filter((r) => r.$id !== id);
      if (currentReservation.value?.$id === id) {
        currentReservation.value = null;
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
