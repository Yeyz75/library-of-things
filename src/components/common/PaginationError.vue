<template>
  <div class="p-4 bg-red-50 border border-red-200 rounded">
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 text-red-600">
        <!-- Icono simple -->
        ⚠️
      </div>
      <div class="flex-1">
        <p class="font-medium text-sm text-red-800">
          {{ $t('paginationError.title') }}
        </p>
        <p class="text-xs text-red-700 mt-1">
          {{ message || $t('paginationError.message') }}
        </p>
        <div class="mt-3 flex gap-2">
          <button
            class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
            :disabled="disabled"
            @click="$emit('retry')"
          >
            {{ $t('paginationError.retry') }}
          </button>
          <button
            v-if="allowManualRefresh"
            class="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
            :disabled="disabled"
            @click="$emit('refresh')"
          >
            {{ $t('paginationError.refresh') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const { message, disabled, allowManualRefresh } = defineProps({
  message: {
    type: String,
    default: '',
  },
  disabled: { type: Boolean, default: false },
  allowManualRefresh: { type: Boolean, default: false },
});
</script>
