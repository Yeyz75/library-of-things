import {
  COLLECTIONS,
  handleApiError,
  handleApiSuccess,
  withRetry,
  type ApiResponse,
  type QueryOptions,
  type BaseEntity,
} from './api';
import { DatabaseService } from './database';

// Interfaz para Reservation con flujo de estados
export interface Reservation extends BaseEntity {
  itemId: string;
  userId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalAmount?: number;
  notes?: string;
  metadata: Record<string, unknown>;
  // Campos adicionales para tracking
  confirmedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  cancelReason?: string;
}

// Interfaz para crear una nueva reserva
export interface CreateReservationData {
  itemId: string;
  userId: string;
  startDate: string;
  endDate: string;
  totalAmount?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// Interfaz para actualizar una reserva
export interface UpdateReservationData {
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// Interfaz para filtros de búsqueda de reservas
export interface ReservationFilters {
  userId?: string;
  itemId?: string;
  status?: Reservation['status'];
  startDate?: string; // Fecha de inicio mínima
  endDate?: string; // Fecha de fin máxima
  dateRange?: {
    start: string;
    end: string;
  };
}

// Interfaz para conflictos de reserva
export interface ReservationConflict {
  conflictingReservation: Reservation;
  overlapStart: string;
  overlapEnd: string;
  overlapDays: number;
}

// Interfaz para historial de cambios de estado
export interface ReservationStatusHistory extends BaseEntity {
  reservationId: string;
  fromStatus: Reservation['status'] | null;
  toStatus: Reservation['status'];
  changedAt: string;
  changedBy?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// Estados válidos para transiciones
const VALID_STATUS_TRANSITIONS: Record<
  Reservation['status'],
  Reservation['status'][]
> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Clase principal para gestión de reservas
export class ReservationsService {
  // Crear una nueva reserva con validación de disponibilidad
  static async createReservation(
    data: CreateReservationData
  ): Promise<ApiResponse<Reservation>> {
    // Validar datos requeridos
    const validation = this.validateReservationData(data);
    if (!validation.isValid) {
      return handleApiError<Reservation>(new Error(validation.error));
    }

    // Validar fechas
    const dateValidation = this.validateDates(data.startDate, data.endDate);
    if (!dateValidation.isValid) {
      return handleApiError<Reservation>(new Error(dateValidation.error));
    }

    try {
      return await withRetry(async () => {
        // Verificar disponibilidad del item en el rango de fechas
        const availabilityCheck = await this.checkAvailability(
          data.itemId,
          data.startDate,
          data.endDate
        );

        if (!availabilityCheck.success || !availabilityCheck.data?.available) {
          const conflicts = availabilityCheck.data?.conflicts || [];
          const conflictMessage =
            conflicts.length > 0
              ? `Conflicto con reserva existente del ${conflicts[0].overlapStart} al ${conflicts[0].overlapEnd}`
              : 'El item no está disponible en las fechas seleccionadas';

          return handleApiError<Reservation>(new Error(conflictMessage));
        }

        // Crear la reserva
        const reservationData: Omit<
          Reservation,
          '$id' | 'createdAt' | 'updatedAt'
        > = {
          ...data,
          status: 'pending',
          metadata: data.metadata || {},
        };

        const result = await DatabaseService.create<Reservation>(
          COLLECTIONS.RESERVATIONS,
          reservationData
        );

        if (result.success && result.data) {
          // Registrar en el historial
          await this.addStatusHistory(
            result.data.$id,
            null,
            'pending',
            'Reserva creada'
          );
        }

        return result;
      });
    } catch (error) {
      return handleApiError<Reservation>(error);
    }
  }

  // Obtener reserva por ID
  static async getReservation(id: string): Promise<ApiResponse<Reservation>> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<Reservation>(new Error('ID de reserva requerido'));
    }

    return await DatabaseService.read<Reservation>(
      COLLECTIONS.RESERVATIONS,
      id
    );
  }

