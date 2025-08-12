<template>
  <component :is="iconComponent" v-if="iconComponent" :class="iconClasses" />
  <i v-else-if="isPrimeIcon" :class="primeIconClasses" />
  <span v-else :class="iconClasses">
    {{ name }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}

const props = withDefaults(defineProps<IconProps>(), {
  size: 'md',
  class: '',
});

// Check if it's a PrimeIcon
const isPrimeIcon = computed(() => props.name.startsWith('pi-'));

// Try to resolve Heroicon component
const iconComponent = computed(() => {
  if (isPrimeIcon.value) return null;
  const icon = props.name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return icon.charAt(0).toUpperCase() + icon.slice(1) + 'Icon';
});

// Base icon classes
const iconClasses = computed(() => [
  'inline-block',
  {
    'w-4 h-4': props.size === 'sm',
    'w-5 h-5': props.size === 'md',
    'w-6 h-6': props.size === 'lg',
    'w-8 h-8': props.size === 'xl',
  },
  props.class,
]);

// PrimeIcon classes
const primeIconClasses = computed(() => [
  'pi',
  props.name,
  {
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg',
    'text-xl': props.size === 'xl',
  },
  props.class,
]);
</script>
