<template>
  <BaseModal
    :is-open="isOpen"
    @close="onClose"
    :size="size"
    aria-label="Detalle del artículo"
  >
    <ArticleDetailView
      v-if="item"
      :item="item"
      :categories="categories"
      @reserve="$emit('reserve', item)"
      @share="$emit('share', item)"
      @contact="$emit('contact', item)"
    />
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue';
import ArticleDetailView from '@/components/common/ArticleDetailView.vue';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

const { isOpen, item, size, categories } = defineProps<{
  isOpen: boolean;
  item: ItemModel | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  categories?: Array<{ key: ItemCategoryModel; name: string; icon?: unknown }>;
}>();

const emit = defineEmits(['close', 'reserve', 'share', 'contact'] as const);

function onClose() {
  emit('close');
}
</script>
