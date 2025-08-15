<template>
  <div class="container py-6">
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Sidebar de categorías más compacto -->
      <aside class="lg:col-span-1">
        <div class="sticky top-20">
          <h3
            class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100"
          >
            {{ t('home.categories.title') }}
          </h3>
          <div class="space-y-1">
            <button
              v-for="cat in categories"
              :key="cat.key"
              @click="emit('select-category', cat.key)"
              :class="[
                'w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-all duration-200 text-sm',
                selected === cat.key
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-300',
              ]"
            >
              <!-- soporta iconos como componente o emoji/string -->
              <template v-if="typeof cat.icon === 'string'">
                <span class="text-lg">{{ cat.icon }}</span>
              </template>
              <template v-else>
                <component :is="cat.icon" class="h-4 w-4" />
              </template>
              <span class="font-medium flex-1">
                {{
                  cat.nameKey
                    ? t(cat.nameKey)
                    : cat.name
                      ? cat.name
                      : t(`items.categories.${cat.key}`)
                }}
              </span>
              <span v-if="selected === cat.key" class="text-xs">✓</span>
              <span v-else class="text-xs text-gray-400">›</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Contenido principal más espacioso -->
      <main class="lg:col-span-4">
        <div class="mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h2
                class="text-2xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {{ title }}
              </h2>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ subtitle }}
              </div>
            </div>
            <!-- Opción para mostrar filtros adicionales en el futuro -->
            <div class="hidden md:flex items-center gap-2">
              <span class="text-xs text-gray-400">
                {{ $t('common.updated') }} · {{ $t('common.today') }}
              </span>
            </div>
          </div>
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
