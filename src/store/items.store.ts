import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { itemsAPI } from '@/api';
import {
  index as getItems,
  show as getItem,
  save as saveItem,
  update as updateItemAPI,
  remove as deleteItemAPI,
} from '@/api/items';
import { ID, uploadMultipleFiles } from '@/api/api';
import type { ItemModel } from '@/types/models';

export const useItemsStore = defineStore('items', () => {
  // State
  const items = ref<ItemModel[]>([]);
  const currentItem = ref<ItemModel | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const availableItems = computed(() =>
    items.value.filter((item) => item.isAvailable)
  );

  const itemsByCategory = computed(() => {
    return items.value.reduce(
      (acc, item) => {
        if (!acc[item.category ?? '']) {
          acc[item.category ?? ''] = [];
        }
        acc[item.category ?? ''].push(item);
        return acc;
      },
      {} as Record<string, ItemModel[]>
    );
  });

  async function getItemById(id: string): Promise<ItemModel | null> {
    try {
      const response = await getItem(id);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Actions
  async function fetchItems(filters?: {
    category?: string;
    ownerId?: string;
    limit?: number;
  }) {
    isLoading.value = true;
    error.value = null;

    try {
      let response;

      if (filters?.category) {
        response = await itemsAPI.getItemsByCategory(
          filters.category as unknown
        );
      } else if (filters?.ownerId) {
        response = await itemsAPI.getItemsByOwner(filters.ownerId);
      } else {
        response = await getItems({
          limit: filters?.limit,
          orderBy: '$createdAt',
          orderType: 'DESC',
        });
      }

      if (response.success && response.data) {
        items.value = response.data.documents;
      } else {
        throw new Error(response.error || 'Failed to fetch items');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch items';
      error.value = errorMessage;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchItemById(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await getItem(id);
      if (response.success && response.data) {
        currentItem.value = response.data;
      } else {
        throw new Error(response.error || 'Item not found');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Item not found';
      error.value = errorMessage;
    } finally {
      isLoading.value = false;
    }
  }

  async function createItem(
    itemData: Omit<ItemModel, '$id' | '$createdAt' | '$updatedAt'>
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await saveItem(itemData);

      if (response.success && response.data) {
        items.value.unshift(response.data);
        return response.data.$id;
      } else {
        throw new Error(response.error || 'Failed to create item');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create item';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateItem(
    id: string,
    updates: Partial<Omit<ItemModel, '$id' | '$createdAt'>>
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await updateItemAPI(id, updates);

      if (response.success && response.data) {
        const updatedItem = response.data;

        // Update local state
        const index = items.value.findIndex((item) => item.$id === id);
        if (index !== -1) {
          items.value[index] = updatedItem;
        }
        if (currentItem.value?.$id === id) {
          currentItem.value = updatedItem;
        }
      } else {
        throw new Error(response.error || 'Failed to update item');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update item';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteItem(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await deleteItemAPI(id);

      if (response.success) {
        // Remove from local state
        items.value = items.value.filter((item) => item.$id !== id);
        if (currentItem.value?.$id === id) {
          currentItem.value = null;
        }
      } else {
        throw new Error(response.error || 'Failed to delete item');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete item';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function uploadItemImages(
    files: File[],
    itemId?: string
  ): Promise<string[]> {
    try {
      const actualItemId = itemId || ID.unique();
      const uploadResults = await uploadMultipleFiles(
        files,
        'item',
        actualItemId
      );
      return uploadResults.map((result) => result.url);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to upload images';
      error.value = errorMessage;
      throw err;
    }
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentItem() {
    currentItem.value = null;
  }

  return {
    // State
    items,
    currentItem,
    isLoading,
    error,
    // Getters
    availableItems,
    itemsByCategory,
    // Actions
    fetchItems,
    fetchItemById,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
    uploadItemImages,
    clearError,
    clearCurrentItem,
  };
});
