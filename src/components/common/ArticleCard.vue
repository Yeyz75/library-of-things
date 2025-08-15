<template>
  <div
    class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
  >
    <div class="grid grid-cols-1 md:grid-cols-3">
      <div
        class="relative md:col-span-1 aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden"
      >
        <img
          v-if="item.imageUrls?.[0]"
          :src="item.imageUrls[0]"
          :alt="item.title"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
        >
          <PhotoIcon class="h-12 w-12" />
        </div>
      </div>

      <div class="p-4 md:col-span-2">
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <h3
              class="font-semibold text-gray-900 dark:text-gray-100 text-lg line-clamp-2"
            >
              {{ item.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ getCategoryName(item.category) }}
            </p>
          </div>

          <div class="text-right">
            <div class="text-sm text-gray-600 dark:text-gray-300">
              {{ item.ownerName || 'Anonymous' }}
            </div>
            <div class="text-xs text-gray-400">
              {{ formatDate(item.$createdAt) }}
            </div>
          </div>
        </div>

        <p class="text-gray-600 dark:text-gray-300 text-sm mt-3 line-clamp-3">
          {{ item.description }}
        </p>

        <div class="mt-4 flex items-center gap-2">
          <button
            @click="toggleExpand"
            class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {{ expanded ? t('common.hide') : t('common.viewMore') }}
          </button>

          <button
            v-if="item.isAvailable"
            @click="_emit('reserve', item)"
            class="ml-auto bg-primary-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            {{ t('itemCard.reserve') }}
          </button>
        </div>

        <transition name="fade">
          <div
            v-show="expanded"
            class="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 text-sm text-gray-700 dark:text-gray-300"
          >
            <p class="mb-2">{{ item.description }}</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in item.tags || []"
                :key="tag"
                class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                >{{ tag }}</span
              >
            </div>

            <div class="mt-4 flex items-center gap-2">
              <button
                @click="_emit('share', item)"
                class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
              >
                {{ t('itemCard.share') }}
              </button>
              <button
                @click="_emit('viewDetails', item)"
                class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
              >
                {{ t('itemCard.details') }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { PhotoIcon } from '@heroicons/vue/24/outline';
import type { ItemModel } from '@/types/models';

const { t } = useI18n();

const props = defineProps<{
  item: ItemModel;
  categories?: Array<{
    key: import('@/types/models').ItemCategoryModel | string;
    name: string;
  }>;
}>();

// Emit events: reserve(item), share(item), viewDetails(item)
const _emit = defineEmits(['reserve', 'share', 'viewDetails'] as const);

const expanded = ref(false);

function toggleExpand() {
  expanded.value = !expanded.value;
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}

function getCategoryName(key?: string) {
  const cat = (props.categories || []).find((c) => c.key === key);
  return cat?.name || key || '';
}

function formatDate(d: string | undefined) {
  if (!d) return '';
  try {
    const date = new Date(d);
    return date.toLocaleDateString();
  } catch {
    return d as string;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
