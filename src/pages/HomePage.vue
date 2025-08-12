<template>
  <AppLayout>
    <HeroSection
      ref="heroSectionRef"
      :communityStats="communityStats"
      :t="t"
      :scrollToHowItWorks="scrollToHowItWorks"
    />
    <HowItWorksSection
      ref="howItWorksSectionRef"
      :howItWorksSteps="howItWorksSteps"
      :t="t"
    />
    <WhyItWorksSection
      ref="whyItWorksSectionRef"
      :trustFeatures="trustFeatures"
      :t="t"
    />
    <CommunityImpactSection
      :communityStats="communityStats"
      :t="t"
      :communityImpactSectionRef="communityImpactSectionRef"
    />
    <FeaturedItemsSection
      :featuredItems="featuredItems"
      :isLoading="itemsStore.isLoading"
      :categories="categories"
      :t="t"
      :handleReserve="handleReserve"
      :handleShare="handleShare"
      :featuredItemsSectionRef="featuredItemsSectionRef"
    />
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
import HeroSection from '@/pages/home/HeroSection.vue';
import HowItWorksSection from '@/pages/home/HowItWorksSection.vue';
import WhyItWorksSection from '@/pages/home/WhyItWorksSection.vue';
import CommunityImpactSection from '@/pages/home/CommunityImpactSection.vue';
import FeaturedItemsSection from '@/pages/home/FeaturedItemsSection.vue';
import { useItemsStore } from '@/store/items.store';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';
import { ItemModel } from '@/types/models';

const itemsStore = useItemsStore();
const authStore = useAuthStore();
const toast = useToast();
const { t } = useI18n();

const { isAuthenticated } = storeToRefs(authStore);

// Refs for sections to animate
const heroSectionRef = ref<HTMLElement | null>(null);
const howItWorksSectionRef = ref<HTMLElement | null>(null);
const whyItWorksSectionRef = ref<HTMLElement | null>(null);
const communityImpactSectionRef = ref<HTMLElement | null>(null);
const featuredItemsSectionRef = ref<HTMLElement | null>(null);

// Animation function
const useScrollAnimation = (target: Ref<HTMLElement | null>) => {
  useIntersectionObserver(
    target,
    ([{ isIntersecting, target: element }], observer) => {
      if (isIntersecting) {
        element.classList.add('is-visible');
        observer.unobserve(element);
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
  const el = howItWorksSectionRef.value?.$el;
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

async function loadItems() {
  try {
    await itemsStore.fetchItems({ limit: 12 }); // Load fewer items for featured section
  } catch {
    toast.error('Failed to load items. Please try again.');
  }
}

function handleReserve(item: ItemModel) {
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

function handleShare(item: ItemModel) {
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
