import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '@/api/api';
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

      // Nueva funcionalidad para múltiples status
      if (filters?.statuses && filters.statuses.length > 0) {
        // Si Query.or no está disponible, cargamos todas las reservaciones y filtramos después
        // queries.push(Query.or(
        //   filters.statuses.map(status => Query.equal('status', status))
        // ));
        // Por ahora, no agregamos filtro de status y filtraremos después
      }

      queries.push(Query.orderDesc('$createdAt'));

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        queries
      );

      let fetchedReservations =
        response.documents as unknown as ReservationModel[];

      // Filtrar por múltiples status si se especifica
      if (filters?.statuses && filters.statuses.length > 0) {
        fetchedReservations = fetchedReservations.filter((reservation) =>
          filters.statuses!.includes(
            reservation.status as ReservationStatusModel
          )
        );
      }

      reservations.value = fetchedReservations;
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
      currentReservation.value = response as unknown as ReservationModel;
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
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        ID.unique(),
        reservationData
      );

      const newReservation = response as unknown as ReservationModel;
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
    status: ReservationStatusModel
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

      const updatedReservation = response as unknown as ReservationModel;

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
