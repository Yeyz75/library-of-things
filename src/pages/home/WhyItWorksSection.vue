<template>
  <section
    class="animated-section py-20 bg-white dark:bg-gray-950"
    v-motion
    :initial="{ opacity: 0, y: 60 }"
    :enter="{
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.1 },
    }"
  >
    <div class="container">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {{ t('home.whyItWorks.title') }}
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {{ t('home.whyItWorks.subtitle') }}
        </p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div
          v-for="(feature, idx) in trustFeatures"
          :key="feature.title"
          class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          v-motion
          :initial="{ opacity: 0, y: 40, scale: 0.95 }"
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
            scale: 1.04,
            boxShadow: '0 8px 32px 0 rgba(80,80,200,0.10)',
          }"
        >
          <div
            class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-6"
          >
            <component
              :is="feature.icon"
              class="h-6 w-6 text-accent-600 dark:text-accent-400"
            />
          </div>
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4"
          >
            {{ feature.title }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type TrustFeature = {
  icon: unknown; // Puedes reemplazar 'any' por el tipo específico si lo tienes
  title: string;
  description: string;
};
defineProps<{
  trustFeatures: TrustFeature[];
  t: Function;
}>();
</script>
