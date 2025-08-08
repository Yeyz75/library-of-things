import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@/services/auth.service';
import type { User } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  // State
  const firebaseUser = ref<FirebaseUser | null>(null);
  const userData = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => firebaseUser.value !== null);
  const currentUser = computed(() => userData.value);
  const userId = computed(() => firebaseUser.value?.uid || null);

  // Actions
  async function signInWithEmail(email: string, password: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const user = await authService.signInWithEmail(email, password);
      firebaseUser.value = user;
      await loadUserData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sign in';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function signUpWithEmail(email: string, password: string, displayName: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const user = await authService.signUpWithEmail(email, password, displayName);
      firebaseUser.value = user;
      await loadUserData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sign up';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function signInWithGoogle() {
    isLoading.value = true;
    error.value = null;

    try {
      const user = await authService.signInWithGoogle();
      firebaseUser.value = user;
      await loadUserData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sign in with Google';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function signOut() {
    isLoading.value = true;
    error.value = null;

    try {
      await authService.signOut();
      firebaseUser.value = null;
      userData.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sign out';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadUserData() {
    if (!firebaseUser.value) {
      userData.value = null;
      return;
    }

    try {
      const data = await authService.getCurrentUserData();
      userData.value = data;
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }

  function initializeAuth() {
    return authService.onAuthStateChanged(async (user) => {
      firebaseUser.value = user;
      if (user) {
        await loadUserData();
      } else {
        userData.value = null;
      }
    });
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    firebaseUser,
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
    signInWithGoogle,
    signOut,
    loadUserData,
    initializeAuth,
    clearError,
  };
});