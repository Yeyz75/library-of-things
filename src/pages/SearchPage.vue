<template>
  <AppLayout>
    <div class="container py-8">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Search Items
        </h1>
        <SearchBar
          :modelValue="searchQuery"
          @update:modelValue="(value) => (searchQuery = value)"
          placeholder="Search for items to borrow..."
          @search="handleSearch"
        />
      </div>

      <!-- Categories Section -->
      <div v-if="!searchQuery && !selectedCategory" class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Browse by Category
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            v-for="category in categories"
            :key="category.key"
            @click="searchByCategory(category.key)"
            class="category-card-hover p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center transition-all duration-200 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600"
          >
            <div class="text-2xl mb-2">{{ category.icon }}</div>
            <h3 class="font-medium text-gray-900 dark:text-gray-100">
              {{ category.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Browse items
            </p>
          </button>
        </div>
      </div>

      <!-- Search Results Header -->
      <div v-if="hasSearched" class="mb-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            <span v-if="searchQuery"
              >Search Results for "{{ searchQuery }}"</span
            >
            <span v-else-if="selectedCategory">{{
              getCategoryName(selectedCategory)
            }}</span>
            <span v-else>All Items</span>
          </h2>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ totalResults }} {{ totalResults === 1 ? 'item' : 'items' }} found
          </div>
        </div>

        <!-- Active Filters -->
        <div
          v-if="searchQuery || selectedCategory"
          class="flex flex-wrap gap-2 mt-3"
        >
          <span
            v-if="searchQuery"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
          >
            Search: "{{ searchQuery }}"
            <button @click="clearSearch" class="ml-2 hover:text-primary-600">
              <XMarkIcon class="h-4 w-4" />
            </button>
          </span>
          <span
            v-if="selectedCategory"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            Category: {{ getCategoryName(selectedCategory) }}
            <button @click="clearCategory" class="ml-2 hover:text-blue-600">
              <XMarkIcon class="h-4 w-4" />
            </button>
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Searching items...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div
          class="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6 max-w-md mx-auto"
        >
          <div class="text-red-600 dark:text-red-400 mb-4">
            <ExclamationTriangleIcon class="h-8 w-8 mx-auto" />
          </div>
          <h3 class="text-lg font-medium text-red-800 dark:text-red-300 mb-2">
            Search Failed
          </h3>
          <p class="text-red-700 dark:text-red-400 mb-4">{{ error }}</p>
          <button
            @click="retrySearch"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="hasSearched && searchResults.length === 0"
        class="text-center py-12"
      >
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <div
            class="h-16 w-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
          >
            <span class="text-2xl">📭</span>
          </div>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Items Found
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          <span v-if="searchQuery"
            >No items match your search for "{{ searchQuery }}". Try different
            keywords or browse by category.</span
          >
          <span v-else>No items found in this category.</span>
        </p>
        <button
          @click="clearSearch"
          class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
        >
          Clear Search
        </button>
      </div>

      <!-- Search Results Grid -->
      <div v-else-if="searchResults.length > 0" class="space-y-6">
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <div
            v-for="item in searchResults"
            :key="item.$id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div class="p-6">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {{ item.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {{ item.description }}
              </p>
              <div class="flex items-center justify-between">
                <span
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300':
                      item.isAvailable,
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300':
                      !item.isAvailable,
                  }"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ item.isAvailable ? 'Available' : 'Unavailable' }}
                </span>
                <button
                  v-if="item.isAvailable"
                  class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors duration-200"
                  @click="handleReserve(item)"
                >
                  Reserve
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Popular Items (when no search) -->
      <div v-if="!hasSearched" class="mt-12">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Popular Items
        </h2>
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <div class="text-center py-8 col-span-full">
            <p class="text-gray-500 dark:text-gray-400">
              Use the search bar above or browse by category to find items.
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import { itemsAPI } from '@/api';
import type { ItemCategoryModel } from '@/types/models';

interface Item {
  $id: string;
  title: string;
  description: string;
  isAvailable: boolean;
  category?: string;
}

// Reactive state
const searchQuery = ref('');
const selectedCategory = ref<string>('');
const isLoading = ref(false);
const error = ref('');
const searchResults = ref<Item[]>([]);
const totalResults = ref(0);
const hasSearched = ref(false);

// Categories configuration
const categories = ref([
  { key: 'tools', name: 'Tools', icon: '🔧' },
  { key: 'electronics', name: 'Electronics', icon: '📱' },
  { key: 'books', name: 'Books', icon: '📚' },
  { key: 'sports', name: 'Sports', icon: '⚽' },
  { key: 'home', name: 'Home', icon: '🏠' },
  { key: 'garden', name: 'Garden', icon: '🌱' },
  { key: 'clothing', name: 'Clothing', icon: '👕' },
  { key: 'games', name: 'Games', icon: '🎮' },
  { key: 'other', name: 'Other', icon: '📦' },
]);

// Helper functions
const getCategoryName = (key: string) => {
  const category = categories.value.find((cat) => cat.key === key);
  return category ? category.name : key;
};

// Search functions
async function handleSearch(query: string) {
  if (!query.trim()) {
    clearResults();
    return;
  }

  selectedCategory.value = '';
  searchQuery.value = query;
  hasSearched.value = true;
  isLoading.value = true;
  error.value = '';

  try {
    const response = await itemsAPI.searchByTitle(query);

    if (response.success && response.data) {
      searchResults.value = response.data.documents as Item[];
      totalResults.value = response.data.total;
    } else {
      throw new Error(response.error || 'Failed to search items');
    }
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Search failed. Please try again.';
    error.value = errorMessage;
    searchResults.value = [];
    totalResults.value = 0;
  } finally {
    isLoading.value = false;
  }
}

async function searchByCategory(categoryKey: string) {
  selectedCategory.value = categoryKey;
  searchQuery.value = '';
  hasSearched.value = true;
  isLoading.value = true;
  error.value = '';

  try {
    // Usar getItemsByCategory para filtrar por categoría (no búsqueda de texto)
    const response = await itemsAPI.getItemsByCategory(
      categoryKey as ItemCategoryModel
    );

    if (response.success && response.data) {
      searchResults.value = response.data.documents as Item[];
      totalResults.value = response.data.total;
    } else {
      throw new Error(response.error || 'Failed to fetch category items');
    }
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to load category items.';
    error.value = errorMessage;
    searchResults.value = [];
    totalResults.value = 0;
  } finally {
    isLoading.value = false;
  }
}

function clearSearch() {
  searchQuery.value = '';
  clearResults();
}

function clearCategory() {
  selectedCategory.value = '';
  clearResults();
}

function clearResults() {
  searchResults.value = [];
  totalResults.value = 0;
  hasSearched.value = false;
  error.value = '';
}

function retrySearch() {
  if (searchQuery.value) {
    handleSearch(searchQuery.value);
  } else if (selectedCategory.value) {
    searchByCategory(selectedCategory.value);
  }
}

function handleReserve(item: Item) {
  // Handle reservation logic
  console.log('Reserve item:', item);
  // This would typically open a modal or navigate to reservation page
}
</script>
