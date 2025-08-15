<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-lg"
    aria-label="Pagination"
  >
    <!-- Mobile View (optimized) -->
    <div
      ref="mobileRoot"
      class="flex flex-1 items-center justify-between sm:hidden"
      role="navigation"
      aria-label="Mobile pagination navigation"
    >
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage <= 1 || props.loading || props.disabled"
        :aria-disabled="currentPage <= 1 || props.loading || props.disabled"
        class="touch-target relative inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        aria-label="Previous page"
      >
        <ChevronLeftIcon class="h-6 w-6" aria-hidden="true" />
      </button>

      <div class="flex-1 text-center px-3">
        <div class="text-sm text-gray-700 dark:text-gray-300">Page</div>
        <div class="text-base font-semibold text-gray-900 dark:text-gray-100">
          {{ currentPage }} / {{ totalPages }}
        </div>
      </div>

      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= totalPages || props.loading || props.disabled"
        :aria-disabled="
          currentPage >= totalPages || props.loading || props.disabled
        "
        class="touch-target relative inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        aria-label="Next page"
      >
        <ChevronRightIcon class="h-6 w-6" aria-hidden="true" />
      </button>
    </div>

    <!-- Desktop View -->
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Showing
          <span class="font-medium">{{ startItem }}</span>
          to
          <span class="font-medium">{{ endItem }}</span>
          of
          <span class="font-medium">{{ total }}</span>
          results
        </p>
      </div>
      <div>
        <nav
          class="isolate inline-flex -space-x-px rounded-md shadow-sm"
          aria-label="Pagination"
        >
          <!-- Previous Button -->
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1 || props.loading || props.disabled"
            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
          </button>

          <!-- Page Numbers -->
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="typeof page === 'number'"
              @click="goToPage(page)"
              :class="[
                page === currentPage
                  ? 'relative z-10 inline-flex items-center bg-primary-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                  : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 transition-colors duration-200',
              ]"
              :disabled="props.loading || props.disabled"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-offset-0"
            >
              ...
            </span>
          </template>

          <!-- Next Button -->
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="
              currentPage >= totalPages || props.loading || props.disabled
            "
            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>

    <!-- Page Size Selector -->
    <div v-if="showPageSize" class="hidden sm:flex sm:items-center sm:ml-6">
      <label class="text-sm text-gray-700 dark:text-gray-300 mr-2">
        Show:
      </label>
      <select
        :value="pageSize"
        @change="changePageSize"
        :disabled="props.loading || props.disabled"
        class="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import type {
  BasePaginationPropsModel,
  BasePaginationEmitsModel,
} from '@/types/models';

interface Props extends BasePaginationPropsModel {}

interface Emits extends BasePaginationEmitsModel {}

interface LocalProps {
  enableSwipe?: boolean;
  swipeThreshold?: number;
  emitOrientation?: boolean;
}

const props = withDefaults(defineProps<Props & LocalProps>(), {
  showPageSize: true,
  pageSizeOptions: () => [10, 20, 50, 100],
  maxVisiblePages: 7,
  enableSwipe: true,
  swipeThreshold: 50,
  emitOrientation: true,
});

const emit = defineEmits<Emits>();

const mobileRoot = ref<HTMLElement | null>(null);

const startItem = computed(() => {
  return (props.currentPage - 1) * props.pageSize + 1;
});

const endItem = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.total);
});

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const { currentPage, totalPages, maxVisiblePages } = props;

  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    // Calculate start and end of middle section
    let start = Math.max(
      2,
      currentPage - Math.floor((maxVisiblePages - 4) / 2)
    );
    let end = Math.min(
      totalPages - 1,
      currentPage + Math.floor((maxVisiblePages - 4) / 2)
    );

    // Adjust if we're near the beginning
    if (start === 2 && end < totalPages - 1) {
      end = Math.min(totalPages - 1, start + maxVisiblePages - 4);
    }

    // Adjust if we're near the end
    if (end === totalPages - 1 && start > 2) {
      start = Math.max(2, end - maxVisiblePages + 4);
    }

    // Add ellipsis before middle section if needed
    if (start > 2) {
      pages.push('...');
    }

    // Add middle section
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis after middle section if needed
    if (end < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }

  return pages;
});

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page);
  }
}

// --- Mobile touch / orientation support ---
let touchStartX = 0;
let touchCurrentX = 0;
// use prop default if provided
const swipeThreshold = computed(() => props.swipeThreshold ?? 50);

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0]?.clientX ?? 0;
}

function onTouchMove(e: TouchEvent) {
  touchCurrentX = e.touches[0]?.clientX ?? 0;
}

function onTouchEnd() {
  const delta = touchCurrentX - touchStartX;
  if (props.enableSwipe && Math.abs(delta) > swipeThreshold.value) {
    if (delta < 0) {
      // swipe left -> next page
      goToPage(props.currentPage + 1);
    } else {
      // swipe right -> prev page
      goToPage(props.currentPage - 1);
    }
  }
  touchStartX = 0;
  touchCurrentX = 0;
}

function onOrientationChange() {
  // emit a small event so parent can react if needed
  const win = window as Window & {
    screen?: { orientation?: { type?: string } };
  };

  const orientationType =
    win.screen?.orientation?.type ??
    (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');

  if (props.emitOrientation) {
    emit('orientation-change', {
      orientation: orientationType,
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }
}

onMounted(() => {
  if (mobileRoot.value && props.enableSwipe) {
    mobileRoot.value.addEventListener('touchstart', onTouchStart, {
      passive: true,
    });
    mobileRoot.value.addEventListener('touchmove', onTouchMove, {
      passive: true,
    });
    mobileRoot.value.addEventListener('touchend', onTouchEnd);
  }
  if (props.emitOrientation) {
    window.addEventListener('orientationchange', onOrientationChange);
  }
});

onBeforeUnmount(() => {
  if (mobileRoot.value && props.enableSwipe) {
    mobileRoot.value.removeEventListener('touchstart', onTouchStart);
    mobileRoot.value.removeEventListener('touchmove', onTouchMove);
    mobileRoot.value.removeEventListener('touchend', onTouchEnd);
  }
  if (props.emitOrientation) {
    window.removeEventListener('orientationchange', onOrientationChange);
  }
});

function changePageSize(event: Event) {
  const target = event.target as HTMLSelectElement;
  const newPageSize = parseInt(target.value);
  emit('page-size-change', newPageSize);
}
</script>
