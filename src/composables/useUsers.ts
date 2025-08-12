import { ref } from 'vue';
import { AuthAPI } from '@/api';
import { index as getUsersIndex } from '@/api/users';
import { useUIStore } from '@/store/ui.store';
import type { UserModel } from '@/types/models';

export function useUsers() {
  const users = ref<UserModel[]>([]);
  const ui = useUIStore();

  const loadUsers = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await getUsersIndex();
      if (response.success && response.data) {
        users.value = response.data.documents;
      } else {
        throw new Error(response.error || 'Error al cargar los usuarios');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los usuarios';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  const getCurrentUser = async (): Promise<UserModel | null> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await AuthAPI.getCurrentUser();
      if (response.success && response.data) {
        return response.data as unknown as UserModel;
      } else {
        throw new Error(response.error || 'Error al obtener usuario actual');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al obtener usuario actual';
      ui.setError(message);
      return null;
    } finally {
      ui.setLoading(false);
    }
  };

  return {
    users,
    loading: ui.loading,
    error: ui.error,
    loadUsers,
    getCurrentUser,
  };
}
