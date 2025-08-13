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

      <!-- Categories Section - Redesigned -->
      <div class="mb-12">
        <h2
          class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-8 text-center"
        >
          {{ t('home.categories.title') }}
        </h2>
        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
          <router-link
            v-for="(category, index) in categories"
            :key="category.key"
            :to="`/search?category=${category.key}`"
            :style="{ animationDelay: `${index * 80}ms` }"
            class="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer overflow-hidden category-card-hover particle-effect animate-fade-in-scale"
          >
            <!-- Gradient overlay on hover -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>

            <div class="relative text-center">
              <div
                class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 mb-4 group-hover:from-primary-100 dark:group-hover:from-primary-900/30 group-hover:to-purple-100 dark:group-hover:to-purple-900/30 transition-all duration-300 w-16 h-16 mx-auto flex items-center justify-center transform group-hover:scale-110"
              >
                <component
                  :is="category.icon"
                  class="h-8 w-8 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300"
                />
              </div>
              <h3
                class="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 text-sm"
              >
                {{ t(`items.categories.${category.key}`) }}
              </h3>
              <div
                class="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <span class="text-xs text-gray-500 dark:text-gray-400">{{
                  t('search.clickToExplore')
                }}</span>
              </div>
            </div>

            <!-- Hover indicator -->
            <div
              class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
            ></div>
          </router-link>
        </div>
      </div>

      <!-- Recent Items with Better Design -->
      <div>
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {{ t('home.items.title') }}
          </h2>
          <router-link
            to="/search"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            {{ t('home.featuredItems.browseAll') }}
            <svg
              class="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </router-link>
        </div>

        <!-- Loading State with Better Animation -->
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

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
          <EmptyState
            type="error"
            :title="error"
            :description="t('home.items.error')"
            :action-text="t('home.items.tryAgain')"
            @action="loadItems"
          />
        </div>

        <!-- Items Grid with Enhanced Design -->
        <div
          v-else-if="items.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <ItemCard
            v-for="item in items"
            :key="item.$id"
            :item="item"
            :categories="categories"
            :show-distance="true"
            :show-rating="true"
            @click="$router.push(`/items/${item.$id}`)"
            @reserve="handleReserve"
            @share="handleShare"
          />
        </div>

        <!-- Empty State -->
        <EmptyState
          v-else
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
import ItemCard from '@/components/common/ItemCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useItemsStore } from '@/store/items.store';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';
import { ItemModel } from '@/types/models';

const router = useRouter();
const itemsStore = useItemsStore();
const authStore = useAuthStore();
const toast = useToast();
const { t } = useI18n();

const { isAuthenticated } = storeToRefs(authStore);

const searchQuery = ref('');
const isLoading = ref(false);
const error = ref('');

const categories = [
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

const items = computed(() => {
  return itemsStore.items.slice(0, 6); // Show only first 6 items
});

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
  filters: Record<string, string | undefined>
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
