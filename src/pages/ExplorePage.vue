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
              v-for="suggestion in recentSearches"
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
          <div v-if="loading" class="text-center py-12">
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
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { useItems } from '@/composables/useItems';
// also grab the composable loader so ExplorePage initializes the same data
const {
  items,
  error,
  searchItems,
  loading,
  loadItems: loadItemsComposable,
} = useItems();
import { ref, computed, onMounted, watch } from 'vue';
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
import ExploreLayout from '@/components/layout/ExploreLayout.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import ArticleCardGrid from '@/components/common/ArticleCardGrid.vue';
import EmptyState from '@/components/common/EmptyState.vue';
// note: we rely on the composable for loading items on this page
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';
import { ItemModel, ItemCategoryModel } from '@/types/models';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const { t } = useI18n();

const { isAuthenticated } = storeToRefs(authStore);

// UI state for sidebar selection
const selectedCategory = ref<ItemCategoryModel | null>(null);
const itemsToShow = ref(12); // Control cuántos artículos mostrar
// Search query bound to SearchBar and synced with route `search` query param

const searchQuery = ref<string>(
  (router.currentRoute.value.query.search as string) || ''
);
// Búsquedas recientes (solo las 2 últimas)
const recentSearches = ref<string[]>([]);
watch(searchQuery, (val) => {
  if (val && val.trim()) {
    const idx = recentSearches.value.indexOf(val);
    if (idx !== -1) recentSearches.value.splice(idx, 1);
    recentSearches.value.unshift(val);
    recentSearches.value = recentSearches.value.slice(0, 2);
  }
});

// Sorted items (most recent first) and filtered by selectedCategory

const filteredItems = computed(() => {
  if (!selectedCategory.value) return items.value;
  return items.value.filter((it) => it.category === selectedCategory.value);
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
  { key: 'tools', name: 'Herramientas', icon: WrenchScrewdriverIcon },
  { key: 'electronics', name: 'Electrónicos', icon: ComputerDesktopIcon },
  { key: 'books', name: 'Libros', icon: BookOpenIcon },
  { key: 'sports', name: 'Deportes', icon: PlayIcon },
  { key: 'home', name: 'Hogar', icon: HomeIcon },
  { key: 'garden', name: 'Jardín', icon: BeakerIcon },
  { key: 'clothing', name: 'Ropa', icon: SparklesIcon },
  { key: 'games', name: 'Juegos', icon: PlayIcon },
  { key: 'other', name: 'Otros', icon: EllipsisHorizontalIcon },
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

async function loadItems() {
  try {
    // Delegate loading to the composable so `items` ref used in this page
    // is populated consistently (fixes initial empty state on reload)
    await loadItemsComposable();
  } catch (err) {
    console.error('Error loading items:', err);
    toast.error(t('home.items.error'), t('common.error'));
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
  // Actualizar el query param en la URL
  const queryParams: Record<string, string> = {};
  if (query) queryParams.search = query;
  if (filters && typeof filters === 'object') {
    Object.keys(filters).forEach((key) => {
      if (filters[key]) queryParams[key] = filters[key] as string;
    });
  }
  router.replace({
    path: router.currentRoute.value.path,
    query: queryParams,
  });
  // Ejecutar búsqueda remota
  searchItems(query);
}

function selectQuickSearch(suggestion: string) {
  searchQuery.value = suggestion;
  handleSearch(suggestion, {});
}

function selectCategory(key: ItemCategoryModel) {
  selectedCategory.value = key === selectedCategory.value ? null : key;
}

// Navigate to item details page
function viewDetails(item: ItemModel) {
  if (!item || !item.$id) return;
  router.push({ path: `/items/${item.$id}` });
}

onMounted(async () => {
  await loadItems();
});

// Keep route query `search` in sync when the user types or clears the search
watch(
  () => searchQuery.value,
  (val) => {
    const rawQuery = router.currentRoute.value.query || {};
    const current: Record<string, string | undefined> = {};
    Object.entries(rawQuery).forEach(([k, v]) => {
      if (v == null) {
        current[k] = undefined;
      } else if (Array.isArray(v)) {
        current[k] = String(v[0]);
      } else {
        current[k] = String(v);
      }
    });

    const q: Record<string, string | undefined> = val
      ? { ...current, search: val }
      : { ...current };
    if (!val) delete q.search;
    // Use replace() to avoid creating history entries on every keystroke
    router.replace({
      path: router.currentRoute.value.path,
      query: q as Record<string, string>,
    });
  }
);

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
