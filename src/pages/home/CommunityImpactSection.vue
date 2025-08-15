<template>
  <section
    ref="communityImpactSectionRef"
    class="animated-section py-20 bg-primary-50 dark:bg-gray-900"
    v-motion
    :initial="{ opacity: 0, y: 60 }"
    :enter="{
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.1 },
    }"
  >
    <div class="container">
      <div class="grid lg:grid-cols-2 gap-16 items-center">
        <!-- Content -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 40, scale: 0.97 }"
          :enter="{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { delay: 0.2, type: 'spring', stiffness: 70 },
          }"
        >
          <h2 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {{ t('home.impact.title') }}
          </h2>
          <p
            class="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :enter="{
              opacity: 1,
              y: 0,
              transition: { delay: 0.3, type: 'spring', stiffness: 60 },
            }"
          >
            {{ t('home.impact.subtitle') }}
          </p>
          <!-- Impact Metrics -->
          <div class="grid grid-cols-2 gap-6 mb-8">
            <div
              class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6"
              v-motion
              :initial="{ opacity: 0, y: 20, scale: 0.95 }"
              :enter="{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { delay: 0.4, type: 'spring', stiffness: 70 },
              }"
            >
              <div
                class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2"
              >
                {{ communityStats.co2Saved }}kg
              </div>
              <div class="text-sm text-green-700 dark:text-green-300">
                {{ t('home.impact.co2Prevented') }}
              </div>
            </div>
            <div
              class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6"
              v-motion
              :initial="{ opacity: 0, y: 20, scale: 0.95 }"
              :enter="{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { delay: 0.5, type: 'spring', stiffness: 70 },
              }"
            >
              <div
                class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2"
              >
                ${{ communityStats.moneySaved }}
              </div>
              <div class="text-sm text-blue-700 dark:text-blue-300">
                {{ t('home.impact.communitySavings') }}
              </div>
            </div>
          </div>
          <router-link
            to="/register"
            class="btn-accent inline-flex items-center"
            v-motion
            :initial="{ opacity: 0, y: 20, scale: 0.97 }"
            :enter="{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { delay: 0.6, type: 'spring', stiffness: 80 },
            }"
            :hovered="{ scale: 1.04 }"
          >
            {{ t('home.impact.joinCommunity') }}
            <svg
              class="ml-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </router-link>
        </div>
        <!-- Visual/Testimonial -->
        <div
          class="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8"
          v-motion
          :initial="{ opacity: 0, y: 40, scale: 0.97 }"
          :enter="{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { delay: 0.7, type: 'spring', stiffness: 70 },
          }"
        >
          <div class="text-center">
            <div
              class="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <svg
                class="h-10 w-10 text-accent-600 dark:text-accent-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </div>
            <blockquote
              class="text-lg text-gray-700 dark:text-gray-300 mb-4 italic"
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :enter="{
                opacity: 1,
                y: 0,
                transition: { delay: 0.8, type: 'spring', stiffness: 60 },
              }"
            >
              "{{ t('home.impact.testimonial.quote') }}"
            </blockquote>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <div class="font-medium">
                {{ t('home.impact.testimonial.author') }}
              </div>
              <div>{{ t('home.impact.testimonial.role') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useMotion } from '@vueuse/motion';
import type { Ref } from 'vue';

type CommunityStats = {
  co2Saved: number;
  moneySaved: number;
};

import { isRef, ref as vueRef, type UnwrapRef } from 'vue';

const props = defineProps<{
  communityStats: CommunityStats;
  t: (_key: string) => string;
  // Accept either a Ref<HTMLElement|null> or an HTMLElement|null directly
  communityImpactSectionRef?: Ref<HTMLElement | null> | HTMLElement | null;
}>();

// Normalize the incoming prop to a Ref<HTMLElement|null> before using useMotion
const normalizedCommunityRef = ((): Ref<HTMLElement | null> => {
  if (isRef(props.communityImpactSectionRef)) {
    return props.communityImpactSectionRef as Ref<HTMLElement | null>;
  }
  // If an element or null was passed, wrap it into a ref
  return vueRef(
    (props.communityImpactSectionRef as UnwrapRef<HTMLElement | null>) ?? null
  );
})();

useMotion(normalizedCommunityRef);
</script>
