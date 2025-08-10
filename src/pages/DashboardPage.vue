<template>
  <AppLayout>
    <div class="container py-8">
      <!-- Welcome Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">
          {{
            currentUser?.name
              ? t('dashboard.welcome', { name: currentUser.name })
              : t('dashboard.welcomeDefault')
          }}
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-2">
          {{ t('dashboard.subtitle') }}
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-primary-100">
              <ArchiveBoxIcon class="h-6 w-6 text-primary-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ t('dashboard.stats.yourItems') }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {{ userItemsCount }}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-secondary-100">
              <CalendarDaysIcon class="h-6 w-6 text-secondary-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ t('dashboard.stats.activeReservations') }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {{ activeReservationsCount }}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-accent-100">
              <ClockIcon class="h-6 w-6 text-accent-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ t('dashboard.stats.pendingRequests') }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {{ pendingRequestsCount }}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-success-100">
              <HandRaisedIcon class="h-6 w-6 text-success-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ t('dashboard.stats.itemsBorrowed') }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {{ borrowedItemsCount }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Your Items -->
        <div class="card">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-50">
              {{ t('dashboard.yourItems.title') }}
            </h2>
            <router-link to="/items/new" class="btn-primary">
              <PlusIcon class="h-4 w-4 mr-2" />
              {{ t('dashboard.yourItems.addItem') }}
            </router-link>
          </div>

          <div v-if="itemsStore.isLoading" class="text-center py-8">
            <BaseLoader size="md" :text="t('dashboard.yourItems.loading')" />
          </div>

          <div v-else-if="userItems.length === 0" class="text-center py-8">
            <ArchiveBoxIcon class="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              {{ t('dashboard.yourItems.noItems') }}
            </p>
            <router-link to="/items/new" class="btn-primary">
              {{ t('dashboard.yourItems.addFirstItem') }}
            </router-link>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="item in userItems.slice(0, 5)"
              :key="item.$id"
              class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              @click="$router.push(`/items/${item.$id}`)"
            >
              <div
                class="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden"
              >
                <img
                  v-if="item.imageUrls?.[0]"
                  :src="item.imageUrls[0]"
                  :alt="item.title"
                  class="w-full h-full object-cover"
                />
                <PhotoIcon v-else class="w-full h-full text-gray-400 p-2" />
              </div>
              <div class="flex-1 min-w-0">
                <h3
                  class="font-medium text-gray-900 dark:text-gray-50 truncate"
                >
                  {{ item.title }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {{ item.description }}
                </p>
                <div class="flex items-center space-x-2 mt-1">
                  <span
                    class="inline-block text-xs font-medium px-2 py-1 rounded"
                    :class="
                      item.isAvailable
                        ? 'bg-success-100 text-success-800 dark:bg-success-200 dark:text-success-900'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    "
                  >
                    {{
                      item.isAvailable
                        ? t('dashboard.yourItems.available')
                        : t('dashboard.yourItems.borrowed')
                    }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="userItems.length > 5" class="text-center pt-4">
              <router-link
                to="/items"
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                {{
                  t('dashboard.yourItems.viewAll', { count: userItems.length })
                }}
              </router-link>
            </div>
          </div>
        </div>

        <!-- Recent Reservations -->
        <div class="card">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-50">
              {{ t('dashboard.reservations.title') }}
            </h2>
            <router-link
              to="/reservations"
              class="text-primary-600 hover:text-primary-700 font-medium"
            >
              {{ t('dashboard.reservations.viewAll') }}
            </router-link>
          </div>

          <div v-if="reservationsStore.isLoading" class="text-center py-8">
            <BaseLoader size="md" :text="t('dashboard.reservations.loading')" />
          </div>

          <div
            v-else-if="recentReservations.length === 0"
            class="text-center py-8"
          >
            <CalendarDaysIcon class="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              {{ t('dashboard.reservations.noReservations') }}
            </p>
            <router-link to="/" class="btn-primary">{{
              t('dashboard.reservations.browseItems')
            }}</router-link>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="reservation in recentReservations"
              :key="reservation.$id"
              class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div class="flex-1">
                <h3 class="font-medium text-gray-900">
                  {{ reservation.itemTitle }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{ reservation.borrowerName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(new Date(reservation.startDate)) }} -
                  {{ formatDate(new Date(reservation.endDate)) }}
                </p>
              </div>
              <span
                class="inline-block text-xs font-medium px-2 py-1 rounded"
                :class="getStatusClass(reservation.status)"
              >
                {{ reservation.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  PlusIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
  ClockIcon,
  HandRaisedIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';
import { useItemsStore } from '@/store/items.store';
import { useReservationsStore } from '@/store/reservations.store';
import { useI18n } from '@/composables/useI18n';
import type { ReservationStatus } from '@/types';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const itemsStore = useItemsStore();
const reservationsStore = useReservationsStore();
const { t } = useI18n();

const { currentUser, userId } = storeToRefs(authStore);

// Computed properties for stats
const userItems = computed(() =>
  itemsStore.items.filter((item) => item.ownerId === userId.value)
);

const userItemsCount = computed(() => userItems.value.length);

const activeReservationsCount = computed(
  () =>
    reservationsStore.reservations.filter(
      (r) => r.ownerId === userId.value && r.status === 'active'
    ).length
);

const pendingRequestsCount = computed(
  () =>
    reservationsStore.reservations.filter(
      (r) => r.ownerId === userId.value && r.status === 'pending'
    ).length
);

const borrowedItemsCount = computed(
  () =>
    reservationsStore.reservations.filter(
      (r) => r.borrowerId === userId.value && r.status === 'active'
    ).length
);

const recentReservations = computed(() =>
  reservationsStore.reservations
    .filter((r) => r.ownerId === userId.value || r.borrowerId === userId.value)
    .slice(0, 5)
);

function getStatusClass(status: ReservationStatus): string {
  const classes = {
    pending: 'bg-warning-100 text-warning-800',
    approved: 'bg-primary-100 text-primary-800',
    active: 'bg-success-100 text-success-800',
    returned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    cancelled: 'bg-error-100 text-error-800',
  };
  return (
    classes[status] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

onMounted(async () => {
  if (userId.value) {
    // Load user's items
    await itemsStore.fetchItems({ ownerId: userId.value });

    // Load all reservations involving the user
    await reservationsStore.fetchReservations();
  }
});
</script>
