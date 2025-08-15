<template>
  <div class="container py-8">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Sidebar de categorías -->
      <aside class="lg:col-span-1">
        <div class="sticky top-24">
          <h3 class="text-lg font-semibold mb-4">
            {{ t('home.categories.title') }}
          </h3>
          <ul class="space-y-2">
            <li v-for="cat in categories" :key="cat.key">
              <button
                @click="emit('select-category', cat.key)"
                :class="[
                  'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3',
                  selected === cat.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
                ]"
              >
                <!-- soporta iconos como componente o emoji/string -->
                <template v-if="typeof cat.icon === 'string'">
                  <span class="text-lg">{{ cat.icon }}</span>
                </template>
                <template v-else>
                  <component :is="cat.icon" class="h-5 w-5" />
                </template>
                <span class="font-medium">
                  {{
                    cat.nameKey
                      ? t(cat.nameKey)
                      : cat.name
                        ? cat.name
                        : t(`items.categories.${cat.key}`)
                  }}
                </span>
                <span class="ml-auto text-sm text-gray-400">&gt;</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Contenido principal -->
      <main class="lg:col-span-3">
        <!-- espacio para mensajes temporales o filtros (badge de dev eliminado) -->
        <div class="mb-4"></div>
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-2xl font-semibold">{{ title }}</h2>
          <div class="text-sm text-gray-500">{{ subtitle }}</div>
        </div>

        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';
import type { ItemCategoryModel } from '@/types/models';
const { t } = useI18n();

const {
  categories,
  title = '',
  subtitle = '',
  selected = null,
} = defineProps<{
  categories: Array<{
    key: ItemCategoryModel;
    // either a translated key (nameKey) or plain name
    name?: string;
    nameKey?: string;
    icon?: unknown;
  }>;
  title?: string;
  subtitle?: string;
  selected?: ItemCategoryModel | null;
}>();

const emit = defineEmits(['select-category'] as const);
</script>

<style scoped>
.container {
  max-width: 1100px;
}
</style>
