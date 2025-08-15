/**
 * Composable para sincronización de paginación con URL
 * Proporciona manejo bidireccional de query parameters y navegación del navegador
 */

import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue';
import { useRouter, useRoute, type LocationQueryValue } from 'vue-router';
import {
  parseUrlPaginationParams,
  generateUrlPaginationParams,
  validatePageNumber,
  validatePageSize,
  debounce,
} from '@/utils/paginationHelpers';

export interface UseUrlPaginationOptions {
  /** Prefijo para los parámetros URL (útil para múltiples paginaciones en la misma página) */
  prefix?: string;
  /** Página inicial por defecto */
  defaultPage?: number;
  /** Tamaño de página inicial por defecto */
  defaultPageSize?: number;
  /** Tamaños de página permitidos */
  allowedPageSizes?: number[];
  /** Debounce delay para actualizaciones de URL (ms) */
  debounceDelay?: number;
  /** Si debe preservar otros query parameters existentes */
  preserveQuery?: boolean;
}

export interface UseUrlPaginationReturn {
  /** Página actual sincronizada con URL */
  currentPage: Ref<number>;
  /** Tamaño de página sincronizado con URL */
  pageSize: Ref<number>;
  /** Función para ir a una página específica */
  goToPage: (page: number) => Promise<void>;
  /** Función para cambiar el tamaño de página */
  changePageSize: (size: number) => Promise<void>;
  /** Función para actualizar ambos parámetros a la vez */
  updatePagination: (page: number, size?: number) => Promise<void>;
  /** Función para resetear a valores por defecto */
  reset: () => Promise<void>;
  /** Función para obtener los parámetros actuales como objeto */
  getUrlParams: () => Record<string, string>;
}

/**
 * Composable para manejo de paginación sincronizada con URL
 */
