<template>
  <div :class="containerClasses" :style="style" :data-testid="testId">
    <!-- Global header slot -->
    <div v-if="$slots.header" class="description-list__header mb-4">
      <slot name="header" :items="items" />
    </div>

    <div v-for="(item, index) in items" :key="item.key" :class="itemClasses">
      <!-- Label section -->
      <dt :class="labelClasses">
        <Icon
          v-if="item.icon"
          :name="item.icon"
          :size="iconSize"
          class="mr-2 flex-shrink-0"
        />
        {{ item.label }}
      </dt>

      <!-- Value section -->
      <dd :class="valueClasses">
        <!-- Custom slot for specific item -->
        <slot :name="`value-${item.key}`" :item="item" :index="index"></slot>
        <!-- Default slot for item -->
        <slot name="item-value" :item="item" :index="index">
          <div class="flex items-center flex-wrap gap-2">
            <!-- Badge rendering -->
            <span v-if="item.badge" :class="badgeClasses(item.badge)">
              {{ item.badge.text }}
            </span>

            <!-- Icon in value (separate from label icon) -->
            <Icon
              v-if="item.valueIcon"
              :name="item.valueIcon"
              :size="iconSize"
              class="flex-shrink-0"
            />

            <!-- Value content -->
            <span
              v-if="
                typeof item.value === 'string' || typeof item.value === 'number'
              "
              class="flex-1"
            >
              {{ item.value }}
            </span>
            <component v-else-if="item.value" :is="item.value" class="flex-1" />

            <!-- Additional content slot -->
            <slot :name="`${item.key}-extra`" :item="item" :index="index" />
          </div>
        </slot>
      </dd>

      <!-- Divider -->
      <div v-if="divider && index < items.length - 1" :class="dividerClasses">
        <hr
          v-if="props.dividerStyle === 'line'"
          class="border-gray-200 dark:border-gray-700"
        />
        <div
          v-else-if="props.dividerStyle === 'dot'"
          class="flex justify-center"
        >
          <div class="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
        </div>
        <!-- Space divider is just the container with padding -->
      </div>
    </div>

    <!-- Global footer slot -->
    <div v-if="$slots.footer" class="description-list__footer mt-4">
      <slot name="footer" :items="items" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BadgeConfig, DescriptionListProps } from '@/types/components';

// Import components
import Icon from '@/components/common/Icon.vue';

// Props with defaults
const props = withDefaults(defineProps<DescriptionListProps>(), {
  orientation: 'vertical',
  size: 'md',
  divider: false,
  dividerStyle: 'line',
  class: '',
  style: '',
  testId: 'description-list',
});

// Container classes based on orientation and size
const containerClasses = computed(() => [
  'description-list',
  `description-list--${props.orientation}`,
  `description-list--${props.size}`,
  props.class,
]);

// Item classes for each description item
const itemClasses = computed(() => [
  'description-list__item',
  {
    'grid grid-cols-1 gap-1': props.orientation === 'vertical',
    'grid grid-cols-3 gap-4 items-start': props.orientation === 'horizontal',
    'sm:grid-cols-1 sm:gap-1': props.orientation === 'horizontal', // Responsive fallback
  },
]);

// Label (dt) classes
const labelClasses = computed(() => [
  'description-list__label',
  'font-medium text-gray-900 dark:text-gray-100',
  'flex items-center',
  {
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg',
    'col-span-1': props.orientation === 'horizontal',
    'mb-1': props.orientation === 'vertical',
  },
]);

// Value (dd) classes
const valueClasses = computed(() => [
  'description-list__value',
  'text-gray-700 dark:text-gray-300',
  'flex items-center flex-wrap',
  {
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg',
    'col-span-2': props.orientation === 'horizontal',
    'mb-4': props.orientation === 'vertical',
  },
]);

// Divider classes
const dividerClasses = computed(() => [
  'description-list__divider',
  'col-span-full',
  {
    'my-2': props.size === 'sm',
    'my-3': props.size === 'md',
    'my-4': props.size === 'lg',
  },
]);

// Icon size based on component size
const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'sm';
    case 'lg':
      return 'lg';
    default:
      return 'md';
  }
});

// Badge classes function
const badgeClasses = (badge: BadgeConfig) => [
  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
  {
    'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200':
      badge.variant === 'primary',
    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200':
      badge.variant === 'secondary',
    'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200':
      badge.variant === 'success',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200':
      badge.variant === 'warning',
    'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200':
      badge.variant === 'danger',
  },
];
</script>

<style scoped>
.description-list {
  @apply w-full;
}

.description-list--vertical
  .description-list__item:last-child
  .description-list__value {
  @apply mb-0;
}

/* Responsive behavior for horizontal layout */
@media (max-width: 640px) {
  .description-list--horizontal .description-list__item {
    @apply grid-cols-1 gap-1;
  }

  .description-list--horizontal .description-list__label {
    @apply col-span-1 mb-1;
  }

  .description-list--horizontal .description-list__value {
    @apply col-span-1 mb-4;
  }
}
</style>
