<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
  >
    <div class="text-center">
      <BaseLoader size="lg" class="mx-auto" />
      <h2 class="mt-4 text-xl font-medium text-gray-900 dark:text-white">
        {{ t('auth.callback.processing') }}
      </h2>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        {{ t('auth.callback.pleaseWait') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/store/auth.store';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

onMounted(async () => {
  try {
    // Manejar el callback de OAuth y crear/obtener usuario
    await authStore.handleOAuthCallback();
    router.push('/dashboard');
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    router.push('/login?error=oauth_failed');
  }
});
</script>
