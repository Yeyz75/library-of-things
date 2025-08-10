<template>
  <AppLayout>
    <div class="container py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Search Items
        </h1>
        <SearchBar
          v-model="searchQuery"
          :categories="categories"
          :suggestions="searchSuggestions"
          placeholder="Search for items to borrow..."
          @search="handleSearch"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Filters Sidebar -->
        <div class="lg:col-span-1">
          <FilterPanel
            :filters="filters"
            :categories="categoriesWithCount"
            :available-tags="availableTags"
            @apply-filters="handleFiltersApply"
          />
        </div>

        <!-- Results -->
        <div class="lg:col-span-3">
          <!-- Results Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2
                class="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                Search Results
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                {{ totalResults }} items found
                <span v-if="searchQuery">for "{{ searchQuery }}"</span>
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <!-- View Toggle -->
              <div
                class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1"
              >
                <button
                  @click="viewMode = 'grid'"
                  class="p-2 rounded-md transition-colors duration-200"
                  :class="
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  "
                >
                  <Squares2X2Icon class="h-5 w-5" />
                </button>
                <button
                  @click="viewMode = 'list'"
                  class="p-2 rounded-md transition-colors duration-200"
                  :class="
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  "
                >
                  <ListBulletIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-12">
            <BaseLoader size="lg" text="Searching items..." />
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <EmptyState
              type="error"
              :title="error"
              description="Please try again or adjust your search criteria."
              action-text="Try Again"
              @action="performSearch"
            />
          </div>

          <!-- Results Grid/List -->
          <div v-else-if="searchResults.length > 0">
            <!-- Grid View -->
            <div
              v-if="viewMode === 'grid'"
              class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
            >
              <ItemCard
                v-for="item in searchResults"
                :key="item.$id"
                :item="item"
                :categories="categories"
                :show-distance="true"
                :show-rating="true"
                @click="$router.push(`/items/${item.$id}`)"
                @reserve="handleReserve"
                @share="handleShare"
                @toggle-favorite="handleToggleFavorite"
              />
            </div>

            <!-- List View -->
            <div v-else class="space-y-4 mb-8">
              <div
                v-for="item in searchResults"
                :key="item.$id"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0">
                    <div
                      class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
                    >
                      <img
                        v-if="item.imageUrls?.[0]"
                        :src="item.imageUrls[0]"
                        :alt="item.title"
                        class="w-full h-full object-cover"
                      />
                      <div
                        v-else
                        class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
                      >
                        <PhotoIcon class="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <div>
                        <h3
                          class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1"
                        >
                          {{ item.title }}
                        </h3>
                        <p
                          class="text-gray-600 dark:text-gray-300 text-sm mb-2"
                        >
                          {{ item.description }}
                        </p>
                        <div
                          class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
                        >
                          <span
                            class="inline-block bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-xs font-medium px-2.5 py-0.5 rounded-full"
                          >
                            {{ getCategoryName(item.category) }}
                          </span>
                          <span v-if="item.distance" class="flex items-center">
                            <MapPinIcon class="h-4 w-4 mr-1" />
                            {{ formatDistance(item.distance) }}
                          </span>
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="
                              item.isAvailable
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            "
                          >
                            {{ item.isAvailable ? 'Available' : 'Borrowed' }}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center space-x-2">
                        <button
                          v-if="item.isAvailable"
                          @click="handleReserve(item)"
                          class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
                        >
                          Reserve
                        </button>
                        <button
                          @click="$router.push(`/items/${item.$id}`)"
                          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <BasePagination
              :current-page="currentPage"
              :total-pages="totalPages"
              :total="totalResults"
              :page-size="pageSize"
              @page-change="handlePageChange"
              @page-size-change="handlePageSizeChange"
            />
          </div>

          <!-- Empty State -->
          <EmptyState
            v-else
            type="no-results"
            title="No items found"
            description="Try adjusting your search terms or filters to find what you're looking for."
            action-text="Clear Filters"
            @action="clearAllFilters"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import {
  Squares2X2Icon,
  ListBulletIcon,
  PhotoIcon,
  MapPinIcon,
} from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import FilterPanel from '@/components/common/FilterPanel.vue';
import ItemCard from '@/components/common/ItemCard.vue';
import BasePagination from '@/components/common/BasePagination.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/composables/useToast';
import { AnyValue, FilterOptions } from '@/types';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const toast = useToast();

const { isAuthenticated } = storeToRefs(authStore);

const searchQuery = ref((route.query.q as string) || '');
const viewMode = ref<'grid' | 'list'>('grid');
const isLoading = ref(false);
const error = ref('');
const searchResults = ref<AnyValue[]>([]);
const currentPage = ref(1);
const pageSize = ref(12);
const totalResults = ref(0);
const totalPages = ref(0);

