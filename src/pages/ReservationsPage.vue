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
                count: borrowedPagination.totalItems.value,
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
              t('reservations.tabs.lent', {
                count: lendingPagination.totalItems.value,
              })
            }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div>
        <!-- Borrowed Items Tab -->
        <div v-if="activeTab === 'borrowed'">
          <!-- Loading State -->
          <div
            v-if="borrowedPagination.loading.value"
            class="text-center py-12"
          >
            <BaseLoader size="lg" :text="t('reservations.loading')" />
          </div>

          <!-- Error State -->
          <div
            v-else-if="borrowedPagination.error.value"
            class="text-center py-12"
          >
            <PaginationError
              :message="borrowedPagination.error.value"
              :disabled="borrowedPagination.loading.value"
              @retry="borrowedPagination.retry"
              @refresh="borrowedPagination.refresh"
              :allowManualRefresh="true"
            />
          </div>

          <!-- Empty State -->
          <div
            v-else-if="
              borrowedPagination.items.value.length === 0 &&
              !borrowedPagination.loading.value
            "
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

          <!-- Content -->
          <div v-else>
            <div class="space-y-4 mb-6">
              <div
                v-for="reservation in borrowedPagination.items.value"
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
                    <h3
                      class="font-medium text-gray-900 dark:text-gray-50 mb-1"
                    >
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

            <!-- Borrowed Pagination -->
            <Pagination
              v-if="borrowedPagination.totalPages.value > 1"
              :current-page="borrowedPagination.currentPage.value"
              :total-items="borrowedPagination.totalItems.value"
              :items-per-page="borrowedPagination.pageSize.value"
              :loading="borrowedPagination.loading.value"
              :show-page-size-selector="true"
              :page-size-options="[5, 10, 20]"
              @page-change="borrowedPagination.goToPage"
              @page-size-change="borrowedPagination.changePageSize"
            />
          </div>
        </div>

        <!-- Lent Items Tab -->
        <div v-if="activeTab === 'lent'">
          <!-- Loading State -->
          <div v-if="lendingPagination.loading.value" class="text-center py-12">
            <BaseLoader size="lg" :text="t('reservations.loading')" />
          </div>

          <!-- Error State -->
          <div
            v-else-if="lendingPagination.error.value"
            class="text-center py-12"
          >
            <PaginationError
              :message="lendingPagination.error.value"
              :disabled="lendingPagination.loading.value"
              @retry="lendingPagination.retry"
              @refresh="lendingPagination.refresh"
              :allowManualRefresh="true"
            />
          </div>

          <!-- Empty State -->
          <div
            v-else-if="
              lendingPagination.items.value.length === 0 &&
              !lendingPagination.loading.value
            "
            class="text-center py-12"
          >
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

          <!-- Content -->
          <div v-else>
            <div class="space-y-4 mb-6">
              <div
                v-for="reservation in lendingPagination.items.value"
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
                    <h3
                      class="font-medium text-gray-900 dark:text-gray-50 mb-1"
                    >
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
                        >From
                        {{ formatDate(reservation.startDate ?? '') }}</span
                      >
                      <span
                        >To {{ formatDate(reservation.endDate ?? '') }}</span
                      >
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

            <!-- Lending Pagination -->
            <Pagination
              v-if="lendingPagination.totalPages.value > 1"
              :current-page="lendingPagination.currentPage.value"
              :total-items="lendingPagination.totalItems.value"
              :items-per-page="lendingPagination.pageSize.value"
              :loading="lendingPagination.loading.value"
              :show-page-size-selector="true"
              :page-size-options="[5, 10, 20]"
              @page-change="lendingPagination.goToPage"
              @page-size-change="lendingPagination.changePageSize"
            />
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import {
  CalendarDaysIcon,
  HandRaisedIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PaginationError from '@/components/common/PaginationError.vue';
import { useAuthStore } from '@/store/auth.store';
import { useReservationsStore } from '@/store/reservations.store';
import { useI18n } from '@/composables/useI18n';
import { usePagination } from '@/composables/usePagination';
import { useUrlPagination } from '@/composables/useUrlPagination';
import type { ReservationStatusModel, ReservationModel } from '@/types/models';
import type { PaginatedResponse } from '@/types/pagination';

const authStore = useAuthStore();
const reservationsStore = useReservationsStore();
const { t } = useI18n();

const { userId } = storeToRefs(authStore);

const activeTab = ref<'borrowed' | 'lent'>('borrowed');

// URL pagination for borrowed reservations
const borrowedUrlPagination = useUrlPagination({
  prefix: 'borrowed',
  defaultPage: 1,
  defaultPageSize: 10,
  allowedPageSizes: [5, 10, 20],
});

// URL pagination for lending reservations
const lendingUrlPagination = useUrlPagination({
  prefix: 'lending',
  defaultPage: 1,
  defaultPageSize: 10,
  allowedPageSizes: [5, 10, 20],
});

// Fetch function for borrowed reservations
const fetchBorrowedReservations = async (
  page: number,
  pageSize: number
): Promise<PaginatedResponse<ReservationModel>> => {
  if (!userId.value) {
    throw new Error('User not authenticated');
  }

  await reservationsStore.fetchBorrowedReservations(
    userId.value,
    page,
    pageSize,
    ['active', 'pending', 'approved', 'returned']
  );

  return {
    data: reservationsStore.borrowedReservations,
    pagination: {
      currentPage: reservationsStore.borrowedPagination.currentPage,
      totalPages: reservationsStore.borrowedPagination.totalPages,
      totalItems: reservationsStore.borrowedPagination.totalItems,
      itemsPerPage: reservationsStore.borrowedPagination.itemsPerPage,
      hasNextPage: reservationsStore.borrowedPagination.hasNextPage,
      hasPreviousPage: reservationsStore.borrowedPagination.hasPreviousPage,
    },
  };
};

// Fetch function for lending reservations
const fetchLendingReservations = async (
  page: number,
  pageSize: number
): Promise<PaginatedResponse<ReservationModel>> => {
  if (!userId.value) {
    throw new Error('User not authenticated');
  }

  await reservationsStore.fetchLendingReservations(
    userId.value,
    page,
    pageSize,
    ['active', 'pending', 'approved', 'returned']
  );

  return {
    data: reservationsStore.lendingReservations,
    pagination: {
      currentPage: reservationsStore.lendingPagination.currentPage,
      totalPages: reservationsStore.lendingPagination.totalPages,
      totalItems: reservationsStore.lendingPagination.totalItems,
      itemsPerPage: reservationsStore.lendingPagination.itemsPerPage,
      hasNextPage: reservationsStore.lendingPagination.hasNextPage,
      hasPreviousPage: reservationsStore.lendingPagination.hasPreviousPage,
    },
  };
};

// Pagination composables
const borrowedPagination = usePagination({
  initialPage: borrowedUrlPagination.currentPage.value,
  initialPageSize: borrowedUrlPagination.pageSize.value,
  fetchFunction: fetchBorrowedReservations,
});

const lendingPagination = usePagination({
  initialPage: lendingUrlPagination.currentPage.value,
  initialPageSize: lendingUrlPagination.pageSize.value,
  fetchFunction: fetchLendingReservations,
});

// Sync pagination with URL
// Watch borrowed pagination changes and sync with URL
import { watch } from 'vue';

watch(
  [borrowedPagination.currentPage, borrowedPagination.pageSize],
  ([page, pageSize]) => {
    borrowedUrlPagination.updatePagination(page, pageSize);
  }
);

watch(
  [lendingPagination.currentPage, lendingPagination.pageSize],
  ([page, pageSize]) => {
    lendingUrlPagination.updatePagination(page, pageSize);
  }
);

// Sync URL changes back to pagination
watch(
  [borrowedUrlPagination.currentPage, borrowedUrlPagination.pageSize],
  ([page, pageSize]) => {
    if (page !== borrowedPagination.currentPage.value) {
      borrowedPagination.goToPage(page);
    }
    if (pageSize !== borrowedPagination.pageSize.value) {
      borrowedPagination.changePageSize(pageSize);
    }
  }
);

watch(
  [lendingUrlPagination.currentPage, lendingUrlPagination.pageSize],
  ([page, pageSize]) => {
    if (page !== lendingPagination.currentPage.value) {
      lendingPagination.goToPage(page);
    }
    if (pageSize !== lendingPagination.pageSize.value) {
      lendingPagination.changePageSize(pageSize);
    }
  }
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
    // Refresh current tab's pagination to reflect changes
    await lendingPagination.refresh();
  } catch (error) {
    console.error('Error approving reservation:', error);
  }
}

async function rejectReservation(id: string) {
  try {
    await reservationsStore.updateReservationStatus(id, 'cancelled');
    // Refresh current tab's pagination to reflect changes
    await lendingPagination.refresh();
  } catch (error) {
    console.error('Error rejecting reservation:', error);
  }
}

async function returnItem(id: string) {
  try {
    await reservationsStore.updateReservationStatus(id, 'returned');
    // Refresh current tab's pagination to reflect changes
    await borrowedPagination.refresh();
  } catch (error) {
    console.error('Error returning item:', error);
  }
}

async function cancelReservation(id: string) {
  try {
    await reservationsStore.updateReservationStatus(id, 'cancelled');
    // Refresh current tab's pagination to reflect changes
    await borrowedPagination.refresh();
  } catch (error) {
    console.error('Error cancelling reservation:', error);
  }
}

onMounted(() => {
  // Pagination composables will automatically fetch data on mount
  // No need to manually load reservations
});
</script>
