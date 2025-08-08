<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <router-link to="/" class="flex items-center justify-center space-x-2 text-primary-600 mb-6">
          <div class="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold">LoT</span>
          </div>
          <span class="font-bold text-xl">Library of Things</span>
        </router-link>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
        <p class="text-gray-600">Join our community and start sharing</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            autocomplete="name"
            required
            class="input"
            :class="{ 'border-error-500': errors.displayName }"
            placeholder="Enter your full name"
          />
          <p v-if="errors.displayName" class="mt-1 text-sm text-error-600">{{ errors.displayName }}</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            class="input"
            :class="{ 'border-error-500': errors.email }"
            placeholder="Enter your email"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-error-600">{{ errors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            required
            class="input"
            :class="{ 'border-error-500': errors.password }"
            placeholder="Create a password"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-error-600">{{ errors.password }}</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            class="input"
            :class="{ 'border-error-500': errors.confirmPassword }"
            placeholder="Confirm your password"
          />
          <p v-if="errors.confirmPassword" class="mt-1 text-sm text-error-600">{{ errors.confirmPassword }}</p>
        </div>

        <div v-if="authStore.error" class="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-md">
          <p class="text-sm">{{ authStore.error }}</p>
        </div>

        <div class="space-y-4">
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full btn-primary flex items-center justify-center"
          >
            <BaseLoader v-if="authStore.isLoading" size="sm" class="mr-2" />
            {{ authStore.isLoading ? 'Creating account...' : 'Create account' }}
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            @click="handleGoogleSignIn"
            :disabled="authStore.isLoading"
            class="w-full btn-secondary flex items-center justify-center"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div class="text-center">
          <span class="text-sm text-gray-600">Already have an account? </span>
          <router-link to="/login" class="text-sm font-medium text-primary-600 hover:text-primary-500">
            Sign in here
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const errors = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
});

function validateForm(): boolean {
  let isValid = true;

  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  // Validate display name
  if (!form.displayName.trim()) {
    errors.displayName = 'Full name is required';
    isValid = false;
  } else if (form.displayName.trim().length < 2) {
    errors.displayName = 'Full name must be at least 2 characters';
    isValid = false;
  }

  // Validate email
  if (!form.email) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }

  // Validate password
  if (!form.password) {
    errors.password = 'Password is required';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
    isValid = false;
  }

  // Validate password confirmation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
    isValid = false;
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
    isValid = false;
  }

  return isValid;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  try {
    await authStore.signUpWithEmail(form.email, form.password, form.displayName.trim());
    router.push('/dashboard');
  } catch (error) {
    // Error is handled in the store
  }
}

async function handleGoogleSignIn() {
  try {
    await authStore.signInWithGoogle();
    router.push('/dashboard');
  } catch (error) {
    // Error is handled in the store
  }
}

// Clear errors when component unmounts
onUnmounted(() => {
  authStore.clearError();
});
</script>