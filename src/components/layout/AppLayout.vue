<template>
  <div
    class="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300"
  >
    <AppHeader />

    <main class="flex-1 pt-16">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue';
import AppFooter from './AppFooter.vue';
</script>
