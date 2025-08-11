// Composable para usar Appwrite en componentes Vue
import { ref, reactive } from 'vue';
import { userService } from '@/services/userService';
import { itemService } from '@/services/itemService';
import { reservationService } from '@/services/reservationService';
import {
  account,
  databases,
  DATABASE_ID,
  COLLECTIONS,
  ID,
} from '@/lib/appwrite';
import type { UserModel, ItemModel, ReservationModel } from '@/types/models';
import type {
  UseAppwriteAppwriteStateModel,
  UseAppwriteCreateUserDataModel,
  UseAppwriteCreateItemDataModel,
  UseAppwriteCreateReservationDataModel,
} from '@/types/models';

export function useAppwrite() {
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Estado reactivo para datos
  const state = reactive<UseAppwriteAppwriteStateModel>({
    users: [],
    items: [],
    reservations: [],
    currentUser: null,
  });

  // Helper para manejar errores
  const handleError = (err: Error | unknown): void => {
    const message = err instanceof Error ? err.message : 'Ha ocurrido un error';
    error.value = message;
    console.error('Appwrite Error:', err);
  };

  // Funciones para usuarios
  const loadUsers = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS
      );
      state.users = response.documents as unknown as UserModel[];
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  };

  const createUser = async (
    userData: UseAppwriteCreateUserDataModel
  ): Promise<UserModel> => {
    loading.value = true;
    error.value = null;
    try {
      const newUser = (await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        ID.unique(),
        userData
      )) as unknown as UserModel;
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
  const loadItems = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await itemService.getAllItems();
      state.items = response.documents as unknown as ItemModel[];
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  };

  const createItem = async (
    itemData: UseAppwriteCreateItemDataModel
  ): Promise<ItemModel> => {
    loading.value = true;
    error.value = null;
    try {
      const newItem = (await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        ID.unique(),
        itemData
      )) as unknown as ItemModel;
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
  const loadReservations = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await reservationService.getAllReservations();
      state.reservations = response.documents as unknown as ReservationModel[];
    } catch (err) {
      handleError(err);
    } finally {
      loading.value = false;
    }
  };

  const createReservation = async (
    reservationData: UseAppwriteCreateReservationDataModel
  ): Promise<ReservationModel> => {
    loading.value = true;
    error.value = null;
    try {
      const newReservation = (await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        ID.unique(),
        reservationData
      )) as unknown as ReservationModel;
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
  const loadCurrentUser = async (): Promise<void> => {
    try {
      state.currentUser =
        (await userService.getCurrentUser()) as unknown as UserModel;
    } catch {
      state.currentUser = null;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      await account.createEmailPasswordSession(email, password);
      await loadCurrentUser();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      await account.create(ID.unique(), email, password, name);
      await login(email, password);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      await account.deleteSession('current');
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
