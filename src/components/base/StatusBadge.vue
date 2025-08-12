<template>
  <span :class="badgeClasses" :data-testid="testId">
    <Icon
      v-if="showIcon && statusIcon"
      :name="statusIcon"
      :size="iconSize"
      class="mr-1"
    />
    <span v-if="showDot" :class="dotClasses" />
    <slot>{{ statusText }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StatusBadgeProps } from '@/types/components';
import Icon from '@/components/common/Icon.vue';

const props = withDefaults(defineProps<StatusBadgeProps>(), {
  size: 'md',
  variant: 'solid',
  showIcon: false,
  showDot: true,
  testId: 'status-badge',
});

// Status configuration
const statusConfig = {
  available: {
    text: 'Disponible',
    icon: 'pi-check-circle',
    color: 'success',
  },
  borrowed: {
    text: 'Prestado',
    icon: 'pi-clock',
    color: 'warning',
  },
  reserved: {
    text: 'Reservado',
    icon: 'pi-bookmark',
    color: 'primary',
  },
  maintenance: {
    text: 'Mantenimiento',
    icon: 'pi-wrench',
    color: 'danger',
  },
  inactive: {
    text: 'Inactivo',
    icon: 'pi-times-circle',
    color: 'secondary',
  },
};

const currentStatus = computed(
  () => statusConfig[props.status] || statusConfig.available
);
const statusText = computed(() => currentStatus.value.text);
const statusIcon = computed(() => currentStatus.value.icon);
const statusColor = computed(() => currentStatus.value.color);

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'sm';
    case 'lg':
      return 'md';
    default:
      return 'sm';
  }
});

const badgeClasses = computed(() => [
  'inline-flex items-center font-medium rounded-full',
  // Size classes
  {
    'px-2 py-1 text-xs': props.size === 'sm',
    'px-2.5 py-1.5 text-sm': props.size === 'md',
    'px-3 py-2 text-base': props.size === 'lg',
  },
  // Variant and color classes
  {
    // Solid variant
    'text-white': props.variant === 'solid',
    'bg-green-500':
      props.variant === 'solid' && statusColor.value === 'success',
    'bg-yellow-500':
      props.variant === 'solid' && statusColor.value === 'warning',
    'bg-blue-500': props.variant === 'solid' && statusColor.value === 'primary',
    'bg-red-500': props.variant === 'solid' && statusColor.value === 'danger',
    'bg-gray-500':
      props.variant === 'solid' && statusColor.value === 'secondary',

    // Outline variant
    'bg-transparent border': props.variant === 'outline',
    'text-green-600 border-green-500':
      props.variant === 'outline' && statusColor.value === 'success',
    'text-yellow-600 border-yellow-500':
      props.variant === 'outline' && statusColor.value === 'warning',
    'text-blue-600 border-blue-500':
      props.variant === 'outline' && statusColor.value === 'primary',
    'text-red-600 border-red-500':
      props.variant === 'outline' && statusColor.value === 'danger',
    'text-gray-600 border-gray-500':
      props.variant === 'outline' && statusColor.value === 'secondary',

    // Soft variant
    'text-green-800 bg-green-100':
      props.variant === 'soft' && statusColor.value === 'success',
    'text-yellow-800 bg-yellow-100':
      props.variant === 'soft' && statusColor.value === 'warning',
    'text-blue-800 bg-blue-100':
      props.variant === 'soft' && statusColor.value === 'primary',
    'text-red-800 bg-red-100':
      props.variant === 'soft' && statusColor.value === 'danger',
    'text-gray-800 bg-gray-100':
      props.variant === 'soft' && statusColor.value === 'secondary',
  },
  // Dark mode classes
  {
    'dark:text-green-200 dark:bg-green-800':
      props.variant === 'soft' && statusColor.value === 'success',
    'dark:text-yellow-200 dark:bg-yellow-800':
      props.variant === 'soft' && statusColor.value === 'warning',
    'dark:text-blue-200 dark:bg-blue-800':
      props.variant === 'soft' && statusColor.value === 'primary',
    'dark:text-red-200 dark:bg-red-800':
      props.variant === 'soft' && statusColor.value === 'danger',
    'dark:text-gray-200 dark:bg-gray-800':
      props.variant === 'soft' && statusColor.value === 'secondary',
  },
]);

const dotClasses = computed(() => [
  'w-2 h-2 rounded-full mr-1.5 flex-shrink-0',
  {
    'bg-green-400': statusColor.value === 'success',
    'bg-yellow-400': statusColor.value === 'warning',
    'bg-blue-400': statusColor.value === 'primary',
    'bg-red-400': statusColor.value === 'danger',
    'bg-gray-400': statusColor.value === 'secondary',
  },
]);
</script>
