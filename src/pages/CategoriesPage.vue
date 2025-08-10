<template>
  <AppLayout>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <button
          @click="$router.go(-1)"
          class="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <svg
            class="h-5 w-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          {{ t('common.back') }}
        </button>
      </div>

      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('categories.title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          {{ t('categories.subtitle') }}
        </p>
      </div>

      <!-- Categories Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <router-link
          v-for="category in categories"
          :key="category.key"
          :to="`/?category=${category.key}`"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
        >
          <div class="text-center">
            <div
              class="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 transition-colors"
            >
              <component
                :is="category.icon"
                class="h-12 w-12 mx-auto text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
              />
            </div>
            <h3
              class="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
            >
              {{ t(`items.categories.${category.key}`) }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {{ t(`categories.descriptions.${category.key}`) }}
            </p>
            <div
              class="text-sm text-primary-600 dark:text-primary-400 font-medium"
            >
              {{ t('categories.itemCount', { count: category.count }) }}
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  WrenchScrewdriverIcon,
  ComputerDesktopIcon,
  BookOpenIcon,
  PlayIcon,
  HomeIcon,
  BeakerIcon,
  SparklesIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/vue/24/outline';
import { useItemsStore } from '@/store/items.store';
import { useI18n } from '@/composables/useI18n';
import AppLayout from '@/components/layout/AppLayout.vue';

const itemsStore = useItemsStore();
const { t } = useI18n();

const categoriesData = [
  {
    key: 'tools',
    icon: WrenchScrewdriverIcon,
  },
  {
    key: 'electronics',
    icon: ComputerDesktopIcon,
  },
  {
    key: 'books',
    icon: BookOpenIcon,
  },
  {
    key: 'sports',
    icon: PlayIcon,
  },
  {
    key: 'home',
    icon: HomeIcon,
  },
  {
    key: 'garden',
    icon: BeakerIcon,
  },
  {
    key: 'clothing',
    icon: SparklesIcon,
  },
  {
    key: 'games',
    icon: PlayIcon,
  },
  {
    key: 'other',
    icon: EllipsisHorizontalIcon,
  },
];

const categories = computed(() => {
  return categoriesData.map((category) => ({
    ...category,
    count: itemsStore.itemsByCategory[category.key]?.length || 0,
  }));
});

onMounted(async () => {
  // Load all items to get accurate category counts
  await itemsStore.fetchItems();
});
</script>
