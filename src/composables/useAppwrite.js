// Composable para usar Appwrite en componentes Vue
import { ref, reactive } from 'vue';
import { appwriteService } from '@/lib/appwrite';

export function useAppwrite() {
  const loading = ref(false);
  const error = ref(null);

  // Estado reactivo para datos
  const state = reactive({
    users: [],
    items: [],
    reservations: [],
    currentUser: null,
  });

  // Helper para manejar errores
  const handleError = (err) => {
    error.value = err.message || 'Ha ocurrido un error';
    console.error('Appwrite Error:', err);
  };

  // Funciones para usuarios
  const loadUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await appwriteService.getUsers();
      state.users = response.documents;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  };

  const createUser = async (userData) => {
    loading.value = true;
    error.value = null;
    try {
      const newUser = await appwriteService.createUser(userData);
      state.users.push(newUser);
      return newUser;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Funciones para items
  const loadItems = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await appwriteService.getItems();
      state.items = response.documents;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  };

  const createItem = async (itemData) => {
    loading.value = true;
    error.value = null;
    try {
      const newItem = await appwriteService.createItem(itemData);
      state.items.push(newItem);
      return newItem;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Funciones para reservations
  const loadReservations = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await appwriteService.getReservations();
      state.reservations = response.documents;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  };

  const createReservation = async (reservationData) => {
    loading.value = true;
    error.value = null;
    try {
      const newReservation =
        await appwriteService.createReservation(reservationData);
      state.reservations.push(newReservation);
      return newReservation;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Funciones de autenticación
  const loadCurrentUser = async () => {
    try {
      state.currentUser = await appwriteService.getCurrentUser();
    } catch {
      state.currentUser = null;
    }
  };

  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    try {
      await appwriteService.login(email, password);
      await loadCurrentUser();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (email, password, name) => {
    loading.value = true;
    error.value = null;
    try {
      await appwriteService.register(email, password, name);
      await login(email, password);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    loading.value = true;
    error.value = null;
    try {
      await appwriteService.logout();
      state.currentUser = null;
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  };

  return {
    // Estado
    loading,
    error,
    state,

    // Usuarios
    loadUsers,
    createUser,

    // Items
    loadItems,
    createItem,

    // Reservations
    loadReservations,
    createReservation,

    // Autenticación
    loadCurrentUser,
    login,
    register,
    logout,
  };
}
