/**
 * Composable para manejo de paginación
 * Proporciona lógica reutilizable para paginación con manejo de estado, carga y errores
 */

import { ref, computed, watch, type Ref } from 'vue';
import type {
  UsePaginationOptions,
  UsePaginationReturn,
  PaginatedResponse,
} from '@/types/pagination';
import {
  calculateTotalPages,
  validatePageNumber,
  validatePageSize,
  debounce,
} from '@/utils/paginationHelpers';

export function usePagination<T>(
  options: UsePaginationOptions<T>
): UsePaginationReturn<T> {
  // Validar opciones
  if (!options.fetchFunction) {
    throw new Error('fetchFunction is required for usePagination');
  }

  // Estado reactivo
  const currentPage = ref(options.initialPage || 1);
  const pageSize = ref(options.initialPageSize || 20);
  const totalItems = ref(0);
  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const totalPages = computed(() =>
    calculateTotalPages(totalItems.value, pageSize.value)
  );

  // Función para cargar datos con manejo de errores
  const fetchData = async (...args: unknown[]): Promise<void> => {
    if (loading.value) return; // Prevenir múltiples llamadas simultáneas

    try {
      loading.value = true;
      error.value = null;

      // Validar página actual antes de hacer la petición
      const validPage = validatePageNumber(currentPage.value, totalPages.value);
      if (validPage !== currentPage.value) {
        currentPage.value = validPage;
        return; // El watch se encargará de hacer la nueva petición
      }

      const response: PaginatedResponse<T> = await options.fetchFunction(
        currentPage.value,
        pageSize.value,
        ...args
      );

      // Validar respuesta
      if (!response || !response.data || !response.pagination) {
        throw new Error('Invalid response format from fetchFunction');
      }

      // Actualizar estado
      items.value = response.data;
      totalItems.value = response.pagination.totalItems;

      // Validar que la página actual sigue siendo válida después de la respuesta
      const newTotalPages = calculateTotalPages(
        response.pagination.totalItems,
        pageSize.value
      );

      if (currentPage.value > newTotalPages && newTotalPages > 0) {
        currentPage.value = newTotalPages;
        return; // El watch se encargará de hacer la nueva petición
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading data';
      items.value = [];
      totalItems.value = 0;
      console.error('usePagination fetchData error:', err);
    } finally {
      loading.value = false;
    }
  };

  // Función debounced para evitar múltiples llamadas rápidas
  const debouncedFetchData = debounce(fetchData, 100);

  // Métodos públicos
  const goToPage = async (page: number): Promise<void> => {
    if (page === currentPage.value || loading.value) return;

    const validPage = validatePageNumber(page, totalPages.value || 1);
    currentPage.value = validPage;
  };

  const changePageSize = async (size: number): Promise<void> => {
    if (size === pageSize.value || loading.value) return;

    const validSize = validatePageSize(size);

    // Calcular nueva página para mantener posición relativa usando el tamaño anterior
    const currentFirstItem = (currentPage.value - 1) * pageSize.value + 1;
    const newPage = Math.ceil(currentFirstItem / validSize);

    // Actualizar valores
    pageSize.value = validSize;
    currentPage.value = Math.max(1, newPage);
  };

  const refresh = async (): Promise<void> => {
    await fetchData();
  };

  const reset = (): void => {
    currentPage.value = options.initialPage || 1;
    pageSize.value = options.initialPageSize || 20;
    totalItems.value = 0;
    items.value = [];
    error.value = null;
  };

  // Watchers para reactividad
  watch(
    [currentPage, pageSize],
    () => {
      debouncedFetchData();
    },
    { immediate: true }
  );

  // Validación adicional cuando cambia el total de páginas
  watch(totalPages, (newTotalPages) => {
    if (currentPage.value > newTotalPages && newTotalPages > 0) {
      currentPage.value = newTotalPages;
    }
  });

  return {
    // Estado reactivo
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    items,
    loading,
    error,

    // Métodos
    goToPage,
    changePageSize,
    refresh,
    reset,
  };
}

// Función helper para crear opciones de paginación con valores por defecto
export function createPaginationOptions<T>(
  fetchFunction: UsePaginationOptions<T>['fetchFunction'],
  overrides: Partial<UsePaginationOptions<T>> = {}
): UsePaginationOptions<T> {
  return {
    initialPage: 1,
    initialPageSize: 20,
    syncWithUrl: false,
    ...overrides,
    fetchFunction,
  };
}
