<template>
  <div class="relative" v-click-outside="closeDropdown">
    <div class="relative">
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
        @input="handleInput"
        @focus="showDropdown = true"
        @keydown="handleKeydown"
      />
      <div class="absolute inset-y-0 right-0 flex items-center">
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
        <button
          @click="toggleFilters"
          class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          :class="{ 'text-primary-600 dark:text-primary-400': showFilters }"
        >
          <AdjustmentsHorizontalIcon class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Search Suggestions Dropdown -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="
          showDropdown && (suggestions.length > 0 || recentSearches.length > 0)
        "
        class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
      >
        <!-- Recent Searches -->
        <div v-if="!searchQuery && recentSearches.length > 0" class="p-2">
          <div
            class="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1"
          >
            Recent Searches
          </div>
          <button
            v-for="(search, index) in recentSearches.slice(0, 5)"
            :key="`recent-${index}`"
            @click="selectSuggestion(search)"
            class="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
          >
            <ClockIcon class="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            {{ search }}
          </button>
        </div>

        <!-- Search Suggestions -->
        <div v-if="suggestions.length > 0" class="p-2">
          <div
            v-if="!searchQuery && recentSearches.length > 0"
            class="border-t border-gray-200 dark:border-gray-700 my-2"
          ></div>
          <div
            v-if="searchQuery"
            class="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1"
          >
            Suggestions
          </div>
          <button
            v-for="(suggestion, index) in suggestions"
            :key="`suggestion-${index}`"
            @click="selectSuggestion(suggestion)"
            class="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
            :class="{ 'bg-gray-100 dark:bg-gray-700': index === selectedIndex }"
          >
            <MagnifyingGlassIcon
              class="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500"
            />
            {{ suggestion }}
          </button>
        </div>
      </div>
    </transition>

    <!-- Advanced Filters -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showFilters"
        class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Category Filter -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Category
            </label>
            <select
              v-model="filters.category"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

          <!-- Availability Filter -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Availability
            </label>
            <select
              v-model="filters.availability"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Items</option>
              <option value="available">Available Only</option>
              <option value="borrowed">Borrowed Only</option>
            </select>
          </div>

          <!-- Location Filter -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Distance
            </label>
            <select
              v-model="filters.distance"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Any Distance</option>
              <option value="1">Within 1 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
            </select>
          </div>
        </div>

        <div
          class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            @click="clearFilters"
            class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear Filters
          </button>
          <div class="space-x-2">
            <button
              @click="showFilters = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              @click="applyFilters"
              class="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';
import type { SearchBarSearchFiltersModel, SearchBarPropsModel } from '@/types';

interface SearchFilters extends SearchBarSearchFiltersModel {}

interface Props extends SearchBarPropsModel {}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search items...',
  categories: () => [],
  suggestions: () => [],
  modelValue: '',
});

const emit = defineEmits<{
  (
    _e: 'search',
    _query: string,
    _filters: Record<string, string | undefined>
  ): void;
  (_e: 'update:modelValue', _value: string): void;
}>();

const searchInput = ref<HTMLInputElement>();
const searchQuery = ref(props.modelValue);
const showDropdown = ref(false);
const showFilters = ref(false);
const selectedIndex = ref(-1);
const recentSearches = ref<string[]>([]);

const filters = ref<SearchFilters>({
  category: '',
  availability: '',
  distance: '',
});

const suggestions = computed(() => {
  if (!searchQuery.value) return [];
  return props.suggestions
    .filter((suggestion) =>
      suggestion.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    .slice(0, 5);
});

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue;
  }
);

function handleInput() {
  selectedIndex.value = -1;
  showDropdown.value = true;
}

function handleKeydown(event: KeyboardEvent) {
  if (!showDropdown.value) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(
        selectedIndex.value + 1,
        suggestions.value.length - 1
      );
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (selectedIndex.value >= 0) {
        selectSuggestion(suggestions.value[selectedIndex.value]);
      } else {
        performSearch();
      }
      break;
    case 'Escape':
      closeDropdown();
      break;
  }
}

function selectSuggestion(suggestion: string) {
  searchQuery.value = suggestion;
  closeDropdown();
  performSearch();
}

function closeDropdown() {
  showDropdown.value = false;
  selectedIndex.value = -1;
}

function toggleFilters() {
  showFilters.value = !showFilters.value;
  if (showFilters.value) {
    showDropdown.value = false;
  }
}

function clearSearch() {
  searchQuery.value = '';
  searchInput.value?.focus();
  performSearch();
}

function clearFilters() {
  filters.value = {
    category: '',
    availability: '',
    distance: '',
  };
}

function applyFilters() {
  showFilters.value = false;
  performSearch();
}

function performSearch() {
  if (searchQuery.value.trim()) {
    addToRecentSearches(searchQuery.value.trim());
  }
  emit('search', searchQuery.value, { ...filters.value });
}

function addToRecentSearches(query: string) {
  const searches = recentSearches.value.filter((search) => search !== query);
  searches.unshift(query);
  recentSearches.value = searches.slice(0, 10);
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value));
}

onMounted(() => {
  const saved = localStorage.getItem('recentSearches');
  if (saved) {
    try {
      recentSearches.value = JSON.parse(saved);
    } catch {
      console.warn('Failed to parse recent searches from localStorage');
    }
  }
});
</script>
