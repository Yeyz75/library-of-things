import { ref } from 'vue';
import { userService } from '@/services/userService';
import { useUIStore } from '@/store/ui.store';
import type { UserModel } from '@/types/models';

export function useUsers() {
  const users = ref<UserModel[]>([]);
  const ui = useUIStore();

  const loadUsers = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await userService.getCurrentUser();
      users.value = [response as unknown as UserModel];
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los usuarios';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  return {
    users,
    loading: ui.loading,
    error: ui.error,
    loadUsers,
  };
}
