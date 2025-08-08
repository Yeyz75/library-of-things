<template>
  <AppLayout>
    <div class="container py-16">
      <div class="text-center">
        <div class="mb-8">
          <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">
            Page not found
          </h2>
          <p class="text-gray-600 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. The item might
            have been removed or the link might be incorrect.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/" class="btn-primary"> Browse Items </router-link>
          <router-link to="/dashboard" class="btn-secondary">
            Go to Dashboard
          </router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue';
</script>
