import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  account,
  databases,
  DATABASE_ID,
  COLLECTIONS,
  ID,
} from '@/lib/appwrite';
import type { User } from '@/types';
import type { Models } from 'appwrite';

export const useAuthStore = defineStore('auth', () => {
  // State
  const appwriteUser = ref<Models.User<Models.Preferences> | null>(null);
  const userData = ref<User | null>(null);
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
      await account.createEmailPasswordSession(email, password);
      await getCurrentUser();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to sign in';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
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
      const user = await account.create(ID.unique(), email, password, name);

      // Create session
      await account.createEmailPasswordSession(email, password);

      // Create user document in database
      await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id, {
        email: user.email,
        name: user.name,
        avatarUrl: '',
      });

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
      await account.deleteSession('current');
      appwriteUser.value = null;
      userData.value = null;
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
      const user = await account.get();
      appwriteUser.value = user;

      // Load user data from database
      try {
        const userDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          user.$id
        );
        userData.value = userDoc as unknown as User;
      } catch {
        // If user document doesn't exist, create it
        const newUserDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USERS,
          user.$id,
          {
            email: user.email,
            name: user.name,
            avatarUrl: '',
          }
        );
        userData.value = newUserDoc as unknown as User;
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
    signUpWithEmail,
    signOut,
    getCurrentUser,
    initializeAuth,
    clearError,
  };
});
