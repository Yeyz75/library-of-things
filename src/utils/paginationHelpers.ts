/**
 * Utilidades para cálculos de paginación
 */

import type {
  PaginatedResponse,
  UrlPaginationParams,
} from '@/types/pagination';

/**
 * Calcula el número total de páginas basado en el total de elementos y elementos por página
 */
export function calculateTotalPages(
  totalItems: number,
  itemsPerPage: number
): number {
  if (totalItems <= 0 || itemsPerPage <= 0) return 0;
  return Math.ceil(totalItems / itemsPerPage);
}

/**
 * Valida que el número de página esté dentro del rango válido
 */
export function validatePageNumber(page: number, totalPages: number): number {
  if (page < 1) return 1;
  if (page > totalPages && totalPages > 0) return totalPages;
  return page;
}

/**
 * Calcula el rango de elementos visibles en la página actual
 */
export function calculateItemRange(
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
): {
  start: number;
  end: number;
  showing: number;
} {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  const showing = Math.max(0, end - start + 1);

  return { start, end, showing };
}

/**
 * Genera un array de números de página para mostrar en la paginación
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number = 7
): number[] {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisiblePages - 1);

  // Ajustar el inicio si estamos cerca del final
  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Verifica si hay página siguiente
 */
export function hasNextPage(currentPage: number, totalPages: number): boolean {
  return currentPage < totalPages;
}

/**
 * Verifica si hay página anterior
 */
export function hasPreviousPage(currentPage: number): boolean {
  return currentPage > 1;
}

/**
 * Calcula el offset para consultas de base de datos
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Crea una respuesta paginada estándar
 */
export function createPaginatedResponse<T>(
  data: T[],
  currentPage: number,
  pageSize: number,
  totalItems: number
): PaginatedResponse<T> {
  const totalPages = calculateTotalPages(totalItems, pageSize);

  return {
    data,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: pageSize,
      hasNextPage: hasNextPage(currentPage, totalPages),
      hasPreviousPage: hasPreviousPage(currentPage),
    },
  };
}

/**
 * Parsea parámetros de URL para paginación
 */
export function parseUrlPaginationParams(
  params: UrlPaginationParams,
  prefix?: string
): { page: number; pageSize: number } {
  const pageKey = prefix ? `${prefix}_page` : 'page';
  const pageSizeKey = prefix ? `${prefix}_pageSize` : 'pageSize';

  const page = parseInt(params[pageKey] || '1', 10);
  const pageSize = parseInt(params[pageSizeKey] || '20', 10);

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: isNaN(pageSize) || pageSize < 1 ? 20 : pageSize,
  };
}

/**
 * Genera parámetros de URL para paginación
 */
export function generateUrlPaginationParams(
  page: number,
  pageSize: number,
  prefix?: string
): Record<string, string> {
  const pageKey = prefix ? `${prefix}_page` : 'page';
  const pageSizeKey = prefix ? `${prefix}_pageSize` : 'pageSize';

  const params: Record<string, string> = {};

  if (page > 1) {
    params[pageKey] = page.toString();
  }

  if (pageSize !== 20) {
    // Solo incluir si no es el valor por defecto
    params[pageSizeKey] = pageSize.toString();
  }

  return params;
}

/**
 * Valida el tamaño de página contra opciones permitidas
 */
export function validatePageSize(
  pageSize: number,
  allowedSizes: number[] = [10, 20, 50, 100]
): number {
  if (allowedSizes.includes(pageSize)) {
    return pageSize;
  }
  return allowedSizes[0] || 20;
}

/**
 * Calcula la página que contiene un elemento específico
 */
export function getPageForItem(itemIndex: number, pageSize: number): number {
  return Math.floor(itemIndex / pageSize) + 1;
}

/**
 * Debounce function para evitar múltiples llamadas rápidas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  // Reemplazo de NodeJS.Timeout por un tipo compatible con DOM y Node:
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
