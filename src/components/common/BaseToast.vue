<template>
  <teleport to="body">
    <transition-group
      name="toast"
      tag="div"
      class="fixed top-4 right-4 z-50 space-y-2"
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
        class="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 dark:ring-gray-700 overflow-hidden"
        :class="getToastClasses(toast.type)"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <component
                :is="getIcon(toast.type)"
                class="h-6 w-6"
                :class="getIconClasses(toast.type)"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p
                v-if="toast.title"
                class="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ toast.title }}
              </p>
              <p
                class="text-sm text-gray-500 dark:text-gray-300"
                :class="{ 'mt-1': toast.title }"
              >
                {{ toast.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="removeToast(toast.id)"
                class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
    success: 'border-l-4 border-green-400',
    error: 'border-l-4 border-red-400',
    warning: 'border-l-4 border-yellow-400',
    info: 'border-l-4 border-blue-400',
  };
  return classes[type as keyof typeof classes] || classes.info;
}

function getIconClasses(type: string) {
  const classes = {
    success: 'text-green-400',
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
