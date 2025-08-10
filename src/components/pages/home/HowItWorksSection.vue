<template>
  <section
    :ref="howItWorksSectionRef"
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
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {{ t('home.howItWorks.title') }}
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {{ t('home.howItWorks.subtitle') }}
        </p>
      </div>
      <div class="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
        <div
          v-for="(step, index) in howItWorksSteps"
          :key="index"
          class="text-center group"
          v-motion
          :initial="{ opacity: 0, y: 40, scale: 0.95 }"
          :enter="{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              delay: 0.2 + index * 0.15,
              type: 'spring',
              stiffness: 70,
            },
          }"
          :hovered="{
            scale: 1.03,
            boxShadow: '0 8px 32px 0 rgba(80,80,200,0.10)',
          }"
        >
          <!-- Step Number -->
          <div class="relative mb-8">
            <div
              class="w-20 h-20 bg-primary-100 dark:bg-primary-800/30 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-all duration-300"
            >
              <span
                class="text-2xl font-bold text-accent-600 dark:text-accent-400"
                >{{ index + 1 }}</span
              >
            </div>
            <div
              v-if="index < howItWorksSteps.length - 1"
              class="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"
            ></div>
          </div>
          <!-- Icon -->
          <div class="mb-6">
            <component
              :is="step.icon"
              class="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 group-hover:text-accent-500 transition-colors duration-300"
            />
          </div>
          <!-- Content -->
          <h3
            class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4"
          >
            {{ step.title }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ step.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { useMotion } from '@vueuse/motion';
import type { Ref } from 'vue';

// Define la interfaz para los pasos
interface HowItWorksStep {
  icon: unknown; // Puedes especificar un tipo más estricto si sabes el tipo de los iconos
  title: string;
  description: string;
}

const props = defineProps<{
  howItWorksSteps: HowItWorksStep[];
  t: Function;
  howItWorksSectionRef: Ref<HTMLElement | null>;
}>();

useMotion(props.howItWorksSectionRef);
</script>
