<template>
  <AppLayout>
    <ItemDetailModal
      :is-open="isOpen"
      :item-id="String(route.params.id)"
      :categories="categoryOptions"
      @close="handleClose"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import ItemDetailModal from '@/components/modals/ItemDetailModal.vue';
import type { ItemCategoryModel } from '@/types/models';

const route = useRoute();
const router = useRouter();

const isOpen = ref(true);

const categoryOptions = computed(() => [
  { key: 'tools' as ItemCategoryModel, name: 'Herramientas' },
  { key: 'electronics' as ItemCategoryModel, name: 'Electrónicos' },
  { key: 'books' as ItemCategoryModel, name: 'Libros' },
  { key: 'sports' as ItemCategoryModel, name: 'Deportes y Recreación' },
  { key: 'home' as ItemCategoryModel, name: 'Hogar y Cocina' },
  { key: 'garden' as ItemCategoryModel, name: 'Jardín y Exterior' },
  { key: 'clothing' as ItemCategoryModel, name: 'Ropa y Accesorios' },
  { key: 'games' as ItemCategoryModel, name: 'Juegos y Juguetes' },
  { key: 'other' as ItemCategoryModel, name: 'Otros' },
]);

function handleClose() {
  isOpen.value = false;
  // Navigate back if possible, otherwise to home
  if (window.history.length > 1) router.back();
  else router.push('/');
}

onMounted(() => {
  isOpen.value = true;
});
</script>
