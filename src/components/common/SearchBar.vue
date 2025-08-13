<template>
  <div class="relative">
    <div class="relative group">
      <!-- Search icon -->
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>

      <!-- Input field -->
      <input
        ref="searchInput"
        v-model="localQuery"
        type="text"
        :placeholder="placeholder"
        class="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
        @input="handleInput"
        @keydown.enter="handleSearch"
      />

      <!-- Clear button -->
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <button
          v-if="localQuery"
          @click="clearSearch"
          class="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Recent Searches Dropdown -->
    <div
      v-if="showDropdown && recentSearches.length > 0"
      class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
    >
      <div class="p-2">
        <div class="flex items-center justify-between mb-2 px-2">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
            Recent Searches
          </span>
          <button
            class="text-xs text-red-500 hover:underline"
            @click="clearAllRecentSearches"
          >
            Clear All
          </button>
        </div>
        <div
          v-for="(search, index) in recentSearches.slice(0, 5)"
          :key="index"
          class="flex items-center justify-between px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded group"
        >
          <button
            class="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 flex items-center"
            @click="selectRecentSearch(search)"
          >
            <ClockIcon class="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            {{ search }}
          </button>
          <button
            class="ml-2 text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            @click="removeRecentSearch(index)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  modelValue?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search...',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [query: string];
}>();

const searchInput = ref<HTMLInputElement>();
const localQuery = ref(props.modelValue);
const showDropdown = ref(false);
const recentSearches = ref<string[]>([]);

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    localQuery.value = newValue;
  }
);

// Watch for local changes with debounce
watch(localQuery, (newValue) => {
  emit('update:modelValue', newValue);

  // Clear previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set new timer for auto-search
  debounceTimer = setTimeout(() => {
    if (newValue.trim()) {
      performSearch();
    }
  }, 500);
});

function handleInput() {
  showDropdown.value = true;
}

function handleSearch() {
  showDropdown.value = false;
  performSearch();
}

function performSearch() {
  const query = localQuery.value.trim();
  if (query) {
    addToRecentSearches(query);
    emit('search', query);
  }
}

function clearSearch() {
  localQuery.value = '';
  showDropdown.value = false;
  searchInput.value?.focus();
  emit('search', '');
}

function selectRecentSearch(search: string) {
  localQuery.value = search;
  showDropdown.value = false;
  performSearch();
}

function removeRecentSearch(index: number) {
  recentSearches.value.splice(index, 1);
  saveRecentSearches();
}

function clearAllRecentSearches() {
  recentSearches.value = [];
  saveRecentSearches();
}

function addToRecentSearches(query: string) {
  const searches = recentSearches.value.filter((search) => search !== query);
  searches.unshift(query);
  recentSearches.value = searches.slice(0, 10);
  saveRecentSearches();
}

function saveRecentSearches() {
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value));
}

function loadRecentSearches() {
  try {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      recentSearches.value = JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load recent searches:', error);
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Element;
  if (!target.closest('.relative')) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  loadRecentSearches();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
