import { ref } from 'vue';
import { itemsAPI } from '@/api';
import { index as getItemsIndex } from '@/api/items';
import { useUIStore } from '@/store/ui.store';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

export function useItems() {
  const items = ref<ItemModel[]>([]);
  const ui = useUIStore();

  // Helper para normalizar diferentes formas de respuesta de la API
  const extractDocuments = <T>(response: unknown): T[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response as T[];
    if (typeof response === 'object' && response !== null) {
      const respObj = response as Record<string, unknown>;

      // case: { data: T[] }
      if ('data' in respObj && Array.isArray(respObj['data'] as unknown[])) {
        return respObj['data'] as T[];
      }

      // case: { data: { documents: T[]; total: number } }
      if (
        'data' in respObj &&
        respObj['data'] !== undefined &&
        typeof respObj['data'] === 'object'
      ) {
        const inner = respObj['data'] as Record<string, unknown>;
        if (
          'documents' in inner &&
          Array.isArray(inner['documents'] as unknown[])
        ) {
          return inner['documents'] as T[];
        }
      }

      // case: { documents: T[] }
      if (
        'documents' in respObj &&
        Array.isArray(respObj['documents'] as unknown[])
      ) {
        return respObj['documents'] as T[];
      }
    }
    return [];
  };

  const loadItems = async (): Promise<void> => {
    ui.setLoading(true);
    ui.clearError();
    try {
      // getItemsIndex() devuelve ApiResponse<{documents,total}>
      const response = await getItemsIndex();
      const respObj = response as {
        success?: boolean;
        data?: { documents?: ItemModel[] };
        error?: string;
      };
      if (
        respObj.success &&
        respObj.data &&
        Array.isArray(respObj.data.documents)
      ) {
        items.value = respObj.data.documents;
      } else {
        throw new Error(respObj.error || 'Error al cargar los items');
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
      // itemsAPI.getAvailableItems() devuelve PaginatedResponse<ItemModel>
      const response = await itemsAPI.getAvailableItems();
      const docs = extractDocuments<ItemModel>(response);
      if (docs.length > 0) {
        items.value = docs;
      } else {
        throw new Error('Error al cargar items disponibles');
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
      const docs = extractDocuments<ItemModel>(response);
      if (docs.length > 0) {
        items.value = docs;
      } else {
        throw new Error('Error al cargar items por categoría');
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
    if (!searchTerm || searchTerm.trim() === '') {
      await loadItems();
      return;
    }
    ui.setLoading(true);
    ui.clearError();
    try {
      const response = await itemsAPI.searchByTitle(searchTerm);
      const docs = extractDocuments<ItemModel>(response);
      if (docs.length > 0) {
        items.value = docs;
      } else {
        throw new Error('Error al buscar items');
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
