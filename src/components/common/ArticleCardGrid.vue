<template>
  <div
    class="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
  >
    <!-- Imagen -->
    <div
      class="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden"
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
        <PhotoIcon class="h-8 w-8" />
      </div>

      <!-- Badge de disponibilidad -->
      <div class="absolute top-2 right-2">
        <span
          v-if="item.isAvailable"
          class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full"
        >
          {{ t('itemCard.available') }}
        </span>
        <span
          v-else
          class="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full"
        >
          {{ t('itemCard.reserved') }}
        </span>
      </div>
    </div>

    <!-- Contenido -->
    <div class="p-4">
      <!-- Título y categoría -->
      <div class="mb-2">
        <h3
          class="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-tight"
        >
          {{ item.title }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ getCategoryName((item.category || 'other') as ItemCategoryModel) }}
        </p>
      </div>

      <!-- Descripción -->
      <p class="text-gray-600 dark:text-gray-300 text-xs line-clamp-2 mb-3">
        {{ item.description }}
      </p>

      <!-- Propietario y fecha -->
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ item.ownerName || 'Anónimo' }}
        </div>
        <div class="text-xs text-gray-400">
          {{ formatDate(item.$createdAt) }}
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex gap-2">
        <button
          @click="$emit('viewDetails', item)"
          class="flex-1 px-3 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          {{ t('itemCard.details') }}
        </button>

        <button
          v-if="item.isAvailable"
          @click="$emit('reserve', item)"
          class="flex-1 bg-primary-600 text-white px-3 py-2 rounded-md text-xs hover:bg-primary-700 transition-colors duration-200"
        >
          {{ t('itemCard.reserve') }}
        </button>
        <button
          v-else
          disabled
          class="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-3 py-2 rounded-md text-xs cursor-not-allowed"
        >
          {{ t('itemCard.reserved') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhotoIcon } from '@heroicons/vue/24/outline';
import { useI18n } from '@/composables/useI18n';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

interface Props {
  item: ItemModel;
  categories?: Array<{
    key: ItemCategoryModel;
    name: string;
    icon?: unknown;
  }>;
}

const props = defineProps<Props>();

const _emit = defineEmits<{
  viewDetails: [item: ItemModel];
  reserve: [item: ItemModel];
  share: [item: ItemModel];
}>();

const { t } = useI18n();

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}

function getCategoryName(category: ItemCategoryModel): string {
  const categoryData = props.categories?.find((c) => c.key === category);
  return categoryData?.name || t(`items.categories.${category}`);
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return t('common.today');
  } else if (diffInDays === 1) {
    return t('common.yesterday');
  } else if (diffInDays < 7) {
    return t('common.daysAgo', { days: diffInDays });
  } else {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
