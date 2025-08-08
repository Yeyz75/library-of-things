<template>
  <AppLayout>
    <div class="container py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Browse by Category</h1>
        <p class="text-gray-600 mt-2">Find exactly what you're looking for</p>
      </div>

      <!-- Categories Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <router-link
          v-for="category in categories"
          :key="category.key"
          :to="`/?category=${category.key}`"
          class="card hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
        >
          <div class="text-center">
            <div class="bg-gray-100 rounded-full p-6 mb-4 group-hover:bg-primary-100 transition-colors">
              <component
                :is="category.icon"
                class="h-12 w-12 mx-auto text-gray-600 group-hover:text-primary-600 transition-colors"
              />
            </div>
            <h3 class="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {{ category.name }}
            </h3>
            <p class="text-gray-600 text-sm mb-4">{{ category.description }}</p>
            <div class="text-sm text-primary-600 font-medium">
              {{ category.count }} items →
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
import AppLayout from '@/components/layout/AppLayout.vue';
import { useItemsStore } from '@/store/items.store';

const itemsStore = useItemsStore();

const categoriesData = [
  {
    key: 'tools',
    name: 'Tools',
    description: 'Power tools, hand tools, and workshop equipment',
    icon: WrenchScrewdriverIcon,
  },
  {
    key: 'electronics',
    name: 'Electronics',
    description: 'Gadgets, cameras, audio equipment, and tech gear',
    icon: ComputerDesktopIcon,
  },
  {
    key: 'books',
    name: 'Books',
    description: 'Educational, fiction, cookbooks, and reference materials',
    icon: BookOpenIcon,
  },
  {
    key: 'sports',
    name: 'Sports & Recreation',
    description: 'Sports equipment, outdoor gear, and fitness accessories',
    icon: PlayIcon,
  },
  {
    key: 'home',
    name: 'Home & Kitchen',
    description: 'Appliances, cookware, and household items',
    icon: HomeIcon,
  },
  {
    key: 'garden',
    name: 'Garden & Outdoor',
    description: 'Gardening tools, outdoor furniture, and yard equipment',
    icon: BeakerIcon,
  },
  {
    key: 'clothing',
    name: 'Clothing & Accessories',
    description: 'Fashion items, special occasion wear, and accessories',
    icon: SparklesIcon,
  },
  {
    key: 'games',
    name: 'Games & Toys',
    description: 'Board games, video games, toys, and entertainment',
    icon: PlayIcon,
  },
  {
    key: 'other',
    name: 'Other',
    description: 'Everything else you can imagine sharing',
    icon: EllipsisHorizontalIcon,
  },
];

const categories = computed(() => {
  return categoriesData.map(category => ({
    ...category,
    count: itemsStore.itemsByCategory[category.key]?.length || 0,
  }));
});

onMounted(async () => {
  // Load all items to get accurate category counts
  await itemsStore.fetchItems();
});
</script>