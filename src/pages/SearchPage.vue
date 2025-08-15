<template>
  <AppLayout>
    <ExploreLayout :categories="categories" @select-category="searchByCategory">
      <template #default>
        <div class="container py-8">
          <!-- Header Section -->
          <div class="mb-8">
            <h1
              class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            >
              {{ t('search.title') }}
            </h1>
            <SearchBar
              :modelValue="searchQuery"
              @update:modelValue="(value) => (searchQuery = value)"
              :placeholder="t('search.placeholder')"
              @search="handleSearch"
            />
          </div>

          <!-- ...existing search/result content... (kept unchanged) -->

          <!-- Search Results Header -->
          <div v-if="hasSearched" class="mb-6">
            <div class="flex items-center justify-between">
              <h2
                class="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                <span v-if="searchQuery">
                  {{ t('search.resultsFor', { query: searchQuery }) }}
                </span>
                <span v-else-if="selectedCategory">
                  {{ getCategoryName(selectedCategory) }}
                </span>
                <span v-else>
                  {{ t('search.results') }}
                </span>
              </h2>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{
                  t('search.resultsCount', {
                    count: pagination.totalItems.value,
                  })
                }}
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
                {{ t('common.search') }}: "{{ searchQuery }}"
                <button
                  @click="clearSearch"
                  class="ml-2 hover:text-primary-600"
                >
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </span>
              <span
                v-if="selectedCategory"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              >
                {{ t('filters.category') }}:
                {{ getCategoryName(selectedCategory) }}
                <button @click="clearCategory" class="ml-2 hover:text-blue-600">
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </span>
            </div>
          </div>

          <!-- Loading, error, results, empty and popular sections stay the same -->

          <!-- Loading State -->
          <div v-if="pagination.loading.value" class="text-center py-12">
            <div
              class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
            ></div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">
              {{ t('search.searching') }}
            </p>
          </div>

          <!-- Error State -->
          <div v-else-if="pagination.error.value" class="text-center py-12">
            <PaginationError
              :message="pagination.error.value"
              :disabled="pagination.loading.value"
              @retry="pagination.retry"
              @refresh="pagination.refresh"
              :allowManualRefresh="true"
            />
          </div>

          <!-- Empty State -->
          <div
            v-else-if="hasSearched && pagination.items.value.length === 0"
            class="text-center py-12"
          >
            <div class="text-gray-400 dark:text-gray-500 mb-4">
              <div
                class="h-16 w-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
              >
                <span class="text-2xl">📭</span>
              </div>
            </div>
            <h3
              class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2"
            >
              {{ t('search.noResults') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              <span v-if="searchQuery">{{
                t('search.noResultsDescription')
              }}</span>
              <span v-else>{{ t('home.items.noItemsInCategory') }}</span>
            </p>
            <button
              @click="clearSearch"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
            >
              {{ t('search.clearFilters') }}
            </button>
          </div>

          <!-- Search Results Grid -->
          <div v-else-if="pagination.items.value.length > 0" class="space-y-6">
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <div
                v-for="item in pagination.items.value"
                :key="item.$id"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div class="p-6">
                  <h3
                    class="font-semibold text-gray-900 dark:text-gray-100 mb-2"
                  >
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
                      >{{
                        item.isAvailable
                          ? t('itemCard.available')
                          : t('itemCard.notAvailable')
                      }}</span
                    >
                    <button
                      v-if="item.isAvailable"
                      class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors duration-200"
                      @click="handleReserve(item)"
                    >
                      {{ t('search.reserve') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination Component -->
            <div class="mt-8">
              <Pagination
                :current-page="pagination.currentPage.value"
                :total-items="pagination.totalItems.value"
                :items-per-page="pagination.pageSize.value"
                :loading="pagination.loading.value"
                :page-size-options="[10, 20, 50]"
                @page-change="pagination.goToPage"
                @page-size-change="pagination.changePageSize"
              />
            </div>
          </div>

          <!-- Popular Items (when no search) -->
          <div v-if="!hasSearched" class="mt-12">
            <h2
              class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6"
            >
              {{ t('home.featuredItems.title') }}
            </h2>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <div class="text-center py-8 col-span-full">
                <p class="text-gray-500 dark:text-gray-400">
                  {{ t('search.popularHint') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ExploreLayout>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import ExploreLayout from '@/components/layout/ExploreLayout.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PaginationError from '@/components/common/PaginationError.vue';
import { usePagination } from '@/composables/usePagination';
import { itemsAPI } from '@/api';
import type { ItemCategoryModel, ItemModel } from '@/types/models';
import type { PaginatedResponse } from '@/types/pagination';
import { useI18n } from '@/composables/useI18n';

// Reactive state for search criteria
const searchQuery = ref('');
// Cambiado a ItemCategoryModel | '' para coincidir con la prop esperada
const selectedCategory = ref<ItemCategoryModel | ''>('');
const hasSearched = ref(false);

// Categories configuration (use translation keys for names)
// Se castea cada key a ItemCategoryModel para cumplir el tipo esperado
const categories = ref([
  {
    key: 'tools' as ItemCategoryModel,
    nameKey: 'home.categories.tools',
    icon: '🔧',
  },
  {
    key: 'electronics' as ItemCategoryModel,
    nameKey: 'home.categories.electronics',
    icon: '📱',
  },
  {
    key: 'books' as ItemCategoryModel,
    nameKey: 'home.categories.books',
    icon: '📚',
  },
  {
    key: 'sports' as ItemCategoryModel,
    nameKey: 'home.categories.sports',
    icon: '⚽',
  },
  {
    key: 'home' as ItemCategoryModel,
    nameKey: 'home.categories.home',
    icon: '🏠',
  },
  {
    key: 'garden' as ItemCategoryModel,
    nameKey: 'home.categories.garden',
    icon: '🌱',
  },
  {
    key: 'clothing' as ItemCategoryModel,
    nameKey: 'items.categories.clothing',
    icon: '👕',
  },
  {
    key: 'games' as ItemCategoryModel,
    nameKey: 'home.categories.games',
    icon: '🎮',
  },
  {
    key: 'other' as ItemCategoryModel,
    nameKey: 'home.categories.other',
    icon: '📦',
  },
]);

// Pagination fetch function that handles both search and category filtering
const fetchItems = async (
  page: number,
  pageSize: number
): Promise<PaginatedResponse<ItemModel>> => {
  const paginationParams = { page, pageSize };

  if (searchQuery.value.trim()) {
    // Search by title
    return await itemsAPI.searchByTitle(searchQuery.value, paginationParams);
  } else if (selectedCategory.value) {
    // selectedCategory está estrechado a ItemCategoryModel aquí; ya no es necesario el cast
    return await itemsAPI.getItemsByCategory(
      selectedCategory.value,
      paginationParams
    );
  } else {
    // Return empty results when no search criteria
    return {
      data: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
};

// Initialize pagination
const pagination = usePagination<ItemModel>({
  fetchFunction: fetchItems,
  initialPageSize: 20,
});

// I18n
const { t } = useI18n();

// Helper functions
const getCategoryName = (key: ItemCategoryModel | '') => {
  const category = categories.value.find((cat) => cat.key === key);
  return category ? t(category.nameKey) : String(key);
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

  // Reset pagination to first page and refresh
  pagination.reset();
  await pagination.refresh();
}

// Cambiada la firma para aceptar ItemCategoryModel
async function searchByCategory(categoryKey: ItemCategoryModel) {
  selectedCategory.value = categoryKey;
  searchQuery.value = '';
  hasSearched.value = true;

  // Reset pagination to first page and refresh
  pagination.reset();
  await pagination.refresh();
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
  searchQuery.value = '';
  selectedCategory.value = '';
  hasSearched.value = false;
  pagination.reset();
}

function handleReserve(item: ItemModel) {
  // Handle reservation logic
  console.log('Reserve item:', item);
  // This would typically open a modal or navigate to reservation page
}

// Watch for changes in search criteria to trigger refresh
watch([searchQuery, selectedCategory], () => {
  if (hasSearched.value && (searchQuery.value || selectedCategory.value)) {
    pagination.refresh();
  }
});
</script>