export function useUrlPagination(
  options: UseUrlPaginationOptions = {}
): UseUrlPaginationReturn {
  const {
    prefix,
    defaultPage = 1,
    defaultPageSize = 20,
    allowedPageSizes = [10, 20, 50, 100],
    debounceDelay = 100,
    preserveQuery = true,
  } = options;

  const router = useRouter();
  const route = useRoute();

  // Estado reactivo
  const currentPage = ref(defaultPage);
  const pageSize = ref(defaultPageSize);

  // Flag para evitar loops infinitos durante la sincronización
  const isUpdatingFromUrl = ref(false);
  const isUpdatingUrl = ref(false);

  /**
   * Parsea los parámetros de URL actuales
   */
  const parseCurrentUrlParams = (): { page: number; pageSize: number } => {
    const queryParams = route.query as Record<string, LocationQueryValue>;
    const stringParams: Record<string, string> = {};

    // Convertir LocationQueryValue a string
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        stringParams[key] = value;
      } else if (Array.isArray(value)) {
        const arr = value as string[];
        if (arr.length > 0 && typeof arr[0] === 'string') {
          // Tomar el primer valor si es un array
          stringParams[key] = arr[0];
        }
      }
    });

    return parseUrlPaginationParams(stringParams, prefix);
  };

  /**
   * Actualiza la URL con los parámetros de paginación actuales
   */
  const updateUrl = async (page: number, size: number): Promise<void> => {
    if (isUpdatingFromUrl.value) return;

    try {
      isUpdatingUrl.value = true;

      // Generar nuevos parámetros de paginación
      const paginationParams = generateUrlPaginationParams(page, size, prefix);

      // Preparar query parameters
      let newQuery: Record<string, string> = {};

      if (preserveQuery) {
        // Preservar parámetros existentes
        Object.entries(route.query).forEach(([key, value]) => {
          if (typeof value === 'string') {
            newQuery[key] = value;
          } else if (Array.isArray(value)) {
            const arr = value as string[];
            if (arr.length > 0 && typeof arr[0] === 'string') {
              newQuery[key] = arr[0];
            }
          }
        });
      }

      // Remover parámetros de paginación existentes con el mismo prefijo
      const pageKey = prefix ? `${prefix}_page` : 'page';
      const pageSizeKey = prefix ? `${prefix}_pageSize` : 'pageSize';
      delete newQuery[pageKey];
      delete newQuery[pageSizeKey];

      // Añadir nuevos parámetros de paginación
      newQuery = { ...newQuery, ...paginationParams };

      // Actualizar la URL
      await router.replace({
        path: route.path,
        query: newQuery,
      });
    } catch (error) {
      console.error('Error updating URL for pagination:', error);
    } finally {
      isUpdatingUrl.value = false;
    }
  };

  // Función debounced para actualizar URL
  // Se envuelve `updateUrl` en un wrapper que acepta (...args: unknown[])
  // para evitar incompatibilidades de tipos con la firma esperada por `debounce`.
  const debouncedUpdateUrl = debounce((...args: unknown[]) => {
    const pageArg = args[0];
    const sizeArg = args[1];

    const page =
      typeof pageArg === 'number'
        ? pageArg
        : Number(pageArg ?? currentPage.value);
    const size =
      typeof sizeArg === 'number' ? sizeArg : Number(sizeArg ?? pageSize.value);

    // Llamada a la función original (devuelve Promise<void>)
    return updateUrl(page, size);
  }, debounceDelay);

  /**
   * Sincroniza el estado local con los parámetros de URL
   */
  const syncFromUrl = (): void => {
    if (isUpdatingUrl.value) return;

    try {
      isUpdatingFromUrl.value = true;

      const { page, pageSize: urlPageSize } = parseCurrentUrlParams();

      // Validar y actualizar página
      const validPage = validatePageNumber(page, Number.MAX_SAFE_INTEGER);
      if (validPage !== currentPage.value) {
        currentPage.value = validPage;
      }

      // Validar y actualizar tamaño de página
      const validPageSize = validatePageSize(urlPageSize, allowedPageSizes);
      if (validPageSize !== pageSize.value) {
        pageSize.value = validPageSize;
      }
    } catch (error) {
      console.error('Error syncing pagination from URL:', error);
    } finally {
      isUpdatingFromUrl.value = false;
    }
  };

  /**
   * Ir a una página específica
   */
  const goToPage = async (page: number): Promise<void> => {
    if (page === currentPage.value) return;

    const validPage = validatePageNumber(page, Number.MAX_SAFE_INTEGER);
    currentPage.value = validPage;
    await debouncedUpdateUrl(validPage, pageSize.value);
  };

  /**
   * Cambiar el tamaño de página
   */
  const changePageSize = async (size: number): Promise<void> => {
    if (size === pageSize.value) return;

    const validSize = validatePageSize(size, allowedPageSizes);

    // Calcular nueva página para mantener posición relativa
    const currentFirstItem = (currentPage.value - 1) * pageSize.value + 1;
    const newPage = Math.max(1, Math.ceil(currentFirstItem / validSize));

    pageSize.value = validSize;
    currentPage.value = newPage;

    await debouncedUpdateUrl(newPage, validSize);
  };

  /**
   * Actualizar ambos parámetros a la vez
   */
  const updatePagination = async (
    page: number,
    size?: number
  ): Promise<void> => {
    const validPage = validatePageNumber(page, Number.MAX_SAFE_INTEGER);
    const validSize = size
      ? validatePageSize(size, allowedPageSizes)
      : pageSize.value;

    currentPage.value = validPage;
    if (size) {
      pageSize.value = validSize;
    }

    await debouncedUpdateUrl(validPage, validSize);
  };

  /**
   * Resetear a valores por defecto
   */
  const reset = async (): Promise<void> => {
    currentPage.value = defaultPage;
    pageSize.value = defaultPageSize;
    await debouncedUpdateUrl(defaultPage, defaultPageSize);
  };

  /**
   * Obtener parámetros actuales como objeto
   */
  const getUrlParams = (): Record<string, string> => {
    return generateUrlPaginationParams(
      currentPage.value,
      pageSize.value,
      prefix
    );
  };

  // Watcher para cambios en la ruta (navegación del navegador)
  const stopWatchingRoute = watch(
    () => route.query,
    () => {
      syncFromUrl();
    },
    { deep: true }
  );

  // Inicialización
  onMounted(() => {
    // Sincronizar estado inicial desde URL
    syncFromUrl();
  });

  // Limpieza
  onUnmounted(() => {
    stopWatchingRoute();
  });

  // Sincronización inicial inmediata para casos donde no hay componente activo (tests)
  syncFromUrl();

  return {
    currentPage,
    pageSize,
    goToPage,
    changePageSize,
    updatePagination,
    reset,
    getUrlParams,
  };
}

/**
 * Función helper para crear múltiples instancias de paginación URL con prefijos únicos
 */
export function createMultipleUrlPagination(
  configs: Array<{ prefix: string } & UseUrlPaginationOptions>
): Record<string, UseUrlPaginationReturn> {
  const instances: Record<string, UseUrlPaginationReturn> = {};

  configs.forEach(({ prefix, ...options }) => {
    if (!prefix) {
      throw new Error(
        'Prefix is required for multiple URL pagination instances'
      );
    }
    instances[prefix] = useUrlPagination({ prefix, ...options });
  });

  return instances;
}

/**
 * Función helper para limpiar parámetros de paginación de la URL
 */
export async function clearPaginationFromUrl(prefix?: string): Promise<void> {
  const router = useRouter();
  const route = useRoute();

  const pageKey = prefix ? `${prefix}_page` : 'page';
  const pageSizeKey = prefix ? `${prefix}_pageSize` : 'pageSize';

  const newQuery = { ...route.query };
  delete newQuery[pageKey];
  delete newQuery[pageSizeKey];

  await router.replace({
    path: route.path,
    query: newQuery,
  });

  // asegurar retorno void
  return;
}
