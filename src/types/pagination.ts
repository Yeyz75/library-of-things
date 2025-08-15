/**
 * Tipos y interfaces para el sistema de paginación
 */

import type { Ref, ComputedRef } from 'vue';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  loading: boolean;
  error: string | null;
}

export interface PaginationConfig {
  defaultPageSize: number;
  pageSizeOptions: number[];
  maxVisiblePages: number;
  showPageSizeSelector: boolean;
  syncWithUrl: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  maxVisiblePages?: number;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showItemsInfo?: boolean;
  showFirstLast?: boolean;
}

export interface PaginationEmits {
  'page-change': [page: number];
  'page-size-change': [pageSize: number];
}

export interface UsePaginationOptions<T> {
  initialPage?: number;
  initialPageSize?: number;
  fetchFunction: (
    page: number,
    pageSize: number,
    ...args: unknown[]
  ) => Promise<PaginatedResponse<T>>;
  syncWithUrl?: boolean;
  urlParamPrefix?: string;
}

export interface UsePaginationReturn<T> {
  // Estado reactivo
  currentPage: Ref<number>;
  pageSize: Ref<number>;
  totalItems: Ref<number>;
  totalPages: ComputedRef<number>;
  items: Ref<T[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;

  // Métodos
  goToPage: (page: number) => Promise<void>;
  changePageSize: (size: number) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export interface PaginationErrorProps {
  error: string;
  retryable?: boolean;
  onRetry?: () => void;
}

// Tipos para parámetros URL
export interface UrlPaginationParams {
  page?: string;
  pageSize?: string;
  [key: string]: string | undefined;
}

// Tipos para useUrlPagination
export interface UseUrlPaginationOptions {
  prefix?: string;
  defaultPage?: number;
  defaultPageSize?: number;
  allowedPageSizes?: number[];
  debounceDelay?: number;
  preserveQuery?: boolean;
}

export interface UseUrlPaginationReturn {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
  goToPage: (page: number) => Promise<void>;
  changePageSize: (size: number) => Promise<void>;
  updatePagination: (page: number, size?: number) => Promise<void>;
  reset: () => Promise<void>;
  getUrlParams: () => Record<string, string>;
}

// Configuración por defecto
export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  maxVisiblePages: 7,
  showPageSizeSelector: true,
  syncWithUrl: true,
};
