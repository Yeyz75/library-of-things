import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthAPI } from '@/api';
import { show as showUser, save as saveUser } from '@/api/users';
import type { UserModel } from '@/types/models';
import type { Models, OAuthProvider } from 'appwrite';

export const useAuthStore = defineStore('auth', () => {
  // State
  const appwriteUser = ref<Models.User<Models.Preferences> | null>(null);
  const userData = ref<UserModel | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => appwriteUser.value !== null);
  const currentUser = computed(() => userData.value);
  const userId = computed(() => appwriteUser.value?.$id || null);

  // Actions
  async function signInWithEmail(email: string, password: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await AuthAPI.login({ email, password });
      if (response.success) {
        await getCurrentUser();
      } else {
        throw new Error(response.error || 'Failed to sign in');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to sign in';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function signInWithGoogle() {
    isLoading.value = true;
    error.value = null;

    try {
      // Crear URLs de callback
      const successUrl = `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/login?error=oauth_failed`;

      // Iniciar el flujo OAuth2 con Google
      // Esto redirigirá automáticamente al proveedor OAuth
      await AuthAPI.createOAuth2Session(
        'google' as OAuthProvider,
        successUrl,
        failureUrl
      );

      // La función no retorna aquí porque hay una redirección
      // El manejo se completa en AuthCallback.vue
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to sign in with Google';
      error.value = errorMessage;
      isLoading.value = false;
      throw err;
    }
  }

  async function signUpWithEmail(
    email: string,
    password: string,
    name: string
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      // Create account
      const registerResponse = await AuthAPI.register({
        email,
        password,
        name,
      });
      if (!registerResponse.success) {
        throw new Error(registerResponse.error || 'Failed to create account');
      }

      // Create session
      const loginResponse = await AuthAPI.login({ email, password });
      if (!loginResponse.success) {
        throw new Error(loginResponse.error || 'Failed to sign in');
      }

      // Create user document in database
      const userResponse = await saveUser(
        {
          email,
          name,
          avatarUrl: '',
        },
        registerResponse.data?.$id
      );

      if (!userResponse.success) {
        console.warn('Failed to create user document:', userResponse.error);
      }

      await getCurrentUser();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to sign up';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function signOut() {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await AuthAPI.logout();
      if (response.success) {
        appwriteUser.value = null;
        userData.value = null;
      } else {
        throw new Error(response.error || 'Failed to sign out');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to sign out';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function getCurrentUser() {
    try {
      const response = await AuthAPI.getCurrentUser();
      if (response.success && response.data) {
        appwriteUser.value = response.data as Models.User<Models.Preferences>;
        // Load user data from database
        try {
          const userResponse = await showUser(response.data.$id);
          if (userResponse.success && userResponse.data) {
            userData.value = userResponse.data;
          } else {
            throw new Error('User document not found');
          }
        } catch {
          // If user document doesn't exist, create it
          const createResponse = await saveUser(
            {
              email: response.data.email,
              name: response.data.name,
              avatarUrl: '',
            },
            response.data.$id
          );
          if (createResponse.success && createResponse.data) {
            userData.value = createResponse.data;
          }
        }
      } else {
        throw new Error(response.error || 'Failed to get current user');
      }
    } catch (err: unknown) {
      // Clear user data on any error (including 401 Unauthorized)
      appwriteUser.value = null;
      userData.value = null;
      // Only log error if it's not a 401 (user not authenticated) or 404 (session not found)
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        'type' in err &&
        err.code !== 401 &&
        err.code !== 404 &&
        err.type !== 'general_unauthorized_scope'
      ) {
        console.error('Error getting current user:', err);
      }
    }
  }

  async function initializeAuth() {
    isLoading.value = true;
    try {
      await getCurrentUser();
    } catch (err: unknown) {
      // User not logged in - this is expected behavior
      // Only log if it's an unexpected error
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        'type' in err &&
        err.code !== 401 &&
        err.code !== 404 &&
        err.type !== 'general_unauthorized_scope'
      ) {
        console.error('Unexpected error during auth initialization:', err);
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function handleOAuthCallback() {
    isLoading.value = true;
    error.value = null;

    try {
      // Verificar la sesión OAuth después del callback
      const response = await AuthAPI.handleOAuthCallback();
      if (response.success && response.data) {
        appwriteUser.value = response.data as Models.User<Models.Preferences>;

        // Intentar cargar los datos del usuario desde la base de datos
        try {
          const userResponse = await showUser(response.data.$id);
          if (userResponse.success && userResponse.data) {
            userData.value = userResponse.data;
          } else {
            throw new Error('User document not found');
          }
        } catch {
          // Si el documento del usuario no existe, crearlo automáticamente
          const createResponse = await saveUser(
            {
              email: response.data.email,
              name: response.data.name,
              avatarUrl: '',
            },
            response.data.$id
          );

          if (createResponse.success && createResponse.data) {
            userData.value = createResponse.data;
          } else {
            throw new Error('Failed to create user document');
          }
        }
      } else {
        throw new Error(response.error || 'OAuth callback failed');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'OAuth callback failed';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    appwriteUser,
    userData,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    currentUser,
    userId,
    // Actions
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
    getCurrentUser,
    initializeAuth,
    handleOAuthCallback,
    clearError,
  };
});
