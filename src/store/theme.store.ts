import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<Theme>('system');
  const systemPrefersDark = ref(false);

  // Computed
  const isDark = computed(() => {
    if (currentTheme.value === 'system') {
      return systemPrefersDark.value;
    }
    return currentTheme.value === 'dark';
  });

  const isLight = computed(() => !isDark.value);

  // Actions
  function setTheme(theme: Theme) {
    currentTheme.value = theme;
    localStorage.setItem('theme', theme);
    applyTheme();
  }

  function toggleTheme() {
    if (currentTheme.value === 'light') {
      setTheme('dark');
    } else if (currentTheme.value === 'dark') {
      setTheme('light');
    } else {
      // If system, toggle to opposite of current system preference
      setTheme(systemPrefersDark.value ? 'light' : 'dark');
    }
  }

  function applyTheme() {
    const html = document.documentElement;

    if (isDark.value) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  function initTheme() {
    // Check for saved theme preference or default to 'system'
    const savedTheme = localStorage.getItem('theme') as Theme;

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      currentTheme.value = savedTheme;
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = mediaQuery.matches;

    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches;
      if (currentTheme.value === 'system') {
        applyTheme();
      }
    });

    // Apply initial theme
    applyTheme();
  }

  // Watch for theme changes
  watch([currentTheme, systemPrefersDark], () => {
    applyTheme();
  });

  return {
    // State
    currentTheme,
    systemPrefersDark,

    // Computed
    isDark,
    isLight,

    // Actions
    setTheme,
    toggleTheme,
    initTheme,
    applyTheme,
  };
});
