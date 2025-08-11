<template>
  <AppLayout>
    <div class="container py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">
          {{ t('reservations.title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-2">
          {{ t('reservations.subtitle') }}
        </p>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-8">
        <nav class="flex space-x-8">
          <button
            @click="activeTab = 'borrowed'"
            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="
              activeTab === 'borrowed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            "
          >
            {{
              t('reservations.tabs.borrowed', {
                count: borrowedReservations.length,
              })
            }}
          </button>
          <button
            @click="activeTab = 'lent'"
            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="
              activeTab === 'lent'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            "
          >
            {{
              t('reservations.tabs.lent', { count: lentReservations.length })
            }}
          </button>
        </nav>
      </div>

      <!-- Loading State -->
      <div v-if="reservationsStore.isLoading" class="text-center py-12">
        <BaseLoader size="lg" :text="t('reservations.loading')" />
      </div>

      <!-- Error State -->
      <div v-else-if="reservationsStore.error" class="text-center py-12">
        <div class="bg-error-50 text-error-600 p-6 rounded-lg max-w-md mx-auto">
          <p class="font-medium">{{ t('reservations.error') }}</p>
          <p class="text-sm mt-1">{{ reservationsStore.error }}</p>
          <button @click="loadReservations" class="btn-primary mt-4">
            {{ t('reservations.tryAgain') }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div v-else>
        <!-- Borrowed Items Tab -->
        <div v-if="activeTab === 'borrowed'">
          <div
            v-if="borrowedReservations.length === 0"
            class="text-center py-12"
          >
            <CalendarDaysIcon class="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3
              class="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2"
            >
              {{ t('reservations.borrowed.noItems') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              {{ t('reservations.borrowed.noItemsDescription') }}
            </p>
            <router-link to="/" class="btn-primary">{{
              t('reservations.borrowed.browseItems')
            }}</router-link>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="reservation in borrowedReservations"
              :key="reservation.$id"
              class="card hover:shadow-md transition-shadow"
            >
              <div class="flex items-start space-x-4">
                <div
                  class="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden"
                >
                  <img
                    v-if="reservation.itemImageUrl"
                    :src="reservation.itemImageUrl"
                    :alt="reservation.itemTitle"
                    class="w-full h-full object-cover"
                  />
                  <PhotoIcon v-else class="w-full h-full text-gray-400 p-2" />
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-gray-900 dark:text-gray-50 mb-1">
                    {{ reservation.itemTitle }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {{
                      t('reservations.borrowed.ownedBy', {
                        name: reservation.ownerName,
                      })
                    }}
                  </p>
                  <div
                    class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span>{{
                      t('reservations.borrowed.from', {
                        date: formatDate(reservation.startDate ?? ''),
                      })
                    }}</span>
                    <span>{{
                      t('reservations.borrowed.to', {
                        date: formatDate(reservation.endDate ?? ''),
                      })
                    }}</span>
                  </div>
                  <p
                    v-if="reservation.message"
                    class="text-sm text-gray-600 dark:text-gray-300 mt-2"
                  >
                    "{{ reservation.message }}"
                  </p>
                </div>

                <div class="flex flex-col items-end space-y-2">
                  <span
                    class="inline-block text-xs font-medium px-2 py-1 rounded-full"
                    :class="getStatusClass(reservation.status)"
                  >
                    {{ getStatusText(reservation.status) }}
                  </span>

                  <div class="flex space-x-2">
                    <button
                      v-if="reservation.status === 'active'"
                      @click="returnItem(reservation.$id ?? '')"
                      class="btn btn-sm bg-success-600 text-white hover:bg-success-700"
                    >
                      {{ t('reservations.borrowed.markReturned') }}
                    </button>
                    <button
                      v-if="reservation.status === 'pending'"
                      @click="cancelReservation(reservation.$id ?? '')"
                      class="btn btn-sm bg-error-600 text-white hover:bg-error-700"
                    >
                      {{ t('reservations.borrowed.cancel') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lent Items Tab -->
        <div v-if="activeTab === 'lent'">
          <div v-if="lentReservations.length === 0" class="text-center py-12">
            <HandRaisedIcon class="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3
              class="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2"
            >
              {{ t('reservations.lent.noItems') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              {{ t('reservations.lent.noItemsDescription') }}
            </p>
            <router-link to="/items/new" class="btn-primary">{{
              t('reservations.lent.addItem')
            }}</router-link>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="reservation in lentReservations"
              :key="reservation.$id"
              class="card hover:shadow-md transition-shadow"
            >
              <div class="flex items-start space-x-4">
                <div
                  class="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden"
                >
                  <img
                    v-if="reservation.itemImageUrl"
                    :src="reservation.itemImageUrl"
                    :alt="reservation.itemTitle"
                    class="w-full h-full object-cover"
                  />
                  <PhotoIcon v-else class="w-full h-full text-gray-400 p-2" />
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-gray-900 dark:text-gray-50 mb-1">
                    {{ reservation.itemTitle }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {{
                      t('reservations.lent.requestedBy', {
                        name: reservation.borrowerName,
                      })
                    }}
                  </p>
                  <div
                    class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span
                      >From {{ formatDate(reservation.startDate ?? '') }}</span
                    >
                    <span>To {{ formatDate(reservation.endDate ?? '') }}</span>
                  </div>
                  <p
                    v-if="reservation.message"
                    class="text-sm text-gray-600 dark:text-gray-300 mt-2"
                  >
                    "{{ reservation.message }}"
                  </p>
                </div>

                <div class="flex flex-col items-end space-y-2">
                  <span
                    class="inline-block text-xs font-medium px-2 py-1 rounded-full"
                    :class="getStatusClass(reservation.status)"
                  >
                    {{ getStatusText(reservation.status) }}
                  </span>

                  <div class="flex space-x-2">
                    <button
                      v-if="reservation.status === 'pending'"
                      @click="approveReservation(reservation.$id ?? '')"
                      class="btn btn-sm bg-success-600 text-white hover:bg-success-700"
                    >
                      {{ t('reservations.lent.approve') }}
                    </button>
                    <button
                      v-if="reservation.status === 'pending'"
                      @click="rejectReservation(reservation.$id ?? '')"
                      class="btn btn-sm bg-error-600 text-white hover:bg-error-700"
                    >
                      {{ t('reservations.lent.decline') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import {
  CalendarDaysIcon,
  HandRaisedIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';
import { useReservationsStore } from '@/store/reservations.store';
import { useI18n } from '@/composables/useI18n';
import type { ReservationStatusModel } from '@/types/models';

const authStore = useAuthStore();
const reservationsStore = useReservationsStore();
const { t } = useI18n();

const { userId } = storeToRefs(authStore);

const activeTab = ref<'borrowed' | 'lent'>('borrowed');

const borrowedReservations = computed(() =>
  reservationsStore.reservations
    .filter((r) => r.borrowerId === userId.value)
    .sort(
      (a, b) =>
        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    )
);

const lentReservations = computed(() =>
  reservationsStore.reservations
    .filter((r) => r.ownerId === userId.value)
    .sort(
      (a, b) =>
        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    )
);

function getStatusClass(status: ReservationStatusModel): string {
  const classes = {
    pending: 'bg-warning-100 text-warning-800',
    approved: 'bg-primary-100 text-primary-800',
    active: 'bg-success-100 text-success-800',
    returned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    cancelled: 'bg-error-100 text-error-800',
  };
  // Asegura que status sea una clave válida del objeto classes
  return (
    classes[status as keyof typeof classes] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  );
}

function getStatusText(status: ReservationStatusModel): string {
  return t(`reservations.status.${status}`) ?? status;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

async function approveReservation(id: string) {
  try {
    await reservationsStore.updateReservationStatus(id, 'active');
  } catch (error) {
    console.error('Error approving reservation:', error);
  }
}

async function rejectReservation(id: string) {
  try {
    await reservationsStore.updateReservationStatus(id, 'cancelled');
  } catch (error) {
    console.error('Error rejecting reservation:', error);
  }
}

async function returnItem(id: string) {
  try {
    await reservationsStore.updateReservationStatus(id, 'returned');
  } catch (error) {
    console.error('Error returning item:', error);
  }
}

async function cancelReservation(id: string) {
  try {
    await reservationsStore.updateReservationStatus(id, 'cancelled');
  } catch (error) {
    console.error('Error cancelling reservation:', error);
  }
}

async function loadReservations() {
  await reservationsStore.fetchReservations();
}

onMounted(() => {
  loadReservations();
});
</script>
