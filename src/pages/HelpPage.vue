<template>
  <AppLayout>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {{ t('help.title') }}
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {{ t('help.subtitle') }}
          </p>
        </div>

        <!-- Search FAQ -->
        <div class="mb-12">
          <div class="relative max-w-md mx-auto">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('help.searchPlaceholder')"
              class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <svg
                class="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Quick Help Categories -->
        <div class="grid md:grid-cols-3 gap-6 mb-12">
          <div
            v-for="category in helpCategories"
            :key="category.key"
            @click="selectedCategory = category.key"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
            :class="
              selectedCategory === category.key ? 'ring-2 ring-primary-500' : ''
            "
          >
            <div class="text-center">
              <div
                class="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <component
                  :is="category.icon"
                  class="h-6 w-6 text-primary-600 dark:text-primary-400"
                />
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {{ t(`help.categories.${category.key}.title`) }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ t(`help.categories.${category.key}.description`) }}
              </p>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            {{ t('help.faq.title') }}
          </h2>
          <div class="space-y-4">
            <div
              v-for="(faq, index) in filteredFAQs"
              :key="index"
              class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <button
                @click="toggleFAQ(index)"
                class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ t(`help.faq.items.${faq.key}.question`) }}
                </span>
                <svg
                  class="h-5 w-5 text-gray-500 transition-transform"
                  :class="openFAQs.includes(index) ? 'rotate-180' : ''"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>
              <div
                v-if="openFAQs.includes(index)"
                class="px-6 pb-4 text-gray-600 dark:text-gray-400"
              >
                {{ t(`help.faq.items.${faq.key}.answer`) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Support -->
        <div
          class="bg-primary-50 dark:bg-primary-900/10 rounded-lg p-8 text-center"
        >
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {{ t('help.contact.title') }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('help.contact.description') }}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@libraryofthings.com"
              class="btn-primary inline-flex items-center justify-center"
            >
              <svg
                class="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
              {{ t('help.contact.email') }}
            </a>
            <button
              @click="showContactModal = true"
              class="btn-secondary inline-flex items-center justify-center"
            >
              <svg
                class="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
              {{ t('help.contact.chat') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Contact Modal -->
      <BaseModal
        v-if="showContactModal"
        @close="showContactModal = false"
        :title="t('help.contactModal.title')"
      >
        <div class="p-6">
          <form @submit.prevent="submitContactForm">
            <div class="mb-4">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {{ t('help.contactModal.subject') }}
              </label>
              <input
                v-model="contactForm.subject"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div class="mb-4">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {{ t('help.contactModal.message') }}
              </label>
              <textarea
                v-model="contactForm.message"
                rows="4"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              ></textarea>
            </div>
            <div class="flex space-x-3">
              <button
                type="button"
                @click="showContactModal = false"
                class="flex-1 btn-secondary"
              >
                {{ t('common.cancel') }}
              </button>
              <button type="submit" class="flex-1 btn-primary">
                {{ t('help.contactModal.send') }}
              </button>
            </div>
          </form>
        </div>
      </BaseModal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import BaseModal from '@/components/common/BaseModal.vue';
import AppLayout from '@/components/layout/AppLayout.vue';

const { t } = useI18n();

const searchQuery = ref('');
const selectedCategory = ref('');
const openFAQs = ref<number[]>([]);
const showContactModal = ref(false);

const contactForm = ref({
  subject: '',
  message: '',
});

const helpCategories = [
  {
    key: 'borrowing',
    icon: 'svg', // You can replace with actual icon components
  },
  {
    key: 'lending',
    icon: 'svg',
  },
  {
    key: 'account',
    icon: 'svg',
  },
];

const faqItems = [
  { key: 'howToBorrow', category: 'borrowing' },
  { key: 'howToLend', category: 'lending' },
  { key: 'safety', category: 'borrowing' },
  { key: 'pricing', category: 'account' },
  { key: 'disputes', category: 'borrowing' },
  { key: 'insurance', category: 'lending' },
  { key: 'deleteAccount', category: 'account' },
  { key: 'privacy', category: 'account' },
];

const filteredFAQs = computed(() => {
  let filtered = faqItems;

  if (selectedCategory.value) {
    filtered = filtered.filter(
      (faq) => faq.category === selectedCategory.value
    );
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (faq) =>
        t(`help.faq.items.${faq.key}.question`).toLowerCase().includes(query) ||
        t(`help.faq.items.${faq.key}.answer`).toLowerCase().includes(query)
    );
  }

  return filtered;
});

function toggleFAQ(index: number) {
  const faqIndex = openFAQs.value.indexOf(index);
  if (faqIndex > -1) {
    openFAQs.value.splice(faqIndex, 1);
  } else {
    openFAQs.value.push(index);
  }
}

function submitContactForm() {
  // Here you would send the contact form
  console.log('Contact form submitted:', contactForm.value);
  showContactModal.value = false;
  contactForm.value = { subject: '', message: '' };
  alert(t('help.contactModal.success'));
}
</script>
