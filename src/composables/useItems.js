import { ref } from 'vue';
import { itemService } from '@/services/itemService';
import { useUIStore } from '@/store/ui.store';

export function useItems() {
  const items = ref([]);
  const ui = useUIStore();

  const loadItems = async () => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await itemService.getAllItems();
      items.value = response.documents;
    } catch (err) {
      ui.setError(err.message || 'Error al cargar los items');
    } finally {
      ui.setLoading(false);
    }
  };

  return {
    items,
    loading: ui.loading,
    error: ui.error,
    loadItems,
  };
}
