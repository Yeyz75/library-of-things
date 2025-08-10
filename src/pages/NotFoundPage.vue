<template>
  <AppLayout>
    <div class="container py-16">
      <div class="text-center">
        <div class="mb-8">
          <h1 class="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">
            {{ t('notFound.title') }}
          </h1>
          <h2
            class="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-2"
          >
            {{ t('notFound.heading') }}
          </h2>
          <p class="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            {{ t('notFound.description') }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/" class="btn-primary">{{
            t('notFound.browseItems')
          }}</router-link>
          <router-link to="/dashboard" class="btn-secondary">
            {{ t('notFound.goToDashboard') }}
          </router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();
</script>
