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
          <ItemCard
            v-for="item in displayedItems"
            :key="item.$id"
            :item="item"
            :categories="categories"
            @click="$router.push(`/items/${item.$id}`)"
            @reserve="handleReserve"
            @share="handleShare"
          />
        </div>

        <!-- Empty State -->
        <EmptyState
          v-else
          type="no-items"
          :title="
            selectedCategory ? 'No items in this category' : 'No items found'
          "
          :description="
            selectedCategory
              ? 'Try selecting a different category or clearing your filters.'
              : 'Be the first to share an item with the community!'
          "
          :action-text="
            isAuthenticated ? 'Add First Item' : 'Sign Up to Add Items'
          "
          @action="
            isAuthenticated
              ? $router.push('/items/new')
              : $router.push('/register')
          "
        />
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
import ItemCard from '@/components/common/ItemCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useItemsStore } from '@/store/items.store';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/composables/useToast';
import { Item } from '@/types';

const itemsStore = useItemsStore();
const authStore = useAuthStore();
const toast = useToast();

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
  try {
    await itemsStore.fetchItems({ limit: 20 });
  } catch {
    toast.error('Failed to load items. Please try again.');
  }
}

function handleReserve(item: Item) {
  if (!isAuthenticated.value) {
    toast.warning('Please sign in to reserve items', 'Authentication Required');
    return;
  }
  // TODO: Implement reservation logic
  toast.success(
    `Reservation request sent for "${item.title}"`,
    'Reservation Requested'
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
    toast.success('Link copied to clipboard!', 'Shared');
  }
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
