<template>
  <section
    ref="heroSectionRef"
    class="animated-section relative overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-white dark:from-primary-900 dark:via-primary-800 dark:to-gray-900 py-20 lg:py-32"
    v-motion
    :initial="{ opacity: 0, y: 60 }"
    :enter="{
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.1 },
    }"
  >
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-5 dark:opacity-10">
      <div class="absolute inset-0 hero-pattern"></div>
    </div>
    <div class="container relative">
      <div class="text-center max-w-5xl mx-auto">
        <!-- Badge -->
        <div
          class="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6"
          v-motion
          :initial="{ opacity: 0, scale: 0.8 }"
          :enter="{
            opacity: 1,
            scale: 1,
            transition: { delay: 0.2, type: 'spring', stiffness: 80 },
          }"
        >
          <span
            class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"
          ></span>
          {{ t('home.hero.badge') }}
        </div>
        <!-- Main Title -->
        <h1
          class="text-5xl md:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight"
          v-motion
          :initial="{ opacity: 0, y: 40, scale: 0.95 }"
          :enter="{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { delay: 0.3, type: 'spring', stiffness: 70 },
          }"
          :hovered="{ scale: 1.03 }"
        >
          {{ t('home.hero.title') }}
        </h1>
        <!-- Subtitle -->
        <p
          class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: { delay: 0.4, type: 'spring', stiffness: 60 },
          }"
        >
          {{ t('home.hero.subtitle') }}
        </p>
        <!-- Impact Stats -->
        <div class="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12">
          <div class="text-center" v-for="(stat, idx) in statsArr" :key="idx">
            <div
              class="text-3xl md:text-4xl font-bold mb-2"
              :class="stat.color"
              v-motion
              :initial="{ opacity: 0, y: 20, scale: 0.9 }"
              :enter="{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  delay: 0.5 + idx * 0.1,
                  type: 'spring',
                  stiffness: 70,
                },
              }"
            >
              {{ stat.value }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ stat.label }}
            </div>
          </div>
        </div>
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/search"
            class="btn-accent text-lg px-8 py-4 hover-lift shadow-lg hover:shadow-xl transition-all duration-300"
            v-motion
            :initial="{ opacity: 0, y: 20, scale: 0.95 }"
            :enter="{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { delay: 0.8, type: 'spring', stiffness: 80 },
            }"
            :hovered="{
              scale: 1.06,
              boxShadow: '0 8px 32px 0 rgba(80,80,200,0.15)',
            }"
          >
            {{ t('home.hero.getStarted') }}
          </router-link>
          <button
            @click="scrollToHowItWorks"
            class="btn-secondary text-lg px-8 py-4 hover-lift"
            v-motion
            :initial="{ opacity: 0, y: 20, scale: 0.95 }"
            :enter="{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { delay: 0.9, type: 'spring', stiffness: 80 },
            }"
            :hovered="{ scale: 1.04 }"
          >
            {{ t('home.hero.learnMore') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMotion } from '@vueuse/motion';
import type { HeroSectionCommunityStatsModel } from '@/types/models';

// Define la interfaz para los stats de la comunidad
interface CommunityStats extends HeroSectionCommunityStatsModel {}

const props = defineProps<{
  communityStats: CommunityStats;
  t: Function;
  scrollToHowItWorks: () => void;
}>();
const heroSectionRef = ref<HTMLElement>();
// Animación de entrada para la sección
useMotion(heroSectionRef);

// Array para animar stats con delay
const statsArr = computed(() => [
  {
    value: `${props.communityStats.itemsShared}+`,
    label: props.t('home.hero.stats.itemsShared'),
    color: 'text-accent-600 dark:text-accent-400',
  },
  {
    value: `${props.communityStats.co2Saved}kg`,
    label: props.t('home.hero.stats.co2Saved'),
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: `${props.communityStats.moneySaved}`,
    label: props.t('home.hero.stats.moneySaved'),
    color: 'text-blue-600 dark:text-blue-400',
  },
]);
</script>
