<template>
  <div class="relative">
    <button
      @click="toggleDropdown"
      class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
      :class="{ 'ring-2 ring-primary-500': isOpen }"
    >
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ currentLocale.toUpperCase() }}
      </span>
      <ChevronDownIcon
        class="h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <div
      v-if="isOpen"
      v-click-outside="closeDropdown"
      class="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
    >
      <div class="py-1">
        <button
          v-for="locale in availableLocales"
          :key="locale"
          @click="selectLocale(locale)"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          :class="{
            'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400':
              locale === currentLocale,
          }"
        >
          {{ getLocaleName(locale) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import { useI18n } from '@/composables/useI18n';

const { locale, availableLocales, changeLocale } = useI18n();

const isOpen = ref(false);

const currentLocale = computed(() => locale.value);

const getLocaleName = (localeCode: string): string => {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Español',
  };
  return names[localeCode] || localeCode;
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectLocale = (newLocale: string) => {
  changeLocale(newLocale);
  closeDropdown();
};
</script>
