<template>
  <BaseModal
    :is-open="isOpen"
    @close="onClose"
    :size="size"
    aria-label="Detalle del artículo"
  >
    <!-- Use BaseModal header slot if needed; BaseModal already renders a close button -->
    <template #header>
      <div class="flex-1">
        <!-- Intentionally empty: title is handled by ArticleDetailView or BaseModal -->
      </div>
    </template>

    <ArticleDetailView
      v-if="item"
      class="relative"
      :item="item"
      :categories="categories"
      @reserve="$emit('reserve', item)"
      @share="$emit('share', item)"
      @contact="$emit('contact', item)"
    >
      <!-- Spinner overlay while loading (centered) -->
      <template v-if="isLoading">
        <div class="detail-spinner-overlay" role="status" aria-live="polite">
          <svg
            class="h-12 w-12 text-white animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        </div>
      </template>
    </ArticleDetailView>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue';
import ArticleDetailView from '@/components/common/ArticleDetailView.vue';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

const { isOpen, item, size, categories, isLoading } = defineProps<{
  isOpen: boolean;
  item: ItemModel | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  categories?: Array<{ key: ItemCategoryModel; name: string; icon?: unknown }>;
  isLoading?: boolean;
}>();

const emit = defineEmits(['close', 'reserve', 'share', 'contact'] as const);

function onClose() {
  emit('close');
}
</script>

<style scoped>
.detail-spinner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 60;
}
</style>
