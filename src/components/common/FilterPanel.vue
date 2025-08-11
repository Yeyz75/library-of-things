<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
  >
    <!-- Header -->
    <div
      class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
        Filters
      </h3>
      <div class="flex items-center space-x-2">
        <span
          v-if="activeFiltersCount > 0"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300"
        >
          {{ activeFiltersCount }} active
        </span>
        <button
          @click="clearAllFilters"
          class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
        >
          Clear all
        </button>
      </div>
    </div>

    <!-- Filter Content -->
    <div class="p-4 space-y-6">
      <!-- Category Filter -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
        >
          Category
        </label>
        <div class="space-y-2">
          <label
            v-for="category in categories"
            :key="category.key"
            class="flex items-center cursor-pointer group"
          >
            <input
              v-model="localFilters.categories"
              :value="category.key"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded transition-colors duration-200"
            />
            <span
              class="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200"
            >
              {{ category.name }}
            </span>
            <span
              v-if="category.count"
              class="ml-auto text-xs text-gray-500 dark:text-gray-400"
            >
              ({{ category.count }})
            </span>
          </label>
        </div>
      </div>

      <!-- Availability Filter -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
        >
          Availability
        </label>
        <div class="space-y-2">
          <label class="flex items-center cursor-pointer group">
            <input
              v-model="localFilters.availableOnly"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded transition-colors duration-200"
            />
            <span
              class="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200"
            >
              Available only
            </span>
          </label>
        </div>
      </div>

      <!-- Distance Filter -->
      <div v-if="showLocationFilter">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
        >
          Distance
        </label>
        <div class="space-y-3">
          <div class="flex items-center space-x-3">
            <input
              v-model="localFilters.maxDistance"
              type="range"
              min="1"
              max="50"
              step="1"
              class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">
              {{ localFilters.maxDistance }}km
            </span>
          </div>
          <div
            class="flex justify-between text-xs text-gray-500 dark:text-gray-400"
          >
            <span>1km</span>
            <span>50km</span>
          </div>
        </div>
      </div>

      <!-- Rating Filter -->
      <div v-if="showRatingFilter">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
        >
          Minimum Rating
        </label>
        <div class="space-y-2">
          <div
            v-for="rating in [4, 3, 2, 1]"
            :key="rating"
            class="flex items-center cursor-pointer group"
          >
            <input
              v-model="localFilters.minRating"
              :value="rating"
              type="radio"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 transition-colors duration-200"
            />
            <div class="ml-3 flex items-center">
              <div class="flex items-center">
                <StarIcon
                  v-for="i in 5"
                  :key="i"
                  class="h-4 w-4"
                  :class="
                    i <= rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 dark:text-gray-600'
                  "
                />
              </div>
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                & up
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div v-if="showDateFilter">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
        >
          Available From
        </label>
        <div class="space-y-3">
          <input
            v-model="localFilters.availableFrom"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          />
          <input
            v-model="localFilters.availableTo"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          />
        </div>
      </div>

      <!-- Tags Filter -->
      <div v-if="showTagsFilter && availableTags.length > 0">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
        >
          Tags
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in availableTags.slice(
              0,
              showAllTags ? availableTags.length : 10
            )"
            :key="tag.name"
            @click="toggleTag(tag.name)"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200"
            :class="
              (localFilters.tags || []).includes(tag.name)
                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
            "
          >
            {{ tag.name }}
            <span class="ml-1 text-xs opacity-75">({{ tag.count }})</span>
          </button>
          <button
            v-if="availableTags.length > 10"
            @click="showAllTags = !showAllTags"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            {{
              showAllTags ? 'Show less' : `+${availableTags.length - 10} more`
            }}
          </button>
        </div>
      </div>

      <!-- Sort Options -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
        >
          Sort by
        </label>
        <select
          v-model="localFilters.sortBy"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
          <option value="distance" v-if="showLocationFilter">Distance</option>
          <option value="rating" v-if="showRatingFilter">Rating</option>
        </select>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center"
    >
      <button
        @click="resetFilters"
        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
      >
        Reset to defaults
      </button>
      <button
        @click="applyFilters"
        class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
      >
        Apply Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { StarIcon } from '@heroicons/vue/24/solid';
import { FilterOptions } from '@/types';
import type { FilterPanelPropsModel, FilterPanelEmitsModel } from '@/types';

interface Props extends FilterPanelPropsModel {}

interface Emits extends FilterPanelEmitsModel {}

const props = withDefaults(defineProps<Props>(), {
  availableTags: () => [],
  showLocationFilter: true,
  showRatingFilter: true,
  showDateFilter: true,
  showTagsFilter: true,
});

const emit = defineEmits<Emits>();

const localFilters = ref<FilterOptions>({ ...props.filters });
const showAllTags = ref(false);

const activeFiltersCount = computed(() => {
  let count = 0;
  if ((localFilters.value.categories ?? []).length > 0) count++;
  if (localFilters.value.availableOnly) count++;
  if ((localFilters.value.maxDistance ?? 0) < 50) count++;
  if (localFilters.value.minRating !== null) count++;
  if (localFilters.value.availableFrom) count++;
  if (localFilters.value.availableTo) count++;
  if ((localFilters.value.tags ?? []).length > 0) count++;
  if (localFilters.value.sortBy !== 'newest') count++;
  return count;
});

watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);

watch(
  localFilters,
  (newFilters) => {
    emit('update:filters', { ...newFilters });
  },
  { deep: true }
);

function toggleTag(tagName: string) {
  // Asegura que tags siempre sea un array antes de operar sobre él
  if (!localFilters.value.tags) {
    localFilters.value.tags = [];
  }
  const index = localFilters.value.tags.indexOf(tagName);
  if (index > -1) {
    localFilters.value.tags.splice(index, 1);
  } else {
    localFilters.value.tags.push(tagName);
  }
}

function clearAllFilters() {
  localFilters.value = {
    categories: [],
    availableOnly: false,
    maxDistance: 50,
    minRating: null,
    availableFrom: '',
    availableTo: '',
    tags: [],
    sortBy: 'newest',
  };
}

function resetFilters() {
  clearAllFilters();
}

function applyFilters() {
  emit('apply-filters', { ...localFilters.value });
}
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
