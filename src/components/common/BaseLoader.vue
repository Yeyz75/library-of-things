<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div class="animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" :class="sizeClass"></div>
    <span v-if="text" class="ml-3 text-gray-600" :class="textClass">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  center?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  center: false,
});

const sizeClass = computed(() => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  return sizes[props.size];
});

const textClass = computed(() => {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  return textSizes[props.size];
});

const containerClass = computed(() => {
  return props.center ? 'min-h-[200px]' : '';
});
</script>