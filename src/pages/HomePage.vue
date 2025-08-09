<template>
  <AppLayout>
    <!-- Hero Section -->
    <section
      class="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 py-20 transition-colors duration-300"
    >
      <div class="container">
        <div class="text-center max-w-4xl mx-auto">
          <h1
            class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 animate-fade-in"
          >
            Share, Borrow,
            <span
              class="text-primary-600 dark:text-primary-400 gradient-primary bg-clip-text text-transparent"
              >Discover</span
            >
          </h1>
          <p
            class="text-xl text-gray-600 dark:text-gray-300 mb-8 animate-slide-up"
          >
            Welcome to the Library of Things - where communities share resources
            and build connections through the things we own.
          </p>
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
          >
            <router-link
              to="/register"
              class="btn-primary text-lg px-8 py-3 hover-lift"
            >
              Get Started
            </router-link>
            <button
              @click="scrollToItems"
              class="btn-secondary text-lg px-8 py-3 hover-lift"
            >
              Browse Items
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Categories -->
    <section
      class="py-16 bg-white dark:bg-gray-950 transition-colors duration-300"
    >
      <div class="container">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Popular Categories
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Discover amazing items across different categories
          </p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="category in categories"
            :key="category.name"
            class="text-center group cursor-pointer hover-lift"
            @click="filterByCategory(category.key)"
          >
            <div
              class="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 transition-all duration-300 hover-glow"
            >
              <component
                :is="category.icon"
                class="h-12 w-12 mx-auto text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300"
              />
            </div>
            <h3
              class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300"
            >
              {{ category.name }}
            </h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Items Listing -->
    <section
      ref="itemsSection"
      class="py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
    >
      <div class="container">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Recent Items
          </h2>
          <div class="flex items-center space-x-4">
            <select
              v-model="selectedCategory"
              @change="handleCategoryFilter"
              class="input max-w-xs"
            >
              <option value="">All Categories</option>
              <option
                v-for="category in categories"
                :key="category.key"
                :value="category.key"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="itemsStore.isLoading" class="text-center py-12">
          <BaseLoader size="lg" text="Loading items..." />
        </div>

        <!-- Error State -->
        <div v-else-if="itemsStore.error" class="text-center py-12">
          <div
            class="bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 p-6 rounded-lg max-w-md mx-auto border border-error-200 dark:border-error-800"
          >
            <p class="font-medium">Failed to load items</p>
            <p class="text-sm mt-1">{{ itemsStore.error }}</p>
            <button @click="loadItems" class="btn-primary mt-4">
              Try Again
            </button>
          </div>
        </div>

        <!-- Items Grid -->
        <div
          v-else-if="displayedItems.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <div
            v-for="item in displayedItems"
            :key="item.$id"
            class="card hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 cursor-pointer hover-lift hover-glow"
            @click="$router.push(`/items/${item.$id}`)"
          >
            <div
              class="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden"
            >
              <img
                v-if="item.imageUrls?.[0]"
                :src="item.imageUrls[0]"
                :alt="item.title"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
              >
                <PhotoIcon class="h-16 w-16" />
              </div>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {{ item.title }}
            </h3>
            <p
              class="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2"
            >
              {{ item.description }}
            </p>
            <div class="flex items-center justify-between">
              <span
                class="inline-block bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-xs font-medium px-2.5 py-0.5 rounded"
              >
                {{ getCategoryName(item.category) }}
              </span>
              <span
                class="status-badge text-xs font-medium px-2.5 py-0.5 rounded"
                :class="item.isAvailable ? 'success' : 'neutral'"
              >
                {{ item.isAvailable ? 'Available' : 'Borrowed' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <PhotoIcon
            class="h-24 w-24 mx-auto text-gray-300 dark:text-gray-600 mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No items found
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            {{
              selectedCategory
                ? 'No items in this category yet.'
                : 'Be the first to share an item!'
            }}
          </p>
          <router-link
            v-if="isAuthenticated"
            to="/items/new"
            class="btn-primary hover-lift"
          >
            Add First Item
          </router-link>
          <router-link v-else to="/register" class="btn-primary hover-lift">
            Sign Up to Add Items
          </router-link>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import {
  WrenchScrewdriverIcon,
  ComputerDesktopIcon,
  BookOpenIcon,
  PlayIcon,
  HomeIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useItemsStore } from '@/store/items.store';
import { useAuthStore } from '@/store/auth.store';

const itemsStore = useItemsStore();
const authStore = useAuthStore();

const { isAuthenticated } = storeToRefs(authStore);

const selectedCategory = ref('');
const itemsSection = ref<HTMLElement>();

const categories = [
  { key: 'tools', name: 'Tools', icon: WrenchScrewdriverIcon },
  { key: 'electronics', name: 'Electronics', icon: ComputerDesktopIcon },
  { key: 'books', name: 'Books', icon: BookOpenIcon },
  { key: 'sports', name: 'Sports', icon: PlayIcon },
  { key: 'home', name: 'Home', icon: HomeIcon },
  { key: 'garden', name: 'Garden', icon: HomeIcon },
  { key: 'games', name: 'Games', icon: PlayIcon },
  { key: 'other', name: 'Other', icon: PhotoIcon },
];

const displayedItems = computed(() => {
  if (!selectedCategory.value) {
    return itemsStore.items;
  }
  return itemsStore.items.filter(
    (item) => item.category === selectedCategory.value
  );
});

function getCategoryName(categoryKey: string): string {
  const category = categories.find((c) => c.key === categoryKey);
  return category?.name || categoryKey;
}

function scrollToItems() {
  itemsSection.value?.scrollIntoView({ behavior: 'smooth' });
}

function filterByCategory(categoryKey: string) {
  selectedCategory.value = categoryKey;
  scrollToItems();
}

function handleCategoryFilter() {
  scrollToItems();
}

async function loadItems() {
  await itemsStore.fetchItems({ limit: 20 });
}

onMounted(() => {
  loadItems();
});
</script>

<style>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
