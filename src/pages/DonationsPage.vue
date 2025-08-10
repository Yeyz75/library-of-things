<template>
  <AppLayout>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {{ t('donations.title') }}
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {{ t('donations.subtitle') }}
          </p>
        </div>

        <!-- Donation Options -->
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <!-- Donate Items -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div class="text-center mb-6">
              <div
                class="h-16 w-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="h-8 w-8 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
              </div>
              <h3
                class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
              >
                {{ t('donations.donateItems.title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ t('donations.donateItems.description') }}
              </p>
            </div>
            <router-link
              to="/items/new"
              class="w-full btn-primary text-center block"
            >
              {{ t('donations.donateItems.action') }}
            </router-link>
          </div>

          <!-- Monetary Donations -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div class="text-center mb-6">
              <div
                class="h-16 w-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  ></path>
                </svg>
              </div>
              <h3
                class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
              >
                {{ t('donations.monetary.title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ t('donations.monetary.description') }}
              </p>
            </div>
            <button
              @click="showDonationModal = true"
              class="w-full btn-secondary text-center"
            >
              {{ t('donations.monetary.action') }}
            </button>
          </div>
        </div>

        <!-- Impact Section -->
        <div class="bg-primary-50 dark:bg-primary-900/10 rounded-lg p-8 mb-12">
          <h2
            class="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8"
          >
            {{ t('donations.impact.title') }}
          </h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="text-center">
              <div
                class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2"
              >
                1,250+
              </div>
              <div class="text-gray-600 dark:text-gray-400">
                {{ t('donations.impact.itemsShared') }}
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2"
              >
                500+
              </div>
              <div class="text-gray-600 dark:text-gray-400">
                {{ t('donations.impact.membersHelped') }}
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2"
              >
                $15,000+
              </div>
              <div class="text-gray-600 dark:text-gray-400">
                {{ t('donations.impact.moneySaved') }}
              </div>
            </div>
          </div>
        </div>

        <!-- How It Works -->
        <div class="mb-12">
          <h2
            class="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8"
          >
            {{ t('donations.howItWorks.title') }}
          </h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div
                class="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="text-primary-600 dark:text-primary-400 font-bold"
                  >1</span
                >
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {{ t('donations.howItWorks.step1.title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ t('donations.howItWorks.step1.description') }}
              </p>
            </div>
            <div class="text-center">
              <div
                class="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="text-primary-600 dark:text-primary-400 font-bold"
                  >2</span
                >
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {{ t('donations.howItWorks.step2.title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ t('donations.howItWorks.step2.description') }}
              </p>
            </div>
            <div class="text-center">
              <div
                class="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="text-primary-600 dark:text-primary-400 font-bold"
                  >3</span
                >
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {{ t('donations.howItWorks.step3.title') }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ t('donations.howItWorks.step3.description') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Donation Modal -->
      <BaseModal
        v-if="showDonationModal"
        @close="showDonationModal = false"
        :title="t('donations.modal.title')"
      >
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('donations.modal.description') }}
          </p>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <button
              v-for="amount in donationAmounts"
              :key="amount"
              @click="selectedAmount = amount"
              class="p-4 border-2 rounded-lg text-center transition-colors"
              :class="
                selectedAmount === amount
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
              "
            >
              ${{ amount }}
            </button>
          </div>
          <div class="mb-6">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t('donations.modal.customAmount') }}
            </label>
            <input
              v-model="customAmount"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              :placeholder="t('donations.modal.customAmountPlaceholder')"
            />
          </div>
          <div class="flex space-x-3">
            <button
              @click="showDonationModal = false"
              class="flex-1 btn-secondary"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="processDonation"
              class="flex-1 btn-primary"
              :disabled="!selectedAmount && !customAmount"
            >
              {{ t('donations.modal.donate') }}
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import BaseModal from '@/components/common/BaseModal.vue';
import AppLayout from '@/components/layout/AppLayout.vue';

const { t } = useI18n();

const showDonationModal = ref(false);
const selectedAmount = ref<number | null>(null);
const customAmount = ref<number | null>(null);
const donationAmounts = [5, 10, 25, 50, 100, 200];

function processDonation() {
  const amount = customAmount.value || selectedAmount.value;
  if (amount) {
    // Here you would integrate with a payment processor
    console.log(`Processing donation of $${amount}`);
    showDonationModal.value = false;
    selectedAmount.value = null;
    customAmount.value = null;
    // Show success message
    alert(t('donations.modal.success'));
  }
}
</script>
