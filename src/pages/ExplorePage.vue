<template>
  <AppLayout>
    <div class="container py-6">
      <!-- Header más compacto -->
      <div class="text-center mb-8">
        <div class="max-w-3xl mx-auto">
          <h1
            class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 font-display"
          >
            {{ t('browseItems.title') }}
          </h1>
          <p
            class="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed"
          >
            {{ t('home.categories.subtitle') }}
          </p>

          <!-- Barra de búsqueda más compacta -->
          <div class="relative max-w-md mx-auto mb-4">
            <SearchBar
              v-model="searchQuery"
              :categories="categories"
              :suggestions="searchSuggestions"
              :placeholder="t('search.placeholder')"
              @search="handleSearch"
              class="shadow-sm"
            />
          </div>

          <!-- Búsquedas rápidas más pequeñas -->
          <div class="flex flex-wrap gap-2 justify-center">
            <span class="text-sm text-gray-500 dark:text-gray-400 mr-2"
              >{{ t('search.quickSearch') }}:</span
            >
            <button
              v-for="suggestion in popularSearches.slice(0, 4)"
              :key="suggestion"
              @click="selectQuickSearch(suggestion)"
              class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- Layout principal -->
      <ExploreLayout
        :categories="categories"
        :title="getMainTitle()"
        :subtitle="getMainSubtitle()"
        :selected="selectedCategory"
        @select-category="selectCategory"
      >
        <template #default>
          <!-- Loading -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="relative inline-block">
              <div
                class="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"
              ></div>
            </div>
            <p
              class="text-base font-medium text-gray-600 dark:text-gray-400 mt-4"
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

          <!-- Items grid -->
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

            <!-- Grid de artículos más compacto -->
            <div v-else>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <ArticleCardGrid
                  v-for="item in visibleItems"
                  :key="item.$id"
                  :item="item"
                  :categories="categories"
                  @viewDetails="viewDetails"
                  @reserve="handleReserve"
                  @share="handleShare"
                />
              </div>

              <!-- Mostrar más artículos si hay -->
              <div
                v-if="filteredItems.length > visibleItems.length"
                class="text-center mt-8"
              >
                <button
                  @click="loadMoreItems"
                  class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  {{ t('common.loadMore') }}
                  <span class="ml-2 text-sm">
                    ({{ filteredItems.length - visibleItems.length }} más)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </ExploreLayout>
      <!-- Item detail modal -->
      <ItemDetailModal
        :is-open="isDetailModalOpen"
        :item="selectedItem"
        :is-loading="isDetailLoading"
        :categories="categories"
        @close="closeDetailModal"
        @reserve="handleReserve"
        @share="handleShare"
      />
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
import ArticleCardGrid from '@/components/common/ArticleCardGrid.vue';
import ItemDetailModal from '@/components/modals/ItemDetailModal.vue';
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
const selectedItem = ref<ItemModel | null>(null);
const isDetailModalOpen = ref(false);
const isDetailLoading = ref(false);
const isLoading = ref(false);
const error = ref('');

// UI state for sidebar selection
const selectedCategory = ref<ItemCategoryModel | null>(null);
const itemsToShow = ref(12); // Control cuántos artículos mostrar

// Sorted items (most recent first) and filtered by selectedCategory
const sortedItems = computed(() => {
  // Use the same logic as HomePage - direct access to store
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
const visibleItems = computed(() =>
  filteredItems.value.slice(0, itemsToShow.value)
);

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
    // Use the same logic as HomePage
    await itemsStore.fetchItems({ limit: 24 });
  } catch (err) {
    console.error('Error loading items:', err);
    error.value = t('home.items.error');
    toast.error(t('home.items.error'), t('common.error'));
  } finally {
    isLoading.value = false;
  }
}

function getMainTitle(): string {
  if (selectedCategory.value) {
    const category = categories.find((c) => c.key === selectedCategory.value);
    return category?.name || t('home.items.title');
  }
  return t('home.items.title');
}

function getMainSubtitle(): string {
  if (selectedCategory.value) {
    return t('home.items.categorySubtitle');
  }
  return t('home.items.subtitle');
}

function loadMoreItems() {
  itemsToShow.value += 12;
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
  // Open modal and update URL so deep link works
  selectedItem.value = item;
  isDetailModalOpen.value = true;
  router.push({
    query: {
      ...router.currentRoute.value.query,
      itemId: item.$id,
      modal: 'true',
    },
  });
}

// Close handler for modal
function closeDetailModal() {
  isDetailModalOpen.value = false;
  selectedItem.value = null;
  // remove modal query param - replace so it doesn't add history
  const newQuery = { ...router.currentRoute.value.query } as Record<
    string,
    string
  >;
  delete newQuery.modal;
  router.replace({ path: router.currentRoute.value.path, query: newQuery });
}

// Open modal on deep link (/items/:id?modal=true)
onMounted(async () => {
  await loadItems();
  const { query } = router.currentRoute.value;
  if (query.itemId && query.modal === 'true') {
    const id = query.itemId as string;
    isDetailLoading.value = true;
    try {
      // try to get item from already loaded items
      let it: ItemModel | null | undefined = itemsStore.items.find(
        (i) => i.$id === id
      );
      if (!it) {
        // fetch single item
        const fetched = await itemsStore.getItemById(id);
        it = fetched ?? undefined;
      }
      if (it) {
        selectedItem.value = it;
        isDetailModalOpen.value = true;
      }
    } finally {
      isDetailLoading.value = false;
    }
  }
});

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

// (removed duplicate onMounted)
</script>
