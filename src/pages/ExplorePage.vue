<template>
  <AppLayout>
    <div class="container py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {{ t('browseItems.title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('home.categories.subtitle') }}
        </p>
      </div>

      <!-- Categories Section -->
      <div class="mb-12">
        <h2
          class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6"
        >
          {{ t('home.categories.title') }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <router-link
            v-for="category in categories"
            :key="category.key"
            :to="`/search?category=${category.key}`"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
          >
            <div class="text-center">
              <div
                class="bg-gray-100 dark:bg-gray-700 rounded-full p-3 mb-3 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 transition-colors w-12 h-12 mx-auto flex items-center justify-center"
              >
                <component
                  :is="category.icon"
                  class="h-6 w-6 mx-auto text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                />
              </div>
              <h3
                class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
              >
                {{ t(`items.categories.${category.key}`) }}
              </h3>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Search Section -->
      <div class="mb-12">
        <h2
          class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6"
        >
          {{ t('search.title') }}
        </h2>
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <SearchBar
            v-model="searchQuery"
            :categories="categories"
            :suggestions="searchSuggestions"
            :placeholder="t('search.placeholder')"
            @search="handleSearch"
          />
        </div>
      </div>

      <!-- Recent Items -->
      <div>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {{ t('home.items.title') }}
          </h2>
          <router-link
            to="/search"
            class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
          >
            {{ t('home.featuredItems.browseAll') }}
          </router-link>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <BaseLoader size="lg" :text="t('home.items.loading')" />
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

        <!-- Items Grid -->
        <div
          v-else-if="items.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
import BaseLoader from '@/components/common/BaseLoader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useItemsStore } from '@/store/items.store';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';
import { Item } from '@/types';

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

function handleReserve(item: Item) {
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

function handleShare(item: Item) {
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
