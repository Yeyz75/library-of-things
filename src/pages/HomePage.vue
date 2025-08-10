<template>
  <AppLayout>
    <!-- Hero Section - Storytelling + Impacto Social -->
    <section
      ref="heroSectionRef"
      class="animated-section relative overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-white dark:from-primary-900 dark:via-primary-800 dark:to-gray-900 py-20 lg:py-32"
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
          >
            <span
              class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"
            ></span>
            {{ t('home.hero.badge') }}
          </div>

          <!-- Main Title -->
          <h1
            class="text-5xl md:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight"
          >
            {{ t('home.hero.title') }}
          </h1>

          <!-- Subtitle -->
          <p
            class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            {{ t('home.hero.subtitle') }}
          </p>

          <!-- Impact Stats -->
          <div class="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12">
            <div class="text-center">
              <div
                class="text-3xl md:text-4xl font-bold text-accent-600 dark:text-accent-400 mb-2"
              >
                {{ communityStats.itemsShared }}+
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('home.hero.stats.itemsShared') }}
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2"
              >
                {{ communityStats.co2Saved }}kg
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('home.hero.stats.co2Saved') }}
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2"
              >
                ${{ communityStats.moneySaved }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('home.hero.stats.moneySaved') }}
              </div>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/register"
              class="btn-accent text-lg px-8 py-4 hover-lift shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {{ t('home.hero.getStarted') }}
            </router-link>
            <button
              @click="scrollToHowItWorks"
              class="btn-secondary text-lg px-8 py-4 hover-lift"
            >
              {{ t('home.hero.learnMore') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section
      ref="howItWorksSectionRef"
      class="animated-section py-20 bg-primary-50 dark:bg-gray-900"
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
              <!-- Connector Line (except last item) -->
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

    <!-- Why It Works - Trust & Safety -->
    <section
      ref="whyItWorksSectionRef"
      class="animated-section py-20 bg-white dark:bg-gray-950"
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
            v-for="feature in trustFeatures"
            :key="feature.title"
            class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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

    <!-- Community Impact -->
    <section
      ref="communityImpactSectionRef"
      class="animated-section py-20 bg-primary-50 dark:bg-gray-900"
    >
      <div class="container">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <!-- Content -->
          <div>
            <h2
              class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6"
            >
              {{ t('home.impact.title') }}
            </h2>
            <p
              class="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            >
              {{ t('home.impact.subtitle') }}
            </p>

            <!-- Impact Metrics -->
            <div class="grid grid-cols-2 gap-6 mb-8">
              <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                <div
                  class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2"
                >
                  {{ communityStats.co2Saved }}kg
                </div>
                <div class="text-sm text-green-700 dark:text-green-300">
                  {{ t('home.impact.co2Prevented') }}
                </div>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
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
                ></path>
              </svg>
            </router-link>
          </div>

          <!-- Visual/Testimonial -->
          <div
            class="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8"
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

    <!-- Featured Items - Reduced prominence -->
    <section
      ref="featuredItemsSectionRef"
      class="animated-section py-16 bg-white dark:bg-gray-950"
    >
      <div class="container">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {{ t('home.featuredItems.title') }}
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            {{ t('home.featuredItems.subtitle') }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="itemsStore.isLoading" class="text-center py-12">
          <BaseLoader size="lg" :text="t('home.items.loading')" />
        </div>

        <!-- Featured Items Grid -->
        <div
          v-else-if="featuredItems.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          <ItemCard
            v-for="item in featuredItems"
            :key="item.$id"
            :item="item"
            :categories="categories"
            @click="$router.push(`/items/${item.$id}`)"
            @reserve="handleReserve"
            @share="handleShare"
          />
        </div>

        <!-- CTA to browse all -->
        <div class="text-center mt-12">
          <router-link to="/search" class="btn-secondary">
            {{ t('home.featuredItems.browseAll') }}
          </router-link>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useIntersectionObserver } from '@vueuse/core';
import {
  WrenchScrewdriverIcon,
  ComputerDesktopIcon,
  BookOpenIcon,
  PlayIcon,
  HomeIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  UserGroupIcon,
  HeartIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import ItemCard from '@/components/common/ItemCard.vue';
import { useItemsStore } from '@/store/items.store';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';
import { Item } from '@/types';

const itemsStore = useItemsStore();
const authStore = useAuthStore();
const toast = useToast();
const { t } = useI18n();

const { isAuthenticated } = storeToRefs(authStore);

// Refs for sections to animate
const heroSectionRef = ref<HTMLElement>();
const howItWorksSectionRef = ref<HTMLElement>();
const whyItWorksSectionRef = ref<HTMLElement>();
const communityImpactSectionRef = ref<HTMLElement>();
const featuredItemsSectionRef = ref<HTMLElement>();

// Animation function
const useScrollAnimation = (target: Ref<HTMLElement | undefined>) => {
  useIntersectionObserver(
    target,
    ([{ isIntersecting }], observerElement) => {
      if (isIntersecting && target.value) {
        target.value.classList.add('is-visible');
        observerElement.unobserve(target.value);
      }
    },
    { threshold: 0.1 }
  );
};

onMounted(() => {
  useScrollAnimation(heroSectionRef);
  useScrollAnimation(howItWorksSectionRef);
  useScrollAnimation(whyItWorksSectionRef);
  useScrollAnimation(communityImpactSectionRef);
  useScrollAnimation(featuredItemsSectionRef);
  loadItems();
});

// Community stats (these would come from your backend in a real app)
const communityStats = ref({
  itemsShared: 1247,
  co2Saved: 2840,
  moneySaved: 15600,
});

const categories = computed(() => [
  {
    key: 'tools',
    name: t('home.categories.tools'),
    icon: WrenchScrewdriverIcon,
  },
  {
    key: 'electronics',
    name: t('home.categories.electronics'),
    icon: ComputerDesktopIcon,
  },
  { key: 'books', name: t('home.categories.books'), icon: BookOpenIcon },
  { key: 'sports', name: t('home.categories.sports'), icon: PlayIcon },
  { key: 'home', name: t('home.categories.home'), icon: HomeIcon },
  { key: 'garden', name: t('home.categories.garden'), icon: HomeIcon },
  { key: 'games', name: t('home.categories.games'), icon: PlayIcon },
  { key: 'other', name: t('home.categories.other'), icon: PhotoIcon },
]);

// How it works steps
const howItWorksSteps = computed(() => [
  {
    icon: MagnifyingGlassIcon,
    title: t('home.howItWorks.steps.discover.title'),
    description: t('home.howItWorks.steps.discover.description'),
  },
  {
    icon: UsersIcon,
    title: t('home.howItWorks.steps.connect.title'),
    description: t('home.howItWorks.steps.connect.description'),
  },
  {
    icon: HeartIcon,
    title: t('home.howItWorks.steps.share.title'),
    description: t('home.howItWorks.steps.share.description'),
  },
]);

// Trust features
const trustFeatures = computed(() => [
  {
    icon: CheckCircleIcon,
    title: t('home.whyItWorks.features.verified.title'),
    description: t('home.whyItWorks.features.verified.description'),
  },
  {
    icon: StarIcon,
    title: t('home.whyItWorks.features.ratings.title'),
    description: t('home.whyItWorks.features.ratings.description'),
  },
  {
    icon: ShieldCheckIcon,
    title: t('home.whyItWorks.features.secure.title'),
    description: t('home.whyItWorks.features.secure.description'),
  },
  {
    icon: UserGroupIcon,
    title: t('home.whyItWorks.features.community.title'),
    description: t('home.whyItWorks.features.community.description'),
  },
  {
    icon: GlobeAltIcon,
    title: t('home.whyItWorks.features.local.title'),
    description: t('home.whyItWorks.features.local.description'),
  },
  {
    icon: CurrencyDollarIcon,
    title: t('home.whyItWorks.features.free.title'),
    description: t('home.whyItWorks.features.free.description'),
  },
]);

// Featured items - show only a few recent/popular items
const featuredItems = computed(() => {
  return itemsStore.items.slice(0, 6);
});

function scrollToHowItWorks() {
  howItWorksSectionRef.value?.scrollIntoView({ behavior: 'smooth' });
}

async function loadItems() {
  try {
    await itemsStore.fetchItems({ limit: 12 }); // Load fewer items for featured section
  } catch {
    toast.error('Failed to load items. Please try again.');
  }
}

function handleReserve(item: Item) {
  if (!isAuthenticated.value) {
    toast.warning('Please sign in to reserve items', 'Authentication Required');
    return;
  }
  // TODO: Implement reservation logic
  toast.success(
    `Reservation request sent for "${item.title}"`,
    'Reservation Requested'
  );
}

function handleShare(item: Item) {
  if (navigator.share) {
    navigator.share({
      title: item.title,
      text: item.description,
      url: `${window.location.origin}/items/${item.$id}`,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(
      `${window.location.origin}/items/${item.$id}`
    );
    toast.success('Link copied to clipboard!', 'Shared');
  }
}
</script>

<style scoped>
/* Scroll Animation */
.animated-section {
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.animated-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Hover effects */
.hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-2px);
}

/* Custom gradient backgrounds */
.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Custom button styles for better visual hierarchy */
.btn-accent {
  @apply bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl;
}

.btn-secondary {
  @apply bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl px-6 py-3 transition-all duration-300 border border-gray-200 hover:border-gray-300;
}

.dark .btn-secondary {
  @apply bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700 hover:border-gray-600;
}

/* Enhanced card hover effects */
.group:hover .group-hover\:scale-105 {
  transform: scale(1.05);
}

/* Improved spacing and typography */
.container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Custom pulse animation for the badge */
@keyframes pulse-soft {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Hero background pattern */
.hero-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>
