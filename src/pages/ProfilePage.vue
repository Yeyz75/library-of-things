<template>
  <AppLayout>
    <div class="container py-8">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

        <div class="card">
          <div class="flex items-center space-x-6 mb-8">
            <div class="relative">
              <img
                v-if="currentUser?.photoURL"
                :src="currentUser.photoURL"
                :alt="currentUser.displayName"
                class="h-24 w-24 rounded-full object-cover"
              >
              <div
                v-else
                class="h-24 w-24 rounded-full bg-primary-600 flex items-center justify-center"
              >
                <span class="text-white text-2xl font-medium">
                  {{ currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U' }}
                </span>
              </div>
            </div>
            <div>
              <h2 class="text-2xl font-semibold text-gray-900">{{ currentUser?.displayName || 'User' }}</h2>
              <p class="text-gray-600">{{ currentUser?.email }}</p>
              <p class="text-sm text-gray-500 mt-1">
                Member since {{ formatDate(currentUser?.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Profile Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 py-6 border-t border-b border-gray-200">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary-600">{{ userItemsCount }}</div>
              <div class="text-sm text-gray-600">Items Shared</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-secondary-600">{{ totalBorrowedCount }}</div>
              <div class="text-sm text-gray-600">Items Borrowed</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-accent-600">{{ completedReservationsCount }}</div>
              <div class="text-sm text-gray-600">Completed Exchanges</div>
            </div>
          </div>

          <!-- Account Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  :value="currentUser?.displayName || ''"
                  disabled
                  class="input bg-gray-50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  :value="currentUser?.email || ''"
                  disabled
                  class="input bg-gray-50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                <input
                  type="text"
                  :value="formatDate(currentUser?.createdAt)"
                  disabled
                  class="input bg-gray-50"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="flex flex-col sm:flex-row gap-4">
              <button
                @click="handleSignOut"
                :disabled="isSigningOut"
                class="btn-danger flex items-center justify-center"
              >
                <BaseLoader v-if="isSigningOut" size="sm" class="mr-2" />
                {{ isSigningOut ? 'Signing out...' : 'Sign Out' }}
              </button>
              <router-link to="/dashboard" class="btn-secondary">
                Back to Dashboard
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';
import { useItemsStore } from '@/store/items.store';
import { useReservationsStore } from '@/store/reservations.store';

const router = useRouter();
const authStore = useAuthStore();
const itemsStore = useItemsStore();
const reservationsStore = useReservationsStore();

const { currentUser, userId } = storeToRefs(authStore);

const isSigningOut = ref(false);

// Computed properties for stats
const userItemsCount = computed(() =>
  itemsStore.items.filter(item => item.ownerId === userId.value).length
);

const totalBorrowedCount = computed(() =>
  reservationsStore.reservations.filter(r => 
    r.borrowerId === userId.value && (r.status === 'active' || r.status === 'returned')
  ).length
);

const completedReservationsCount = computed(() =>
  reservationsStore.reservations.filter(r => 
    (r.ownerId === userId.value || r.borrowerId === userId.value) && r.status === 'returned'
  ).length
);

function formatDate(date?: Date): string {
  if (!date) return 'Unknown';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

async function handleSignOut() {
  isSigningOut.value = true;
  
  try {
    await authStore.signOut();
    router.push('/');
  } catch (error) {
    console.error('Error signing out:', error);
  } finally {
    isSigningOut.value = false;
  }
}

onMounted(async () => {
  if (userId.value) {
    // Load user's items and reservations for stats
    await Promise.all([
      itemsStore.fetchItems({ ownerId: userId.value }),
      reservationsStore.fetchReservations()
    ]);
  }
});
</script>