<template>
  <section
    ref="featuredItemsSectionRef"
    class="animated-section py-16 bg-white dark:bg-gray-950"
    v-motion
    :initial="{ opacity: 0, y: 60 }"
    :enter="{
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.1 },
    }"
  >
    <div class="container">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {{ t('home.featuredItems.title') }}
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-300">
          {{ t('home.featuredItems.subtitle') }}
        </p>
      </div>
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <BaseLoader size="lg" :text="t('home.items.loading')" />
      </div>
      <!-- Featured Items Grid -->
      <div
        v-else-if="featuredItems.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
      >
        <ItemCard
          v-for="(item, idx) in featuredItems"
          :key="item.$id"
          :item="item"
          :categories="categories"
          @click="$router.push(`/items/${item.$id}`)"
          @reserve="handleReserve"
          @share="handleShare"
          v-motion
          :initial="{ opacity: 0, y: 40, scale: 0.97 }"
          :enter="{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              delay: 0.2 + idx * 0.12,
              type: 'spring',
              stiffness: 70,
            },
          }"
          :hovered="{
            scale: 1.03,
            boxShadow: '0 8px 32px 0 rgba(80,80,200,0.10)',
          }"
        />
      </div>
      <!-- CTA to browse all -->
      <div class="text-center mt-12">
        <router-link to="/search" class="btn-secondary">
          {{ t('home.featuredItems.browseAll') }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion';
import type { ItemModel as Item } from '@/types/models';
import type { Ref } from 'vue';

type CategoryObj = { key: string; name: string };

const props = defineProps<{
  featuredItems: Item[];
  isLoading: boolean;
  categories: CategoryObj[];
  t: (_key: string) => string;
  handleReserve: (_item: Item) => void;
  handleShare: (_item: Item) => void;
  featuredItemsSectionRef: Ref<HTMLElement | null>;
}>();

useMotion(props.featuredItemsSectionRef);
</script>
