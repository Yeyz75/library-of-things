<template>
  <header
    class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300"
  >
    <nav class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex-shrink-0">
          <router-link
            to="/"
            class="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <div
              class="h-8 w-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center hover-glow"
            >
              <span class="text-white font-bold text-sm">LoT</span>
            </div>
            <span
              class="font-bold text-lg hidden sm:block text-gray-900 dark:text-gray-100"
              >Library of Things</span
            >
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link
            to="/"
            class="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
          >
            Browse Items
          </router-link>
          <router-link
            v-if="isAuthenticated"
            to="/dashboard"
            class="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
          >
            Dashboard
          </router-link>
          <router-link
            v-if="isAuthenticated"
            to="/items/new"
            class="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
          >
            Add Item
          </router-link>
        </div>

        <!-- User Menu / Auth Buttons -->
        <div class="flex items-center space-x-4">
          <!-- Theme Toggle -->
          <ThemeToggle />

          <div v-if="isAuthenticated" class="relative">
            <!-- User Avatar/Menu -->
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-full p-1 transition-all duration-200"
            >
              <img
                v-if="currentUser?.avatarUrl"
                :src="currentUser.avatarUrl"
                :alt="currentUser.name"
                class="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              />
              <div
                v-else
                class="h-8 w-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700 hover-glow"
              >
                <span class="text-white text-sm font-medium">
                  {{
                    currentUser?.name?.charAt(0) ||
                    currentUser?.email?.charAt(0) ||
                    'U'
                  }}
                </span>
              </div>
            </button>

            <!-- User Dropdown -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showUserMenu"
                v-click-outside="() => (showUserMenu = false)"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 py-1 z-50 border border-gray-200 dark:border-gray-700"
              >
                <router-link
                  to="/profile"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="showUserMenu = false"
                >
                  Profile
                </router-link>
                <router-link
                  to="/reservations"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="showUserMenu = false"
                >
                  My Reservations
                </router-link>
                <hr class="border-gray-200 dark:border-gray-700 my-1" />
                <button
                  @click="handleSignOut"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </transition>
          </div>

          <!-- Auth Buttons -->
          <div v-else class="flex items-center space-x-3">
            <router-link
              to="/login"
              class="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </router-link>
            <router-link to="/register" class="btn-primary text-sm">
              Sign Up
            </router-link>
          </div>

          <!-- Mobile menu button -->
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors"
          >
            <Bars3Icon v-if="!showMobileMenu" class="h-6 w-6" />
            <XMarkIcon v-else class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="showMobileMenu"
          class="md:hidden py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        >
          <div class="space-y-1">
            <router-link
              to="/"
              class="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              @click="showMobileMenu = false"
            >
              Browse Items
            </router-link>
            <router-link
              v-if="isAuthenticated"
              to="/dashboard"
              class="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              @click="showMobileMenu = false"
            >
              Dashboard
            </router-link>
            <router-link
              v-if="isAuthenticated"
              to="/items/new"
              class="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              @click="showMobileMenu = false"
            >
              Add Item
            </router-link>
          </div>
        </div>
      </transition>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline';
import ThemeToggle from '@/components/common/ThemeToggle.vue';

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const showUserMenu = ref(false);
const showMobileMenu = ref(false);

const { isAuthenticated, currentUser } = storeToRefs(authStore);

// Initialize theme on component mount
onMounted(() => {
  themeStore.initTheme();
});

async function handleSignOut() {
  try {
    await authStore.signOut();
    showUserMenu.value = false;
    router.push('/');
  } catch (error) {
    console.error('Error signing out:', error);
  }
}
</script>
