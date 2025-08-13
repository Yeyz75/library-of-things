<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="flex justify-between items-center mb-6">
          <router-link
            to="/"
            class="flex items-center justify-center space-x-2 text-primary-600"
          >
            <div
              class="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center"
            >
              <span class="text-white font-bold">LoT</span>
            </div>
            <span class="font-bold text-xl">Library of Things</span>
          </router-link>
          <router-link
            to="/"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </router-link>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {{ t('auth.login.title') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-300">
          {{ t('auth.login.subtitle') }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ t('auth.login.email') }}
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            class="input"
            :class="{ 'border-error-500': errors.email }"
            :placeholder="t('auth.login.emailPlaceholder')"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-error-600">
            {{ errors.email }}
          </p>
        </div>

        <div>
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ t('auth.login.password') }}
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            class="input"
            :class="{ 'border-error-500': errors.password }"
            :placeholder="t('auth.login.passwordPlaceholder')"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-error-600">
            {{ errors.password }}
          </p>
        </div>

        <div
          v-if="authStore.error"
          class="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-600 dark:text-error-400 px-4 py-3 rounded-md"
        >
          <p class="text-sm">{{ authStore.error }}</p>
        </div>

        <div class="space-y-4">
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full btn-primary flex items-center justify-center"
          >
            <BaseLoader v-if="authStore.isLoading" size="sm" class="mr-2" />
            {{
              authStore.isLoading
                ? t('auth.login.signingIn')
                : t('auth.login.signIn')
            }}
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div
                class="w-full border-t border-gray-300 dark:border-gray-600"
              />
            </div>
            <div class="relative flex justify-center text-sm">
              <span
                class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
                >{{ t('auth.login.or') }}</span
              >
            </div>
          </div>

          <button
            type="button"
            @click="handleGoogleSignIn"
            :disabled="authStore.isLoading || isGoogleLoading"
            class="w-full btn-secondary flex items-center justify-center"
          >
            <BaseLoader v-if="isGoogleLoading" size="sm" class="mr-2" />
            <svg v-else class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {{
              isGoogleLoading
                ? t('auth.login.signingIn')
                : t('auth.login.continueWithGoogle')
            }}
          </button>
        </div>

        <div class="text-center space-x-2">
          <span class="text-sm text-gray-600 dark:text-gray-400"
            >{{ t('auth.login.noAccount') }}
          </span>
          <router-link
            to="/register"
            class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
          >
            {{ t('auth.login.signUpHere') }}
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

// Manejar errores de OAuth desde la URL
if (route.query.error === 'oauth_failed') {
  authStore.error = t('auth.login.errors.oauthFailed');
}

const form = reactive({
  email: '',
  password: '',
});

const errors = reactive({
  email: '',
  password: '',
});

const isGoogleLoading = ref(false);

function validateForm(): boolean {
  let isValid = true;

  // Reset errors
  errors.email = '';
  errors.password = '';

  // Validate email
  if (!form.email) {
    errors.email = t('auth.login.errors.emailRequired');
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = t('auth.login.errors.emailInvalid');
    isValid = false;
  }

  // Validate password
  if (!form.password) {
    errors.password = t('auth.login.errors.passwordRequired');
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = t('auth.login.errors.passwordTooShort');
    isValid = false;
  }

  return isValid;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  try {
    await authStore.signInWithEmail(form.email, form.password);

    // Redirect to intended page or dashboard
    const redirectTo = (route.query.redirect as string) || '/dashboard';
    router.push(redirectTo);
  } catch {
    // Error is handled in the store
  }
}

async function handleGoogleSignIn() {
  isGoogleLoading.value = true;
  try {
    await authStore.signInWithGoogle();
    // La redirección se maneja automáticamente por OAuth
    // No necesitamos hacer nada más aquí
  } catch {
    // Error is handled in the store
    isGoogleLoading.value = false;
  }
}

// Clear errors when component unmounts
onUnmounted(() => {
  authStore.clearError();
});
</script>
