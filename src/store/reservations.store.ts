import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { reservationsAPI } from '@/api';
import {
  index as getReservations,
  show as getReservation,
  save as saveReservation,
  remove as deleteReservationAPI,
} from '@/api/reservations';
import type {
  ReservationModel,
  ReservationStatusModel,
  ApiResponseModel,
} from '@/types/models';
import type { PaginatedResponse } from '@/types/pagination';

export const useReservationsStore = defineStore('reservations', () => {
  // State
  const reservations = ref<ReservationModel[]>([]);
  const currentReservation = ref<ReservationModel | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Pagination state for borrowed reservations
  const borrowedReservations = ref<ReservationModel[]>([]);
  const borrowedPagination = ref({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const isBorrowedLoading = ref(false);
  const borrowedError = ref<string | null>(null);

  // Pagination state for lending reservations
  const lendingReservations = ref<ReservationModel[]>([]);
  const lendingPagination = ref({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const isLendingLoading = ref(false);
  const lendingError = ref<string | null>(null);

  // Getters
  const activeBorrowedReservations = computed(() =>
    borrowedReservations.value.filter((r) => r.status === 'active')
  );

  const activeLendingReservations = computed(() =>
    lendingReservations.value.filter((r) => r.status === 'active')
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
      let response: unknown;

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

      // Normalize different response shapes: ApiResponseModel<{documents,total}> or PaginatedResponse<ReservationModel>
      let fetchedReservations: ReservationModel[] = [];

      // Type guard for ApiResponseModel with nested documents
      const isApiResponseWithDocuments = (
        obj: unknown
      ): obj is ApiResponseModel<{
        documents: ReservationModel[];
        total: number;
      }> => {
        if (typeof obj !== 'object' || obj === null) return false;

        const o = obj as Record<string, unknown>;

        if (!('success' in o)) return false;
        if (typeof o.success !== 'boolean') return false;
        if (!('data' in o)) return false;
        if (typeof o.data !== 'object' || o.data === null) return false;

        return true;
      };

      if (isApiResponseWithDocuments(response)) {
        const res = response;
        if (res.success && res.data) {
          const { documents } = res.data as { documents?: ReservationModel[] };
          if (Array.isArray(documents)) {
            fetchedReservations = documents;
          } else {
            throw new Error(res.error || 'Failed to fetch reservations');
          }
        } else {
          throw new Error(res.error || 'Failed to fetch reservations');
        }
      } else {
        // Assume PaginatedResponse<ReservationModel>
        const paginated = response as PaginatedResponse<ReservationModel>;

        if (paginated && Array.isArray(paginated.data)) {
          fetchedReservations = paginated.data;
        } else {
          throw new Error('Failed to fetch reservations');
        }
      }

      // Filtrar por múltiples status si se especifica
      if (filters?.statuses && filters.statuses.length > 0) {
        fetchedReservations = fetchedReservations.filter(
          (reservation: ReservationModel) =>
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

  // Fetch borrowed reservations with pagination
  async function fetchBorrowedReservations(
    borrowerId: string,
    page: number = 1,
    pageSize: number = 10,
    statuses: ReservationStatusModel[] = ['active', 'pending', 'approved']
  ) {
    isBorrowedLoading.value = true;
    borrowedError.value = null;

    try {
      const response = await reservationsAPI.getBorrowedReservations(
        borrowerId,
        page,
        pageSize,
        statuses
      );

      borrowedReservations.value = response.data;
      borrowedPagination.value = response.pagination;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch borrowed reservations';
      borrowedError.value = errorMessage;
    } finally {
      isBorrowedLoading.value = false;
    }
  }

  // Fetch lending reservations with pagination
  async function fetchLendingReservations(
    ownerId: string,
    page: number = 1,
    pageSize: number = 10,
    statuses: ReservationStatusModel[] = ['active', 'pending', 'approved']
  ) {
    isLendingLoading.value = true;
    lendingError.value = null;

    try {
      const response = await reservationsAPI.getLendingReservations(
        ownerId,
        page,
        pageSize,
        statuses
      );

      lendingReservations.value = response.data;
      lendingPagination.value = response.pagination;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch lending reservations';
      lendingError.value = errorMessage;
    } finally {
      isLendingLoading.value = false;
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

        // Update local state in all relevant arrays
        const index = reservations.value.findIndex((r) => r.$id === id);
        if (index !== -1) {
          reservations.value[index] = updatedReservation;
        }

        const borrowedIndex = borrowedReservations.value.findIndex(
          (r) => r.$id === id
        );
        if (borrowedIndex !== -1) {
          borrowedReservations.value[borrowedIndex] = updatedReservation;
        }

        const lendingIndex = lendingReservations.value.findIndex(
          (r) => r.$id === id
        );
        if (lendingIndex !== -1) {
          lendingReservations.value[lendingIndex] = updatedReservation;
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
        // Remove from all local state arrays
        reservations.value = reservations.value.filter((r) => r.$id !== id);
        borrowedReservations.value = borrowedReservations.value.filter(
          (r) => r.$id !== id
        );
        lendingReservations.value = lendingReservations.value.filter(
          (r) => r.$id !== id
        );

        if (currentReservation.value?.$id === id) {
          currentReservation.value = null;
        }

        // Update pagination counts
        if (borrowedPagination.value.totalItems > 0) {
          borrowedPagination.value.totalItems -= 1;
        }
        if (lendingPagination.value.totalItems > 0) {
          lendingPagination.value.totalItems -= 1;
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

  function clearBorrowedError() {
    borrowedError.value = null;
  }

  function clearLendingError() {
    lendingError.value = null;
  }

  function clearCurrentReservation() {
    currentReservation.value = null;
  }

  function resetBorrowedPagination() {
    borrowedReservations.value = [];
    borrowedPagination.value = {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    };
    borrowedError.value = null;
  }

  function resetLendingPagination() {
    lendingReservations.value = [];
    lendingPagination.value = {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    };
    lendingError.value = null;
  }

  return {
    // State
    reservations,
    currentReservation,
    isLoading,
    error,
    // Borrowed reservations state
    borrowedReservations,
    borrowedPagination,
    isBorrowedLoading,
    borrowedError,
    // Lending reservations state
    lendingReservations,
    lendingPagination,
    isLendingLoading,
    lendingError,
    // Getters
    activeBorrowedReservations,
    activeLendingReservations,
    pendingReservations,
    reservationsByStatus,
    // Actions
    fetchReservations,
    fetchBorrowedReservations,
    fetchLendingReservations,
    fetchReservationById,
    createReservation,
    updateReservationStatus,
    deleteReservation,
    clearError,
    clearBorrowedError,
    clearLendingError,
    clearCurrentReservation,
    resetBorrowedPagination,
    resetLendingPagination,
  };
});
