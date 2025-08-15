<template>
  <AppLayout>
    <div class="container py-8">
      <!-- Hero Section with Prominent Search -->
      <div class="text-center mb-12">
        <div class="max-w-4xl mx-auto">
          <h1
            class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-display"
          >
            {{ t('browseItems.title') }}
          </h1>
          <p
            class="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed"
          >
            {{ t('home.categories.subtitle') }}
          </p>

          <!-- Prominent Search Bar -->
          <div class="relative max-w-2xl mx-auto mb-8">
            <div class="relative group">
              <div
                class="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"
              ></div>
              <div
                class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2"
              >
                <SearchBar
                  v-model="searchQuery"
                  :categories="categories"
                  :suggestions="searchSuggestions"
                  :placeholder="t('search.placeholder')"
                  :prominent="true"
                  @search="handleSearch"
                  class="border-0 shadow-none bg-transparent"
                />
              </div>
            </div>
          </div>

          <!-- Quick Search Suggestions -->
          <div class="flex flex-wrap gap-2 justify-center mb-8">
            <span class="text-sm text-gray-500 dark:text-gray-400 mr-2"
              >{{ t('search.quickSearch') }}:</span
            >
            <button
              v-for="suggestion in popularSearches"
              :key="suggestion"
              @click="selectQuickSearch(suggestion)"
              class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 transform hover:scale-105"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- Explore layout: sidebar categorias + listado de artículos -->
      <ExploreLayout
        :categories="categories"
        :title="t('home.items.title')"
        :subtitle="t('home.items.subtitle')"
        :selected="selectedCategory"
        @select-category="selectCategory"
      >
        <template #default>
          <!-- Loading -->
          <div v-if="isLoading" class="text-center py-16">
            <div class="relative">
              <div
                class="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin mx-auto mb-4"
              ></div>
              <div
                class="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full animate-ping mx-auto"
              ></div>
            </div>
            <p
              class="text-lg font-medium text-gray-600 dark:text-gray-400 animate-pulse"
            >
              {{ t('home.items.loading') }}
            </p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="text-center py-12">
            <EmptyState
              type="error"
              :title="error"
              :description="t('home.items.error')"
              :action-text="t('home.items.tryAgain')"
              @action="loadItems"
            />
          </div>

          <!-- Items list -->
          <div v-else>
            <div v-if="filteredItems.length === 0">
              <EmptyState
                type="no-items"
                :title="t('home.items.noItems')"
                :description="t('home.items.noItemsDescription')"
                :action-text="
                  isAuthenticated
                    ? t('home.items.addFirstItem')
                    : t('home.items.signUpToAdd')
                "
                :show-action="true"
                @action="handleEmptyStateAction"
              />
            </div>

            <div v-else class="space-y-4">
              <ArticleCard
                v-for="item in visibleItems"
                :key="item.$id"
                :item="item"
                :categories="categories"
                @viewDetails="viewDetails"
                @reserve="handleReserve"
                @share="handleShare"
              />
            </div>
          </div>
        </template>
      </ExploreLayout>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
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
import SearchBar from '@/components/common/SearchBar.vue';
import ExploreLayout from '@/components/layout/ExploreLayout.vue';
import ArticleCard from '@/components/common/ArticleCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useItemsStore } from '@/store/items.store';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

const router = useRouter();
const itemsStore = useItemsStore();
const authStore = useAuthStore();
const toast = useToast();
const { t } = useI18n();

const { isAuthenticated } = storeToRefs(authStore);

const searchQuery = ref('');
const isLoading = ref(false);
const error = ref('');

// UI state for sidebar selection
const selectedCategory = ref<ItemCategoryModel | null>(null);

// Sorted items (most recent first) and filtered by selectedCategory
const sortedItems = computed(() => {
  // items coming from store may already be ordered by API
  return [...itemsStore.items].sort((a, b) => {
    const da = new Date(a.$createdAt || '').getTime() || 0;
    const db = new Date(b.$createdAt || '').getTime() || 0;
    return db - da;
  });
});

const filteredItems = computed(() => {
  if (!selectedCategory.value) return sortedItems.value;
  return sortedItems.value.filter(
    (it) => it.category === selectedCategory.value
  );
});

// Visible items: show a reasonable number on the explore page
const visibleItems = computed(() => filteredItems.value.slice(0, 20));

const categories: Array<{
  key: ItemCategoryModel;
  name: string;
  icon?: unknown;
}> = [
  {
    key: 'tools',
    name: 'Herramientas',
    icon: WrenchScrewdriverIcon,
  },
  {
    key: 'electronics',
    name: 'Electrónicos',
    icon: ComputerDesktopIcon,
  },
  {
    key: 'books',
    name: 'Libros',
    icon: BookOpenIcon,
  },
  {
    key: 'sports',
    name: 'Deportes',
    icon: PlayIcon,
  },
  {
    key: 'home',
    name: 'Hogar',
    icon: HomeIcon,
  },
  {
    key: 'garden',
    name: 'Jardín',
    icon: BeakerIcon,
  },
  {
    key: 'clothing',
    name: 'Ropa',
    icon: SparklesIcon,
  },
  {
    key: 'games',
    name: 'Juegos',
    icon: PlayIcon,
  },
  {
    key: 'other',
    name: 'Otros',
    icon: EllipsisHorizontalIcon,
  },
];

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

const popularSearches = [
  'taladro',
  'laptop',
  'bicicleta',
  'cámara',
  'tienda',
  'guitarra',
];

// NOTE: items are read directly from the store via `sortedItems` / `filteredItems`.

async function loadItems() {
  isLoading.value = true;
  error.value = '';

  try {
    await itemsStore.fetchItems({ limit: 12 });
  } catch {
    error.value = t('home.items.error');
    toast.error(t('home.items.error'), t('common.error'));
  } finally {
    isLoading.value = false;
  }
}

function handleSearch(
  query: string,
  filters?: Record<string, string | undefined>
) {
  // Navigate to search results page with query and filters
  const queryParams: Record<string, string> = {};

  if (query) {
    queryParams.search = query;
  }

  if (filters && typeof filters === 'object') {
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams[key] = filters[key] as string;
      }
    });
  }

  router.push({
    path: '/search',
    query: queryParams,
  });
}

function selectQuickSearch(suggestion: string) {
  searchQuery.value = suggestion;
  handleSearch(suggestion, {});
}

function selectCategory(key: ItemCategoryModel) {
  selectedCategory.value = key === selectedCategory.value ? null : key;
}

function viewDetails(item: ItemModel) {
  router.push(`/items/${item.$id}`);
}

function handleReserve(item: ItemModel) {
  if (!isAuthenticated.value) {
    toast.warning(t('itemCard.signInToRequest'), t('auth.login.title'));
    return;
  }
  // TODO: Implement reservation logic
  toast.success(
    t('reservations.borrowed.markReturned') + `: ${item.title}`,
    t('itemCard.reserve')
  );
}

function handleShare(item: ItemModel) {
  if (navigator.share) {
    navigator.share({
      title: item.title,
      text: item.description,
      url: `${window.location.origin}/items/${item.$id}`,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(
      `${window.location.origin}/items/${item.$id}`
    );
    toast.success(t('help.contactModal.success'), t('itemCard.share'));
  }
}

function handleEmptyStateAction() {
  if (isAuthenticated.value) {
    router.push('/items/create');
  } else {
    router.push('/register');
  }
}

onMounted(() => {
  loadItems();
});
</script>
