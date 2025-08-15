<template>
  <div
    class="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800"
  >
    <!-- Header con información básica -->
    <div class="relative">
      <!-- Imagen principal -->
      <div
        class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden max-h-56 md:max-h-[300px]"
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
          <PhotoIcon class="h-20 w-20" />
        </div>

        <!-- Overlay con badges -->
        <div class="absolute top-4 left-4 flex flex-col gap-2">
          <!-- Status badge -->
          <span
            class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-white/20"
            :class="statusClasses"
          >
            <span
              class="w-2 h-2 rounded-full mr-2"
              :class="statusDotClasses"
            ></span>
            {{ statusText }}
          </span>

          <!-- Category badge -->
          <span
            class="inline-flex items-center px-3 py-1 text-sm font-medium bg-primary-500/90 text-white rounded-full backdrop-blur-md"
          >
            {{
              getCategoryName((item.category || 'other') as ItemCategoryModel)
            }}
          </span>
        </div>

        <!-- Actions en la esquina superior derecha -->
        <div class="absolute top-4 right-4 flex gap-2">
          <button
            @click="$emit('share', item)"
            class="p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-gray-900 transition-colors duration-200 border border-white/20"
          >
            <ShareIcon class="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>

          <button
            v-if="showFavorite"
            @click="toggleFavorite"
            class="p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-gray-900 transition-colors duration-200 border border-white/20"
          >
            <HeartIcon
              class="h-5 w-5 transition-colors duration-200"
              :class="
                isFavorite
                  ? 'text-red-500 fill-current'
                  : 'text-gray-700 dark:text-gray-300'
              "
            />
          </button>
        </div>
      </div>

      <!-- Galería de miniaturas -->
      <div
        v-if="item.imageUrls && item.imageUrls.length > 1"
        class="absolute bottom-4 left-4 right-4"
      >
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="(imageUrl, index) in item.imageUrls.slice(1, 5)"
            :key="index"
            class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-white/50 hover:border-white transition-colors"
          >
            <img
              :src="imageUrl"
              :alt="`${item.title} ${index + 2}`"
              class="w-full h-full object-cover"
            />
          </button>
          <div
            v-if="item.imageUrls.length > 5"
            class="flex-shrink-0 w-12 h-12 rounded-lg bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-xs font-medium border-2 border-white/50"
          >
            +{{ item.imageUrls.length - 4 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="p-4 lg:p-6">
      <!-- Título y propietario -->
      <div class="mb-4">
        <h1
          class="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight"
        >
          {{ item.title }}
        </h1>

        <!-- Información del propietario -->
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs"
          >
            {{ getOwnerInitials(item.ownerName) }}
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ item.ownerName || 'Usuario Anónimo' }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Miembro desde {{ formatMemberSince(item.$createdAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Descripción -->
      <div class="mb-5">
        <h3 class="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Descripción
        </h3>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
          {{ item.description }}
        </p>
      </div>

      <!-- Información adicional en grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <!-- Condición -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Condición
          </h4>
          <p class="text-gray-700 dark:text-gray-300 text-sm">
            {{ item.condition || 'Buena' }}
          </p>
        </div>

        <!-- Ubicación -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Ubicación
          </h4>
          <p class="text-gray-700 dark:text-gray-300 text-sm">
            {{ item.location || 'No especificada' }}
          </p>
        </div>

        <!-- Fecha de publicación -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Publicado
          </h4>
          <p class="text-gray-700 dark:text-gray-300 text-sm">
            {{ formatDate(item.$createdAt) }}
          </p>
        </div>

        <!-- Tags -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Etiquetas
          </h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in item.tags || ['general']"
              :key="tag"
              class="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-md"
              >{{ tag }}</span
            >
          </div>
        </div>
      </div>

      <!-- Acciones principales -->
      <div class="flex flex-col sm:flex-row gap-2">
        <button
          v-if="item.isAvailable"
          @click="$emit('reserve', item)"
          class="flex-1 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform"
        >
          <CalendarIcon class="h-4 w-4 inline mr-2" />
          Solicitar Préstamo
        </button>
        <button
          v-else
          disabled
          class="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-semibold py-2 px-4 rounded-xl cursor-not-allowed"
        >
          <ClockIcon class="h-4 w-4 inline mr-2" />
          No Disponible
        </button>

        <button
          @click="$emit('contact', item)"
          class="sm:w-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-xl transition-colors duration-200"
        >
          <ChatBubbleLeftIcon class="h-4 w-4 inline mr-2" />
          Contactar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  PhotoIcon,
  ShareIcon,
  HeartIcon,
  CalendarIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/vue/24/outline';
import { useI18n } from '@/composables/useI18n';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

interface Props {
  item: ItemModel;
  categories?: Array<{
    key: ItemCategoryModel;
    name: string;
    icon?: unknown;
  }>;
  showFavorite?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showFavorite: true,
});

defineEmits<{
  reserve: [item: ItemModel];
  share: [item: ItemModel];
  contact: [item: ItemModel];
}>();

const { t } = useI18n();
const isFavorite = ref(false);

// Computed properties para el estado del item
const statusText = computed(() =>
  props.item.isAvailable ? t('itemCard.available') : t('itemCard.reserved')
);

const statusClasses = computed(() =>
  props.item.isAvailable
    ? 'text-green-800 dark:text-green-300'
    : 'text-red-800 dark:text-red-300'
);

const statusDotClasses = computed(() =>
  props.item.isAvailable ? 'bg-green-500' : 'bg-red-500'
);

// Funciones auxiliares
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}

function getCategoryName(category: ItemCategoryModel): string {
  const categoryData = props.categories?.find((c) => c.key === category);
  return categoryData?.name || t(`items.categories.${category}`);
}

function getOwnerInitials(ownerName?: string): string {
  if (!ownerName) return 'AN';
  const names = ownerName.split(' ');
  return names
    .map((name) => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
      month: 'long',
      year: 'numeric',
    });
  }
}

function formatMemberSince(dateString?: string): string {
  if (!dateString) return 'hace tiempo';

  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
}

function toggleFavorite() {
  isFavorite.value = !isFavorite.value;
  // TODO: Implementar lógica de favoritos
}
</script>

<style scoped>
/* Mejoras de glassmorphism */
.backdrop-blur-md {
  backdrop-filter: blur(12px);
}

/* Animaciones suaves */
.transform {
  transition: transform 0.2s ease-in-out;
}

/* Scrollbar personalizado para la galería */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* Gradientes mejorados */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
</style>
