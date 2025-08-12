import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthAPI } from '@/api';
import { show as showUser, save as saveUser } from '@/api/users';
import type { UserModel } from '@/types/models';
import type { Models } from 'appwrite';

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
      // Create OAuth2 token for Google
      /*     const successUrl = `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/login?error=oauth_failed`; */

      // Note: OAuth2 functionality would need to be added to AuthAPI
      // For now, we'll throw an error indicating it's not implemented
      throw new Error('Google OAuth not implemented in AuthAPI yet');
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
    clearError,
  };
});
