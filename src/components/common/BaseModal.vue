<template>
  <teleport to="body">
    <transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-colors duration-300"
        ></div>

        <!-- Modal Content -->
        <transition
          enter-active-class="duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            v-if="isOpen"
            ref="modalContent"
            role="dialog"
            :aria-label="ariaLabel"
            aria-modal="true"
            tabindex="-1"
            class="relative z-50 w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-colors duration-300 overflow-auto max-h-[95vh] sm:rounded-lg"
            :class="sizeClass"
            v-bind="attrs"
          >
            <!-- Header -->
            <div
              v-if="title || $slots.header || closable"
              class="relative border-b border-gray-200 dark:border-gray-700"
            >
              <div v-if="title || $slots.header" class="p-6">
                <slot name="header">
                  <h3
                    class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {{ title }}
                  </h3>
                </slot>
              </div>

              <!-- Close button positioned absolutely to avoid empty header space -->
              <button
                v-if="closable"
                @click="handleClose"
                aria-label="Close"
                class="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-gray-600 dark:focus:text-gray-300 transition ease-in-out duration-150 p-1 rounded-md"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-6 text-gray-900 dark:text-gray-100">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 space-x-3 bg-gray-50 dark:bg-gray-750 rounded-b-lg"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  nextTick,
  useAttrs,
} from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import type { BaseModalPropsModel, BaseModalEmitsModel } from '@/types/models';

interface Props extends BaseModalPropsModel {}

interface Emits extends BaseModalEmitsModel {}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnBackdrop: true,
});

const emit = defineEmits<Emits>();

const sizeClass = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  return sizes[props.size];
});

function handleClose() {
  emit('close');
}

const attrs = useAttrs();

const ariaLabel = computed(() => {
  const a = attrs['aria-label'];
  if (props.ariaLabel) return props.ariaLabel;
  return typeof a === 'string' ? a : undefined;
});

function handleBackdropClick(event: MouseEvent) {
  if (props.closeOnBackdrop && event.target === event.currentTarget) {
    handleClose();
  }
}

// Focus management: focus first focusable inside modal on open, restore focus on close
const modalContent = ref<HTMLElement | null>(null);
let previousActiveElement: HTMLElement | null = null;

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      previousActiveElement = document.activeElement as HTMLElement | null;
      await nextTick();
      const el = modalContent.value;
      if (el) {
        const focusable = el.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) focusable.focus();
        else el.focus();
      }
    } else {
      if (previousActiveElement) previousActiveElement.focus();
      previousActiveElement = null;
    }
  }
);

// Close modal on escape key
onMounted(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.isOpen) {
      handleClose();
    }
  };

  document.addEventListener('keydown', handleEscape);

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape);
  });
});
</script>
