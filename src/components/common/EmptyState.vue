<template>
  <div class="text-center py-12" :class="containerClass">
    <div
      class="mx-auto flex items-center justify-center"
      :class="iconContainerClass"
    >
      <component
        :is="iconComponent"
        class="text-gray-400 dark:text-gray-500"
        :class="iconClass"
      />
    </div>
    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
      {{ title }}
    </h3>
    <p class="mt-2 text-gray-600 dark:text-gray-300 max-w-md mx-auto">
      {{ description }}
    </p>
    <div v-if="$slots.actions || actionText" class="mt-6">
      <slot name="actions">
        <button
          v-if="actionText"
          @click="$emit('action')"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
        >
          <component v-if="actionIcon" :is="actionIcon" class="mr-2 h-4 w-4" />
          {{ actionText }}
        </button>
      </slot>
    </div>
    <div v-if="$slots.secondary" class="mt-4">
      <slot name="secondary"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  PhotoIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  BookOpenIcon,
  HeartIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';
import type { EmptyStatePropsModel, EmptyStateEmitsModel } from '@/types';

interface Props extends EmptyStatePropsModel {}

interface Emits extends EmptyStateEmitsModel {}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'md',
});

defineEmits<Emits>();

const iconComponent = computed(() => {
  if (props.icon) return props.icon;

  const typeIcons = {
    default: InboxIcon,
    search: MagnifyingGlassIcon,
    error: ExclamationTriangleIcon,
    empty: InboxIcon,
    loading: ClockIcon,
    'no-results': MagnifyingGlassIcon,
    'no-items': PhotoIcon,
    'no-favorites': HeartIcon,
    'no-reservations': BookOpenIcon,
  };

  return typeIcons[props.type] || InboxIcon;
});

const defaultTitles = {
  default: 'No data available',
  search: 'No results found',
  error: 'Something went wrong',
  empty: 'Nothing here yet',
  loading: 'Loading...',
  'no-results': 'No search results',
  'no-items': 'No items found',
  'no-favorites': 'No favorites yet',
  'no-reservations': 'No reservations',
};

const defaultDescriptions = {
  default: 'There is no data to display at the moment.',
  search: 'Try adjusting your search terms or filters.',
  error: 'We encountered an error while loading the data. Please try again.',
  empty: 'This section will populate once data is available.',
  loading: 'Please wait while we load your data.',
  'no-results': "We couldn't find anything matching your search criteria.",
  'no-items': 'No items match your current filters. Try adjusting your search.',
  'no-favorites': 'Items you favorite will appear here for quick access.',
  'no-reservations': 'Your reservations and borrowed items will appear here.',
};

const title = computed(() => {
  return props.title || defaultTitles[props.type];
});

const description = computed(() => {
  return props.description || defaultDescriptions[props.type];
});

const containerClass = computed(() => {
  const sizes = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  };
  return sizes[props.size];
});

const iconContainerClass = computed(() => {
  const sizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };
  return sizes[props.size];
});

const iconClass = computed(() => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };
  return sizes[props.size];
});
</script>
