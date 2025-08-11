<template>
  <div
    class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
    :class="{ 'cursor-pointer': clickable }"
    @click="handleClick"
  >
    <!-- Image Container -->
    <div
      class="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700"
    >
      <img
        v-if="item.imageUrls?.[0]"
        :src="item.imageUrls[0]"
        :alt="item.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        @error="handleImageError"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
      >
        <PhotoIcon class="h-16 w-16" />
      </div>

      <!-- Status Badge -->
      <div class="absolute top-3 left-3">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm"
          :class="statusClasses"
        >
          <span
            class="w-2 h-2 rounded-full mr-1.5"
            :class="statusDotClasses"
          ></span>
          {{ statusText }}
        </span>
      </div>

      <!-- Favorite Button -->
      <button
        v-if="showFavorite"
        @click.stop="toggleFavorite"
        class="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 opacity-0 group-hover:opacity-100"
        :class="{ 'opacity-100': isFavorite }"
      >
        <HeartIcon
          class="h-5 w-5 transition-colors duration-200"
          :class="
            isFavorite
              ? 'text-red-500 fill-current'
              : 'text-gray-600 dark:text-gray-400'
          "
        />
      </button>

      <!-- Quick Actions -->
      <div
        v-if="showQuickActions"
        class="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <button
          v-if="item.isAvailable"
          @click.stop="$emit('reserve', item)"
          class="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors duration-200 shadow-lg"
          title="Reserve Item"
        >
          <CalendarIcon class="h-4 w-4" />
        </button>
        <button
          @click.stop="$emit('share', item)"
          class="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors duration-200 shadow-lg"
          title="Share Item"
        >
          <ShareIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Title and Category -->
      <div class="mb-3">
        <h3
          class="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200"
        >
          {{ item.title }}
        </h3>
        <span
          class="inline-block bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-xs font-medium px-2.5 py-0.5 rounded-full"
        >
          {{ getCategoryName(item.category ?? '') }}
        </span>
      </div>

      <!-- Description -->
      <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
        {{ item.description }}
      </p>

      <!-- Owner Info -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-2">
          <div
            class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center"
          >
            <UserIcon class="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ item.ownerName || 'Anonymous' }}
          </span>
        </div>
        <div
          v-if="showDistance"
          class="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400"
        >
          <MapPinIcon class="h-4 w-4" />
          <span>{{ formatDistance(item.distance) }}</span>
        </div>
      </div>

      <!-- Rating and Reviews -->
      <div v-if="showRating" class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-1">
          <div class="flex items-center">
            <StarIcon
              v-for="i in 5"
              :key="i"
              class="h-4 w-4"
              :class="
                i <= (item.rating || 0)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              "
            />
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-400 ml-1">
            ({{ item.reviewCount || 0 }})
          </span>
        </div>
      </div>

      <!-- Tags -->
      <div
        v-if="item.tags && item.tags.length > 0"
        class="flex flex-wrap gap-1 mb-3"
      >
        <span
          v-for="tag in item.tags.slice(0, 3)"
          :key="tag"
          class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded"
        >
          {{ tag }}
        </span>
        <span
          v-if="item.tags.length > 3"
          class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded"
        >
          +{{ item.tags.length - 3 }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div v-if="showActions" class="flex space-x-2">
        <button
          v-if="item.isAvailable"
          @click.stop="$emit('reserve', item)"
          class="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
        >
          Reserve
        </button>
        <button
          v-else
          disabled
          class="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed text-sm font-medium"
        >
          Not Available
        </button>
        <button
          @click.stop="$emit('viewDetails', item)"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
        >
          Details
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center"
    >
      <BaseLoader size="md" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  PhotoIcon,
  HeartIcon,
  CalendarIcon,
  ShareIcon,
  UserIcon,
  MapPinIcon,
  StarIcon,
} from '@heroicons/vue/24/outline';
import BaseLoader from './BaseLoader.vue';
import type { ItemCardPropsModel, ItemCardEmitsModel } from '@/types/models';

interface Props extends ItemCardPropsModel {}

interface Emits extends ItemCardEmitsModel {}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  showFavorite: true,
  showQuickActions: true,
  showDistance: false,
  showRating: false,
  showActions: false,
  loading: false,
  categories: () => [],
  isFavorite: false,
});

const emit = defineEmits<Emits>();

const statusClasses = computed(() => {
  return props.item.isAvailable
    ? 'bg-green-100/90 text-green-800 dark:bg-green-900/50 dark:text-green-300'
    : 'bg-red-100/90 text-red-800 dark:bg-red-900/50 dark:text-red-300';
});

const statusDotClasses = computed(() => {
  return props.item.isAvailable ? 'bg-green-500' : 'bg-red-500';
});

const statusText = computed(() => {
  return props.item.isAvailable ? 'Available' : 'Borrowed';
});

function getCategoryName(categoryKey: string): string {
  const category = props.categories.find((c) => c.key === categoryKey);
  return category?.name || categoryKey;
}

function formatDistance(distance?: number): string {
  if (!distance) return '';
  return distance < 1
    ? `${Math.round(distance * 1000)}m`
    : `${distance.toFixed(1)}km`;
}

function handleClick() {
  if (props.clickable && !props.loading) {
    emit('click', props.item);
  }
}

function toggleFavorite() {
  emit('toggleFavorite', props.item);
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
