import { ref } from 'vue';
import { userService } from '@/services/userService';
import { useUIStore } from '@/store/ui.store';

export function useUsers() {
  const users = ref([]);
  const ui = useUIStore();

  const loadUsers = async () => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await userService.getCurrentUser();
      users.value = [response]; // Ajusta según la estructura de tu API
    } catch (err) {
      ui.setError(err.message || 'Error al cargar los usuarios');
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
