<template>
  <nav
    :class="[
      'flex items-center justify-between',
      size === 'sm' ? 'gap-2' : size === 'lg' ? 'gap-6' : 'gap-4',
    ]"
    :aria-label="$t('search.pagination.navigation', 'Navegación de páginas')"
    role="navigation"
  >
    <!-- Items info (left side) -->
    <div
      v-if="showItemsInfo"
      :class="[
        'text-neutral-600 dark:text-neutral-400',
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm',
      ]"
      :aria-live="loading ? 'polite' : 'off'"
    >
      <template v-if="loading">
        <div class="flex items-center gap-2">
          <div
            class="animate-spinner h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"
          ></div>
          <span>{{ $t('search.pagination.loading', 'Cargando...') }}</span>
        </div>
      </template>
      <template v-else>
        {{ itemsInfoText }}
      </template>
    </div>

    <!-- Mobile pagination (simplified) -->
    <div v-if="isMobile" class="flex items-center gap-2">
      <!-- Previous button -->
      <button
        :disabled="currentPage <= 1 || loading || disabled"
        :class="[
          'flex items-center justify-center rounded-lg border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:focus:ring-offset-neutral-900',
          size === 'sm'
            ? 'h-8 w-8 text-xs'
            : size === 'lg'
              ? 'h-12 w-12 text-base'
              : 'h-10 w-10 text-sm',
          currentPage <= 1 || loading || disabled
            ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-600'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500',
        ]"
        @click="goToPreviousPage"
        :aria-label="$t('search.pagination.previousPage', 'Página anterior')"
      >
        <ChevronLeftIcon class="h-4 w-4" />
      </button>

      <!-- Page info -->
      <span
        :class="[
          'text-neutral-700 dark:text-neutral-300 font-medium',
          size === 'sm'
            ? 'text-xs px-2'
            : size === 'lg'
              ? 'text-base px-4'
              : 'text-sm px-3',
        ]"
      >
        {{ currentPage }} / {{ totalPages }}
      </span>

      <!-- Next button -->
      <button
        :disabled="currentPage >= totalPages || loading || disabled"
        :class="[
          'flex items-center justify-center rounded-lg border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:focus:ring-offset-neutral-900',
          size === 'sm'
            ? 'h-8 w-8 text-xs'
            : size === 'lg'
              ? 'h-12 w-12 text-base'
              : 'h-10 w-10 text-sm',
          currentPage >= totalPages || loading || disabled
            ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-600'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500',
        ]"
        @click="goToNextPage"
        :aria-label="$t('search.pagination.nextPage', 'Página siguiente')"
      >
        <ChevronRightIcon class="h-4 w-4" />
      </button>
    </div>

    <!-- Desktop pagination (full) -->
    <div v-else class="flex items-center gap-1">
      <!-- First page button -->
      <button
        v-if="showFirstLast && currentPage > 3"
        :disabled="loading || disabled"
        :class="pageButtonClasses(false)"
        @click="goToPage(1)"
        :aria-label="$t('search.pagination.firstPage', 'Primera página')"
      >
        1
      </button>

      <!-- First ellipsis -->
      <span
        v-if="showFirstLast && currentPage > 4"
        :class="[
          'text-neutral-500 dark:text-neutral-400',
          size === 'sm'
            ? 'px-1 text-xs'
            : size === 'lg'
              ? 'px-3 text-base'
              : 'px-2 text-sm',
        ]"
        aria-hidden="true"
      >
        ...
      </span>

      <!-- Previous button -->
      <button
        :disabled="currentPage <= 1 || loading || disabled"
        :class="[
          'flex items-center justify-center rounded-lg border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:focus:ring-offset-neutral-900',
          size === 'sm'
            ? 'h-8 w-8 text-xs'
            : size === 'lg'
              ? 'h-12 w-12 text-base'
              : 'h-10 w-10 text-sm',
          currentPage <= 1 || loading || disabled
            ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-600'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500',
        ]"
        @click="goToPreviousPage"
        :aria-label="$t('search.pagination.previousPage', 'Página anterior')"
      >
        <ChevronLeftIcon class="h-4 w-4" />
      </button>

      <!-- Page numbers -->
      <button
        v-for="page in visiblePages"
        :key="page"
        :disabled="loading || disabled"
        :class="pageButtonClasses(page === currentPage)"
        @click="goToPage(page)"
        :aria-label="
          page === currentPage
            ? $t(
                'search.pagination.currentPage',
                { page },
                `Página actual, página ${page}`
              )
            : $t('search.pagination.goToPage', { page }, `Ir a página ${page}`)
        "
        :aria-current="page === currentPage ? 'page' : undefined"
      >
        {{ page }}
      </button>

      <!-- Next button -->
      <button
        :disabled="currentPage >= totalPages || loading || disabled"
        :class="[
          'flex items-center justify-center rounded-lg border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:focus:ring-offset-neutral-900',
          size === 'sm'
            ? 'h-8 w-8 text-xs'
            : size === 'lg'
              ? 'h-12 w-12 text-base'
              : 'h-10 w-10 text-sm',
          currentPage >= totalPages || loading || disabled
            ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-600'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500',
        ]"
        @click="goToNextPage"
        :aria-label="$t('search.pagination.nextPage', 'Página siguiente')"
      >
        <ChevronRightIcon class="h-4 w-4" />
      </button>

      <!-- Last ellipsis -->
      <span
        v-if="showFirstLast && currentPage < totalPages - 3"
        :class="[
          'text-neutral-500 dark:text-neutral-400',
          size === 'sm'
            ? 'px-1 text-xs'
            : size === 'lg'
              ? 'px-3 text-base'
              : 'px-2 text-sm',
        ]"
        aria-hidden="true"
      >
        ...
      </span>

      <!-- Last page button -->
      <button
        v-if="showFirstLast && currentPage < totalPages - 2"
        :disabled="loading || disabled"
        :class="pageButtonClasses(false)"
        @click="goToPage(totalPages)"
        :aria-label="$t('search.pagination.lastPage', 'Última página')"
      >
        {{ totalPages }}
      </button>
    </div>

    <!-- Page size selector (right side) -->
    <div
      v-if="showPageSizeSelector && pageSizeOptions.length > 1"
      :class="[
        'flex items-center gap-2',
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm',
      ]"
    >
      <label
        :for="`page-size-${componentId}`"
        class="text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
      >
        {{ $t('search.pagination.itemsPerPage', 'Elementos por página:') }}
      </label>
      <select
        :id="`page-size-${componentId}`"
        :value="itemsPerPage"
        :disabled="loading || disabled"
        :class="[
          'rounded-lg border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:focus:ring-offset-neutral-900',
          size === 'sm'
            ? 'h-8 px-2 text-xs'
            : size === 'lg'
              ? 'h-12 px-4 text-base'
              : 'h-10 px-3 text-sm',
          loading || disabled
            ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-600'
            : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-500',
        ]"
        @change="handlePageSizeChange"
        :aria-label="
          $t(
            'search.pagination.selectPageSize',
            'Seleccionar elementos por página'
          )
        "
      >
        <option v-for="option in pageSizeOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import type { PaginationProps, PaginationEmits } from '../../types/pagination';

