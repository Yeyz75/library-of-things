<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 glass border-b border-neutral-200/20 dark:border-neutral-800/20 backdrop-blur-xl transition-all duration-300"
  >
    <nav class="container">
      <div class="flex items-center justify-between h-16">
        <!-- Logo con nuevo diseño -->
        <div class="flex-shrink-0">
          <router-link
            to="/"
            class="flex items-center space-x-3 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-200 group"
          >
            <div
              class="h-10 w-10 gradient-cosmic rounded-xl flex items-center justify-center shadow-primary hover:shadow-glow transition-all duration-300 group-hover:scale-105"
            >
              <span class="text-white font-display font-bold text-sm">LoT</span>
            </div>
            <span
              class="font-display font-bold text-xl hidden sm:block text-neutral-900 dark:text-neutral-100"
              >Library of Things</span
            >
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-2">
          <router-link
            to="/"
            class="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
          >
            {{ t('header.home') }}
          </router-link>
          <router-link
            to="/search"
            class="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
          >
            {{ t('header.browseItems') }}
          </router-link>
        </div>

        <!-- User Menu / Auth Buttons -->
        <div class="flex items-center space-x-3">
          <!-- Language Toggle -->
          <LanguageToggle />

          <!-- Theme Toggle -->
          <ThemeToggle />

          <div v-if="isAuthenticated" class="relative">
            <!-- User Avatar/Menu -->
            <button
              @click.stop="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 focus-ring rounded-xl p-2 transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <img
                v-if="currentUser?.avatarUrl"
                :src="currentUser.avatarUrl"
                :alt="currentUser.name"
                class="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
              />
              <div
                v-else
                class="h-8 w-8 rounded-full gradient-primary flex items-center justify-center ring-2 ring-neutral-200 dark:ring-neutral-700 shadow-primary"
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
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showUserMenu"
                v-click-outside="() => (showUserMenu = false)"
                class="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 py-2 z-50 border border-neutral-200/20 dark:border-neutral-800/20"
              >
                <div
                  class="px-4 py-3 border-b border-neutral-200/20 dark:border-neutral-800/20"
                >
                  <p
                    class="text-sm font-semibold text-neutral-900 dark:text-white font-display"
                  >
                    {{ currentUser?.name || currentUser?.email }}
                  </p>
                  <p
                    class="text-xs text-neutral-500 dark:text-neutral-400 font-body"
                  >
                    {{ t('header.dashboard') }}
                  </p>
                </div>
                <router-link
                  to="/dashboard"
                  class="interactive-subtle block px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 font-body"
                  @click="showUserMenu = false"
                >
                  {{ t('header.dashboard') }}
                </router-link>
                <router-link
                  to="/profile"
                  class="interactive-subtle block px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 font-body"
                  @click="showUserMenu = false"
                >
                  {{ t('header.profile') }}
                </router-link>
                <router-link
                  to="/reservations"
                  class="interactive-subtle block px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 font-body"
                  @click="showUserMenu = false"
                >
                  {{ t('header.myReservations') }}
                </router-link>
                <div class="divider-gradient my-2"></div>
                <router-link
                  to="/help"
                  class="interactive-subtle block px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 font-body"
                  @click="showUserMenu = false"
                >
                  {{ t('header.help') }}
                </router-link>
                <router-link
                  to="/donations"
                  class="interactive-subtle block px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 font-body"
                  @click="showUserMenu = false"
                >
                  {{ t('header.donations') }}
                </router-link>
                <div class="divider-gradient my-2"></div>
                <button
                  @click="handleSignOut"
                  class="interactive-subtle block w-full text-left px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 font-body"
                >
                  {{ t('header.signOut') }}
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
              {{ t('header.signIn') }}
            </router-link>
            <router-link to="/register" class="btn-primary text-sm">
              {{ t('header.signUp') }}
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
              {{ t('header.home') }}
            </router-link>
            <router-link
              to="/search"
              class="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              @click="showMobileMenu = false"
            >
              {{ t('header.browseItems') }}
            </router-link>
            <button
              @click="
                showSearchModal = true;
                showMobileMenu = false;
              "
              class="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              {{ t('common.search') }}
            </button>
            <hr class="border-gray-200 dark:border-gray-700 my-1" />
            <router-link
              v-if="isAuthenticated"
              to="/dashboard"
              class="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              @click="showMobileMenu = false"
            >
              {{ t('header.dashboard') }}
            </router-link>
            <router-link
              v-if="isAuthenticated"
              to="/reservations"
              class="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              @click="showMobileMenu = false"
            >
              {{ t('header.myReservations') }}
            </router-link>
            <router-link
              to="/help"
              class="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              @click="showMobileMenu = false"
            >
              {{ t('header.help') }}
            </router-link>
            <router-link
              to="/donations"
              class="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              @click="showMobileMenu = false"
            >
              {{ t('header.donations') }}
            </router-link>
          </div>
        </div>
      </transition>
    </nav>

    <!-- Search Modal -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      enter-to-class="opacity-100 translate-y-0 sm:scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 sm:scale-100"
      leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    >
      <div v-if="showSearchModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        >
          <div
            class="fixed inset-0 transition-opacity"
            @click="showSearchModal = false"
          >
            <div class="absolute inset-0 bg-black opacity-50"></div>
          </div>

          <div
            class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          >
            <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div
                  class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full"
                >
                  <h3
                    class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4"
                  >
                    {{ t('common.search') }}
                  </h3>
                  <SearchBar
                    ref="searchModalBar"
                    :placeholder="t('searchBar.placeholder')"
                    @search="handleSearchModalWrapper"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
            <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                @click="showSearchModal = false"
              >
                {{ t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, Ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useI18n } from '@/composables/useI18n';
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import LanguageToggle from '@/components/common/LanguageToggle.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import type { UserModel as User } from '@/types/models';

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const { t } = useI18n();

const showUserMenu = ref(false);
const showMobileMenu = ref(false);
const showSearchModal = ref(false);
const searchModalBar = ref<typeof SearchBar | null>(null);

const { isAuthenticated, currentUser } = storeToRefs(authStore) as unknown as {
  isAuthenticated: Ref<boolean>;
  currentUser: Ref<User | null>;
};

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

function handleSearch(
  query: string,
  filters: Record<string, string | undefined>
) {
  // Close mobile menu if open
  showMobileMenu.value = false;
  showSearchModal.value = false;

  // Navigate to search results or home page with search params
  const queryParams: Record<string, string> = { search: query };

  if (filters && typeof filters === 'object') {
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams[key] = filters[key] as string;
      }
    });
  }

  router.push({
    path: '/search',
    query: queryParams,
  });
}

function handleSearchModal(
  query: string,
  filters: Record<string, string | undefined>
) {
  handleSearch(query, filters);
}

function handleSearchModalWrapper() {
  // Obtener los valores del SearchBar usando la referencia
  const searchBar = searchModalBar.value;
  if (searchBar && searchBar.query && searchBar.filters) {
    // Filtrar solo los pares clave-valor donde el valor sea string o undefined
    const validFilters: Record<string, string | undefined> = {};
    Object.entries(searchBar.filters).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'undefined') {
        validFilters[key] = value;
      }
    });
    handleSearchModal(searchBar.query, validFilters);
  }
}

// Focus the search bar when the modal opens
watch(showSearchModal, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (searchModalBar.value) {
        const input = searchModalBar.value.$el.querySelector('input');
        if (input) {
          input.focus();
        }
      }
    });
  }
});
</script>
