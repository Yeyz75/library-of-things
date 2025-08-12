import { ref } from 'vue';
import { itemsAPI } from '@/api';
import { index as getItemsIndex } from '@/api/items';
import { useUIStore } from '@/store/ui.store';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

export function useItems() {
  const items = ref<ItemModel[]>([]);
  const ui = useUIStore();

  const loadItems = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await getItemsIndex();
      if (response.success && response.data) {
        items.value = response.data.documents;
      } else {
        throw new Error(response.error || 'Error al cargar los items');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los items';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  const loadAvailableItems = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await itemsAPI.getAvailableItems();
      if (response.success && response.data) {
        items.value = response.data.documents;
      } else {
        throw new Error(response.error || 'Error al cargar items disponibles');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al cargar items disponibles';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  const loadItemsByCategory = async (
    category: ItemCategoryModel
  ): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await itemsAPI.getItemsByCategory(category);
      if (response.success && response.data) {
        items.value = response.data.documents;
      } else {
        throw new Error(
          response.error || 'Error al cargar items por categoría'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al cargar items por categoría';
      ui.setError(message);
    } finally {
      ui.setLoading(false);
    }
  };

  const searchItems = async (searchTerm: string): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await itemsAPI.searchByTitle(searchTerm);
      if (response.success && response.data) {
        items.value = response.data.documents;
      } else {
        throw new Error(response.error || 'Error al buscar items');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al buscar items';
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
    loadAvailableItems,
    loadItemsByCategory,
    searchItems,
  };
}
