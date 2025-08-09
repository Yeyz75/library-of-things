<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <nav class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex-shrink-0">
          <router-link
            to="/"
            class="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <div
              class="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center"
            >
              <span class="text-white font-bold text-sm">LoT</span>
            </div>
            <span class="font-bold text-lg hidden sm:block"
              >Library of Things</span
            >
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link
            to="/"
            class="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-primary-600 bg-primary-50"
          >
            Browse Items
          </router-link>
          <router-link
            v-if="isAuthenticated"
            to="/dashboard"
            class="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-primary-600 bg-primary-50"
          >
            Dashboard
          </router-link>
          <router-link
            v-if="isAuthenticated"
            to="/items/new"
            class="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-primary-600 bg-primary-50"
          >
            Add Item
          </router-link>
        </div>

        <!-- User Menu / Auth Buttons -->
        <div class="flex items-center space-x-4">
          <div v-if="isAuthenticated" class="relative">
            <!-- User Avatar/Menu -->
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full p-1"
            >
              <img
                v-if="currentUser?.avatarUrl"
                :src="currentUser.avatarUrl"
                :alt="currentUser.name"
                class="h-8 w-8 rounded-full object-cover"
              />
              <div
                v-else
                class="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center"
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
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
              >
                <router-link
                  to="/profile"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  @click="showUserMenu = false"
                >
                  Profile
                </router-link>
                <router-link
                  to="/reservations"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  @click="showUserMenu = false"
                >
                  My Reservations
                </router-link>
                <hr class="border-gray-200 my-1" />
                <button
                  @click="handleSignOut"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
              class="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
            class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
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
          class="md:hidden py-3 border-t border-gray-200"
        >
          <div class="space-y-1">
            <router-link
              to="/"
              class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
              active-class="text-primary-600 bg-primary-50"
              @click="showMobileMenu = false"
            >
              Browse Items
            </router-link>
            <router-link
              v-if="isAuthenticated"
              to="/dashboard"
              class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
              active-class="text-primary-600 bg-primary-50"
              @click="showMobileMenu = false"
            >
              Dashboard
            </router-link>
            <router-link
              v-if="isAuthenticated"
              to="/items/new"
              class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
              active-class="text-primary-600 bg-primary-50"
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/store/auth.store';
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline';
const router = useRouter();
const authStore = useAuthStore();

const showUserMenu = ref(false);
const showMobileMenu = ref(false);

const { isAuthenticated, currentUser } = storeToRefs(authStore);

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