// Props
const props = withDefaults(defineProps<PaginationProps>(), {
  maxVisiblePages: 7,
  showPageSizeSelector: true,
  pageSizeOptions: () => [10, 20, 50, 100],
  loading: false,
  disabled: false,
  size: 'md',
  showItemsInfo: true,
  showFirstLast: true,
});

// Emits
const emit = defineEmits<PaginationEmits>();

// Unique component ID for accessibility
const componentId = ref(
  `pagination-${Math.random().toString(36).substr(2, 9)}`
);

// Responsive state
const isMobile = ref(false);

// Check if mobile on mount and resize
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768; // md breakpoint
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// Computed properties
const totalPages = computed(() =>
  Math.ceil(props.totalItems / props.itemsPerPage)
);

const itemsInfoText = computed(() => {
  const start = (props.currentPage - 1) * props.itemsPerPage + 1;
  const end = Math.min(
    props.currentPage * props.itemsPerPage,
    props.totalItems
  );

  if (props.totalItems === 0) {
    return 'No hay elementos';
  }

  return `${start}-${end} de ${props.totalItems} elementos`;
});

const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = Math.min(props.maxVisiblePages, totalPages.value);

  if (totalPages.value <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Calculate range around current page
    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(1, props.currentPage - halfVisible);
    let end = Math.min(totalPages.value, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
});

// Methods
const goToPage = (page: number) => {
  if (
    page >= 1 &&
    page <= totalPages.value &&
    page !== props.currentPage &&
    !props.loading &&
    !props.disabled
  ) {
    emit('page-change', page);
  }
};

const goToPreviousPage = () => {
  if (props.currentPage > 1) {
    goToPage(props.currentPage - 1);
  }
};

const goToNextPage = () => {
  if (props.currentPage < totalPages.value) {
    goToPage(props.currentPage + 1);
  }
};

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newSize = parseInt(target.value, 10);
  if (newSize !== props.itemsPerPage && !props.loading && !props.disabled) {
    emit('page-size-change', newSize);
  }
};

// Page button classes
const pageButtonClasses = (isActive: boolean) => [
  'flex items-center justify-center rounded-lg border transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  'dark:focus:ring-offset-neutral-900',
  props.size === 'sm'
    ? 'h-8 min-w-8 px-2 text-xs'
    : props.size === 'lg'
      ? 'h-12 min-w-12 px-4 text-base'
      : 'h-10 min-w-10 px-3 text-sm',
  isActive
    ? 'border-primary-500 bg-primary-500 text-white shadow-sm dark:border-primary-400 dark:bg-primary-400'
    : props.loading || props.disabled
      ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-600'
      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:border-neutral-500',
];

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (props.loading || props.disabled) return;

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      goToPreviousPage();
      break;
    case 'ArrowRight':
      event.preventDefault();
      goToNextPage();
      break;
    case 'Home':
      event.preventDefault();
      goToPage(1);
      break;
    case 'End':
      event.preventDefault();
      goToPage(totalPages.value);
      break;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* Custom spinner animation */
@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.animate-spinner {
  animation: spinner 1s linear infinite;
}

/* Ensure proper touch targets on mobile */
@media (max-width: 767px) {
  button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border-neutral-300 {
    border-color: #000;
  }

  .dark .border-neutral-600 {
    border-color: #fff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