const filters = ref<FilterOptions>({
  categories: [],
  availableOnly: false,
  maxDistance: 50,
  minRating: null,
  availableFrom: '',
  availableTo: '',
  tags: [],
  sortBy: 'newest',
});

const categories = [
  { key: 'tools', name: 'Tools' },
  { key: 'electronics', name: 'Electronics' },
  { key: 'books', name: 'Books' },
  { key: 'sports', name: 'Sports' },
  { key: 'home', name: 'Home' },
  { key: 'garden', name: 'Garden' },
  { key: 'games', name: 'Games' },
  { key: 'other', name: 'Other' },
];

const categoriesWithCount = computed(() => {
  return categories.map((category) => ({
    ...category,
    count: Math.floor(Math.random() * 50) + 1, // Mock count
  }));
});

const availableTags = ref([
  { name: 'portable', count: 15 },
  { name: 'electric', count: 12 },
  { name: 'manual', count: 8 },
  { name: 'outdoor', count: 20 },
  { name: 'indoor', count: 18 },
  { name: 'professional', count: 6 },
  { name: 'beginner', count: 14 },
]);

const searchSuggestions = [
  'drill',
  'laptop',
  'bicycle',
  'camera',
  'tent',
  'guitar',
  'books',
  'games',
];

function getCategoryName(categoryKey: string): string {
  const category = categories.find((c) => c.key === categoryKey);
  return category?.name || categoryKey;
}

function formatDistance(distance: number): string {
  return distance < 1
    ? `${Math.round(distance * 1000)}m`
    : `${distance.toFixed(1)}km`;
}

async function performSearch() {
  isLoading.value = true;
  error.value = '';

  try {
    // Mock search implementation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock results
    const mockResults = Array.from({ length: pageSize.value }, (_, i) => ({
      $id: `item-${i}`,
      title: `Sample Item ${i + 1}`,
      description: `This is a sample item description for item ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)].key,
      imageUrls: Math.random() > 0.5 ? ['https://via.placeholder.com/300'] : [],
      isAvailable: Math.random() > 0.3,
      ownerName: `User ${i + 1}`,
      distance: Math.random() * 10,
      rating: Math.floor(Math.random() * 5) + 1,
      reviewCount: Math.floor(Math.random() * 20),
      tags: ['portable', 'electric'].slice(
        0,
        Math.floor(Math.random() * 2) + 1
      ),
    }));

    searchResults.value = mockResults;
    totalResults.value = 150; // Mock total
    totalPages.value = Math.ceil(totalResults.value / pageSize.value);
  } catch {
    error.value = 'Failed to search items. Please try again.';
    toast.error('Search failed', 'Please try again');
  } finally {
    isLoading.value = false;
  }
}

function handleSearch(query: string, searchFilters: Partial<FilterOptions>) {
  searchQuery.value = query;
  filters.value = { ...filters.value, ...searchFilters };
  currentPage.value = 1;

  // Update URL
  router.push({
    query: {
      ...route.query,
      q: query || undefined,
      page: undefined,
    },
  });

  performSearch();
}

function handleFiltersApply(newFilters: FilterOptions) {
  filters.value = newFilters;
  currentPage.value = 1;
  performSearch();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  performSearch();
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  performSearch();
}

function handleReserve(item: AnyValue) {
  if (!isAuthenticated.value) {
    toast.warning('Please sign in to reserve items', 'Authentication Required');
    return;
  }
  toast.success(
    `Reservation request sent for "${item.title}"`,
    'Reservation Requested'
  );
}

function handleShare(item: AnyValue) {
  if (navigator.share) {
    navigator.share({
      title: item.title,
      text: item.description,
      url: `${window.location.origin}/items/${item.$id}`,
    });
  } else {
    navigator.clipboard.writeText(
      `${window.location.origin}/items/${item.$id}`
    );
    toast.success('Link copied to clipboard!', 'Shared');
  }
}

function handleToggleFavorite(item: AnyValue) {
  if (!isAuthenticated.value) {
    toast.warning(
      'Please sign in to save favorites',
      'Authentication Required'
    );
    return;
  }
  toast.success(`Added "${item.title}" to favorites`, 'Favorite Added');
}

function clearAllFilters() {
  filters.value = {
    categories: [],
    availableOnly: false,
    maxDistance: 50,
    minRating: null,
    availableFrom: '',
    availableTo: '',
    tags: [],
    sortBy: 'newest',
  };
  performSearch();
}

watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery !== searchQuery.value) {
      searchQuery.value = (newQuery as string) || '';
      performSearch();
    }
  }
);

onMounted(() => {
  if (searchQuery.value || Object.keys(route.query).length > 0) {
    performSearch();
  }
});
</script>
