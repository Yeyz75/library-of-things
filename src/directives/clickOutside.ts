// src/directives/clickOutside.ts
import type { Directive } from 'vue';
import type { ClickOutsideElementModel } from '@/types/models';

const clickOutside: Directive = {
  beforeMount(el, binding) {
    const element = el as ClickOutsideElementModel;
    element._clickOutsideHandler = (event: MouseEvent) => {
      if (!element.contains(event.target as Node)) {
        binding.value();
      }
    };
    // Use 'click' so clicks that call event.stopPropagation or @click.stop on elements
    // inside the component run before this handler and prevent race conditions.
    document.addEventListener('click', element._clickOutsideHandler);
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
