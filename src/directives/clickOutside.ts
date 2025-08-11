// src/directives/clickOutside.ts
import type { Directive } from 'vue';
import type { ClickOutsideElementModel } from '@/types';

const clickOutside: Directive = {
  beforeMount(el, binding) {
    const element = el as ClickOutsideElementModel;
    element._clickOutsideHandler = (event: MouseEvent) => {
      if (!element.contains(event.target as Node)) {
        setTimeout(() => {
          binding.value();
        }, 0);
      }
    };
    document.addEventListener('mousedown', element._clickOutsideHandler);
  },
  unmounted(el) {
    const element = el as ClickOutsideElementModel;
    if (element._clickOutsideHandler) {
      document.removeEventListener('mousedown', element._clickOutsideHandler);
      delete element._clickOutsideHandler;
    }
  },
};

export default clickOutside;
