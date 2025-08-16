<template>
  <teleport to="body">
    <transition-group
      name="toast"
      tag="div"
      class="fixed top-4 right-4 z-50 space-y-2 max-w-full"
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="w-full bg-white dark:bg-[#0f1720] shadow-lg rounded-lg pointer-events-auto overflow-hidden relative max-w-[calc(100vw-2rem)] sm:max-w-sm"
        :class="[getToastClasses(toast.type), 'ring-2 ring-opacity-100']"
      >
        <div class="px-4 py-2">
          <div class="flex flex-row items-center gap-3 w-full">
            <div class="flex-shrink-0">
              <component
                :is="getIcon(toast.type)"
                class="h-6 w-6"
                :class="getIconClasses(toast.type)"
              />
            </div>
            <div class="flex-1 min-w-0">
              <span
                v-if="toast.title"
                class="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap"
              >
                {{ toast.title }}
              </span>
              <span
                class="text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap ml-2"
              >
                {{ toast.message }}
              </span>
            </div>
            <div class="flex-shrink-0 flex ml-3">
              <button
                @click="removeToast(toast.id)"
                class="bg-transparent rounded-md inline-flex text-gray-400 dark:text-gray-300 hover:text-gray-200 focus:outline-none"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <div v-if="toast.duration > 0" class="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            class="h-full transition-all ease-linear"
            :class="getProgressClasses(toast.type)"
            :style="{ width: `${toast.progress}%` }"
          ></div>
        </div>
      </div>
    </transition-group>
  </teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';
import { useToastStore } from '@/store/toast.store';

const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);

function getIcon(type: string) {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };
  return icons[type as keyof typeof icons] || InformationCircleIcon;
}

function getToastClasses(type: string) {
  const classes = {
    success: 'ring-green-400',
    error: 'ring-red-400',
    warning: 'ring-yellow-400',
    info: 'ring-blue-400',
  };
  return classes[type as keyof typeof classes] || classes.info;
}

function getIconClasses(type: string) {
  const classes = {
    success: 'text-green-600 bg-green-50 rounded-full p-1',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };
  return classes[type as keyof typeof classes] || classes.info;
}

function getProgressClasses(type: string) {
  const classes = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400',
    info: 'bg-blue-400',
  };
  return classes[type as keyof typeof classes] || classes.info;
}

function removeToast(id: string) {
  toastStore.removeToast(id);
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
