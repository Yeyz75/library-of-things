<template>
  <div class="relative">
    <!-- Theme Toggle Button -->
    <button
      @click="toggleDropdown"
      class="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      :class="{ 'bg-gray-100 dark:bg-gray-800': isOpen }"
      aria-label="Toggle theme"
    >
      <!-- Sun Icon (Light Mode) -->
      <SunIcon
        v-if="!themeStore.isDark"
        class="h-5 w-5 transition-transform duration-300 rotate-0 scale-100"
      />
      <!-- Moon Icon (Dark Mode) -->
      <MoonIcon
        v-else
        class="h-5 w-5 transition-transform duration-300 rotate-0 scale-100"
      />

      <!-- Dropdown Indicator -->
      <ChevronDownIcon
        class="h-3 w-3 absolute -bottom-0.5 -right-0.5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50"
        @click.stop
      >
        <div class="py-2">
          <!-- Light Theme Option -->
          <button
            @click="setTheme('light')"
            class="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300':
                themeStore.currentTheme === 'light',
            }"
          >
            <SunIcon class="mr-3 h-4 w-4" />
            Light
            <CheckIcon
              v-if="themeStore.currentTheme === 'light'"
              class="ml-auto h-4 w-4 text-primary-600 dark:text-primary-400"
            />
          </button>

          <!-- Dark Theme Option -->
          <button
            @click="setTheme('dark')"
            class="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300':
                themeStore.currentTheme === 'dark',
            }"
          >
            <MoonIcon class="mr-3 h-4 w-4" />
            Dark
            <CheckIcon
              v-if="themeStore.currentTheme === 'dark'"
              class="ml-auto h-4 w-4 text-primary-600 dark:text-primary-400"
            />
          </button>

          <!-- System Theme Option -->
          <button
            @click="setTheme('system')"
            class="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300':
                themeStore.currentTheme === 'system',
            }"
          >
            <ComputerDesktopIcon class="mr-3 h-4 w-4" />
            System
            <CheckIcon
              v-if="themeStore.currentTheme === 'system'"
              class="ml-auto h-4 w-4 text-primary-600 dark:text-primary-400"
            />
          </button>
        </div>

        <!-- Current System Preference Indicator -->
        <div
          v-if="themeStore.currentTheme === 'system'"
          class="border-t border-gray-200 dark:border-gray-700 px-4 py-2"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400">
            System: {{ themeStore.systemPrefersDark ? 'Dark' : 'Light' }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline';
import { useThemeStore, type Theme } from '@/store/theme.store';

const themeStore = useThemeStore();
const isOpen = ref(false);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function setTheme(theme: Theme) {
  themeStore.setTheme(theme);
  isOpen.value = false;
}

function closeDropdown() {
  isOpen.value = false;
}

// Close dropdown when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as Element;
  if (!target.closest('.relative')) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
