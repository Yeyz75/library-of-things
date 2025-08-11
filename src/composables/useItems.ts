import { ref } from 'vue';
import { itemService } from '@/services/itemService';
import { useUIStore } from '@/store/ui.store';
import type { ItemModel } from '@/types/models';

export function useItems() {
  const items = ref<ItemModel[]>([]);
  const ui = useUIStore();

  const loadItems = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await itemService.getAllItems();
      items.value = response.documents as unknown as ItemModel[];
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los items';
      ui.setError(message);
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
