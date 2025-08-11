import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ToastModel } from '@/types/models';

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastModel[]>([]);

  function addToast(
    type: ToastModel['type'],
    message: string,
    title?: string,
    duration = 5000
  ) {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastModel = {
      id,
      type,
      title,
      message,
      duration,
      progress: 100,
    };

    toasts.value.push(toast);

    if (duration > 0) {
      // Animate progress bar
      const interval = 50;
      const decrement = (interval / duration) * 100;

      const progressTimer = setInterval(() => {
        toast.progress -= decrement;
        if (toast.progress <= 0) {
          clearInterval(progressTimer);
          removeToast(id);
        }
      }, interval);

      toast.timer = progressTimer;
    }

    return id;
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      const toast = toasts.value[index];
      if (toast.timer) {
        clearInterval(toast.timer);
      }
      toasts.value.splice(index, 1);
    }
  }

  function clearAllToasts() {
    toasts.value.forEach((toast) => {
      if (toast.timer) {
        clearInterval(toast.timer);
      }
    });
    toasts.value = [];
  }

  // Convenience methods
  function success(message: string, title?: string, duration?: number) {
    return addToast('success', message, title, duration);
  }

  function error(message: string, title?: string, duration?: number) {
    return addToast('error', message, title, duration);
  }

  function warning(message: string, title?: string, duration?: number) {
    return addToast('warning', message, title, duration);
  }

  function info(message: string, title?: string, duration?: number) {
    return addToast('info', message, title, duration);
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
});