  // Actualizar reserva con validaciones
  static async updateReservation(
    id: string,
    data: UpdateReservationData
  ): Promise<ApiResponse<Reservation>> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<Reservation>(new Error('ID de reserva requerido'));
    }

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return handleApiError<Reservation>(
        new Error('Datos de actualización requeridos')
      );
    }

    try {
      return await withRetry(async () => {
        // Obtener reserva actual
        const currentReservation = await this.getReservation(id);
        if (!currentReservation.success || !currentReservation.data) {
          return handleApiError<Reservation>(
            new Error('Reserva no encontrada')
          );
        }

        // Validar que la reserva se pueda modificar
        if (
          ['completed', 'cancelled'].includes(currentReservation.data.status)
        ) {
          return handleApiError<Reservation>(
            new Error(
              'No se puede modificar una reserva completada o cancelada'
            )
          );
        }

        // Si se están actualizando fechas, validar disponibilidad
        if (data.startDate || data.endDate) {
          const startDate = data.startDate || currentReservation.data.startDate;
          const endDate = data.endDate || currentReservation.data.endDate;

          const dateValidation = this.validateDates(startDate, endDate);
          if (!dateValidation.isValid) {
            return handleApiError<Reservation>(new Error(dateValidation.error));
          }

          // Verificar disponibilidad excluyendo la reserva actual
          const availabilityCheck = await this.checkAvailability(
            currentReservation.data.itemId,
            startDate,
            endDate,
            id // Excluir esta reserva de la verificación
          );

          if (
            !availabilityCheck.success ||
            !availabilityCheck.data?.available
          ) {
            const conflicts = availabilityCheck.data?.conflicts || [];
            const conflictMessage =
              conflicts.length > 0
                ? `Conflicto con reserva existente del ${conflicts[0].overlapStart} al ${conflicts[0].overlapEnd}`
                : 'El item no está disponible en las fechas seleccionadas';

            return handleApiError<Reservation>(new Error(conflictMessage));
          }
        }

        return await DatabaseService.update<Reservation>(
          COLLECTIONS.RESERVATIONS,
          id,
          data
        );
      });
    } catch (error) {
      return handleApiError<Reservation>(error);
    }
  }

  // Cambiar estado de reserva con validación de transiciones
  static async changeReservationStatus(
    id: string,
    newStatus: Reservation['status'],
    reason?: string,
    changedBy?: string
  ): Promise<ApiResponse<Reservation>> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<Reservation>(new Error('ID de reserva requerido'));
    }

    if (
      !newStatus ||
      !Object.keys(VALID_STATUS_TRANSITIONS).includes(newStatus)
    ) {
      return handleApiError<Reservation>(new Error('Estado inválido'));
    }

    try {
      return await withRetry(async () => {
        // Obtener reserva actual
        const currentReservation = await this.getReservation(id);
        if (!currentReservation.success || !currentReservation.data) {
          return handleApiError<Reservation>(
            new Error('Reserva no encontrada')
          );
        }

        const currentStatus = currentReservation.data.status;

        // Validar transición de estado
        if (!VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
          return handleApiError<Reservation>(
            new Error(
              `No se puede cambiar de estado '${currentStatus}' a '${newStatus}'`
            )
          );
        }

        // Preparar datos de actualización con timestamps específicos
        const updateData: Partial<Reservation> = {
          status: newStatus,
        };

        // Agregar timestamps específicos según el estado
        const now = new Date().toISOString();
        switch (newStatus) {
          case 'confirmed':
            updateData.confirmedAt = now;
            break;
          case 'cancelled':
            updateData.cancelledAt = now;
            if (reason) {
              updateData.cancelReason = reason;
            }
            break;
          case 'completed':
            updateData.completedAt = now;
            break;
        }

        // Actualizar reserva
        const result = await DatabaseService.update<Reservation>(
          COLLECTIONS.RESERVATIONS,
          id,
          updateData
        );

        if (result.success) {
          // Registrar cambio en el historial
          await this.addStatusHistory(
            id,
            currentStatus,
            newStatus,
            reason,
            changedBy
          );
        }

        return result;
      });
    } catch (error) {
      return handleApiError<Reservation>(error);
    }
  }

  // Eliminar reserva (solo si está en estado pending)
  static async deleteReservation(id: string): Promise<ApiResponse<void>> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<void>(new Error('ID de reserva requerido'));
    }

    try {
      return await withRetry(async () => {
        // Verificar que la reserva se pueda eliminar
        const reservation = await this.getReservation(id);
        if (!reservation.success || !reservation.data) {
          return handleApiError<void>(new Error('Reserva no encontrada'));
        }

        if (reservation.data.status !== 'pending') {
          return handleApiError<void>(
            new Error('Solo se pueden eliminar reservas en estado pendiente')
          );
        }

        return await DatabaseService.delete(COLLECTIONS.RESERVATIONS, id);
      });
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  // Buscar reservas con filtros avanzados
  static async searchReservations(
    filters: ReservationFilters = {},
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: Reservation[]; total: number }>> {
    try {
      return await withRetry(async () => {
        const queryFilters: string[] = [];

        // Aplicar filtros
        if (filters.userId) {
          queryFilters.push(`userId==${filters.userId}`);
        }
        if (filters.itemId) {
          queryFilters.push(`itemId==${filters.itemId}`);
        }
        if (filters.status) {
          queryFilters.push(`status==${filters.status}`);
        }

        const queryOptions: QueryOptions = {
          ...options,
          filters: [...(options.filters || []), ...queryFilters],
        };

        const result = await DatabaseService.query<Reservation>(
          COLLECTIONS.RESERVATIONS,
          queryOptions
        );

        if (!result.success || !result.data) {
          return result;
        }

        let filteredDocuments = result.data.documents;

        // Filtrar por rango de fechas si se especifica
        if (filters.dateRange) {
          filteredDocuments = filteredDocuments.filter((reservation) => {
            const reservationStart = new Date(reservation.startDate);
            const reservationEnd = new Date(reservation.endDate);
            const filterStart = new Date(filters.dateRange!.start);
            const filterEnd = new Date(filters.dateRange!.end);

            // Verificar si hay solapamiento
            return (
              reservationStart <= filterEnd && reservationEnd >= filterStart
            );
          });
        }

        // Filtrar por fecha de inicio mínima
        if (filters.startDate) {
          const minStartDate = new Date(filters.startDate);
          filteredDocuments = filteredDocuments.filter((reservation) => {
            return new Date(reservation.startDate) >= minStartDate;
          });
        }

        // Filtrar por fecha de fin máxima
        if (filters.endDate) {
          const maxEndDate = new Date(filters.endDate);
          filteredDocuments = filteredDocuments.filter((reservation) => {
            return new Date(reservation.endDate) <= maxEndDate;
          });
        }

        return handleApiSuccess({
          documents: filteredDocuments,
          total: filteredDocuments.length,
        });
      });
    } catch (error) {
      return handleApiError<{ documents: Reservation[]; total: number }>(error);
    }
  }

  // Verificar disponibilidad de un item en un rango de fechas
  static async checkAvailability(
    itemId: string,
    startDate: string,
    endDate: string,
    excludeReservationId?: string
  ): Promise<
    ApiResponse<{ available: boolean; conflicts: ReservationConflict[] }>
  > {
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      return handleApiError<{
        available: boolean;
        conflicts: ReservationConflict[];
      }>(new Error('ID de item requerido'));
    }

    const dateValidation = this.validateDates(startDate, endDate);
    if (!dateValidation.isValid) {
      return handleApiError<{
        available: boolean;
        conflicts: ReservationConflict[];
      }>(new Error(dateValidation.error));
    }

    try {
      return await withRetry(async () => {
        // Buscar reservas activas para el item
        const reservationsResult = await this.searchReservations({
          itemId,
          // Solo considerar reservas que no están canceladas
        });

        if (!reservationsResult.success || !reservationsResult.data) {
          return handleApiError<{
            available: boolean;
            conflicts: ReservationConflict[];
          }>(new Error('Error al verificar disponibilidad'));
        }

        const activeReservations = reservationsResult.data.documents.filter(
          (reservation) => {
            // Excluir la reserva especificada si se proporciona
            if (
              excludeReservationId &&
              reservation.$id === excludeReservationId
            ) {
              return false;
            }
            // Solo considerar reservas que no están canceladas
            return reservation.status !== 'cancelled';
          }
        );

        const conflicts: ReservationConflict[] = [];
        const requestStart = new Date(startDate);
        const requestEnd = new Date(endDate);

        for (const reservation of activeReservations) {
          const reservationStart = new Date(reservation.startDate);
          const reservationEnd = new Date(reservation.endDate);

          // Verificar solapamiento
          if (requestStart < reservationEnd && requestEnd > reservationStart) {
            const overlapStart = new Date(
              Math.max(requestStart.getTime(), reservationStart.getTime())
            );
            const overlapEnd = new Date(
              Math.min(requestEnd.getTime(), reservationEnd.getTime())
            );
            const overlapDays = Math.ceil(
              (overlapEnd.getTime() - overlapStart.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            conflicts.push({
              conflictingReservation: reservation,
              overlapStart: overlapStart.toISOString(),
              overlapEnd: overlapEnd.toISOString(),
              overlapDays,
            });
          }
        }

        return handleApiSuccess({
          available: conflicts.length === 0,
          conflicts,
        });
      });
    } catch (error) {
      return handleApiError<{
        available: boolean;
        conflicts: ReservationConflict[];
      }>(error);
    }
  }

  // Obtener reservas por usuario
  static async getUserReservations(
    userId: string,
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: Reservation[]; total: number }>> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return handleApiError<{ documents: Reservation[]; total: number }>(
        new Error('ID de usuario requerido')
      );
    }

    return await this.searchReservations({ userId }, options);
  }

  // Obtener reservas por item
  static async getItemReservations(
    itemId: string,
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: Reservation[]; total: number }>> {
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      return handleApiError<{ documents: Reservation[]; total: number }>(
        new Error('ID de item requerido')
      );
    }

    return await this.searchReservations({ itemId }, options);
  }

  // Obtener historial de una reserva
  static async getReservationHistory(
    reservationId: string
  ): Promise<ApiResponse<ReservationStatusHistory[]>> {
    if (
      !reservationId ||
      typeof reservationId !== 'string' ||
      reservationId.trim() === ''
    ) {
      return handleApiError<ReservationStatusHistory[]>(
        new Error('ID de reserva requerido')
      );
    }

    try {
      return await withRetry(async () => {
        const result = await DatabaseService.query<ReservationStatusHistory>(
          'reservationHistory', // Colección separada para el historial
          {
            filters: [`reservationId==${reservationId}`],
            orderBy: 'changedAt',
            orderType: 'ASC',
          }
        );

        if (!result.success || !result.data) {
          return handleApiError<ReservationStatusHistory[]>(
            new Error('Error al obtener historial')
          );
        }

        return handleApiSuccess(result.data.documents);
      });
    } catch (error) {
      return handleApiError<ReservationStatusHistory[]>(error);
    }
  }

  // Métodos privados de utilidad

  // Validar datos de reserva
  private static validateReservationData(data: CreateReservationData): {
    isValid: boolean;
    error?: string;
  } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Datos de reserva requeridos' };
    }

    if (
      !data.itemId ||
      typeof data.itemId !== 'string' ||
      data.itemId.trim() === ''
    ) {
      return { isValid: false, error: 'ID de item requerido' };
    }

    if (
      !data.userId ||
      typeof data.userId !== 'string' ||
      data.userId.trim() === ''
    ) {
      return { isValid: false, error: 'ID de usuario requerido' };
    }

    if (!data.startDate || typeof data.startDate !== 'string') {
      return { isValid: false, error: 'Fecha de inicio requerida' };
    }

    if (!data.endDate || typeof data.endDate !== 'string') {
      return { isValid: false, error: 'Fecha de fin requerida' };
    }

    if (
      data.totalAmount !== undefined &&
      (typeof data.totalAmount !== 'number' || data.totalAmount < 0)
    ) {
      return {
        isValid: false,
        error: 'Monto total debe ser un número positivo',
      };
    }

    return { isValid: true };
  }

  // Validar fechas
  private static validateDates(
    startDate: string,
    endDate: string
  ): {
    isValid: boolean;
    error?: string;
  } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime())) {
      return { isValid: false, error: 'Fecha de inicio inválida' };
    }

    if (isNaN(end.getTime())) {
      return { isValid: false, error: 'Fecha de fin inválida' };
    }

    if (start >= end) {
      return {
        isValid: false,
        error: 'La fecha de inicio debe ser anterior a la fecha de fin',
      };
    }

    if (start < now) {
      return {
        isValid: false,
        error: 'La fecha de inicio no puede ser en el pasado',
      };
    }

    return { isValid: true };
  }

  // Agregar entrada al historial de estados
  private static async addStatusHistory(
    reservationId: string,
    fromStatus: Reservation['status'] | null,
    toStatus: Reservation['status'],
    reason?: string,
    changedBy?: string
  ): Promise<void> {
    try {
      const historyEntry: Omit<
        ReservationStatusHistory,
        '$id' | 'createdAt' | 'updatedAt'
      > = {
        reservationId,
        fromStatus,
        toStatus,
        changedAt: new Date().toISOString(),
        changedBy,
        reason,
        metadata: {},
      };

      await DatabaseService.create<ReservationStatusHistory>(
        'reservationHistory',
        historyEntry
      );
    } catch (error) {
      // No fallar la operación principal si no se puede guardar el historial
      console.warn('Error al guardar historial de reserva:', error);
    }
  }
}

// Funciones de conveniencia para uso directo
export const createReservation =
  ReservationsService.createReservation.bind(ReservationsService);
export const getReservation =
  ReservationsService.getReservation.bind(ReservationsService);
export const updateReservation =
  ReservationsService.updateReservation.bind(ReservationsService);
export const changeReservationStatus =
  ReservationsService.changeReservationStatus.bind(ReservationsService);
export const deleteReservation =
  ReservationsService.deleteReservation.bind(ReservationsService);
export const searchReservations =
  ReservationsService.searchReservations.bind(ReservationsService);
export const checkAvailability =
  ReservationsService.checkAvailability.bind(ReservationsService);
export const getUserReservations =
  ReservationsService.getUserReservations.bind(ReservationsService);
export const getItemReservations =
  ReservationsService.getItemReservations.bind(ReservationsService);
export const getReservationHistory =
  ReservationsService.getReservationHistory.bind(ReservationsService);
