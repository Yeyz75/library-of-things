import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { itemsService } from '@/services/items.service';
import type { Item, ItemCategory } from '@/types';

export const useItemsStore = defineStore('items', () => {
  // State
  const items = ref<Item[]>([]);
  const currentItem = ref<Item | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const availableItems = computed(() =>
    items.value.filter(item => item.isAvailable)
  );

  const itemsByCategory = computed(() => {
    return items.value.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, Item[]>);
  });

  // Actions
  async function fetchItems(filters?: {
    category?: string;
    ownerId?: string;
    limit?: number;
  }) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await itemsService.getItems(filters);
      if (response.success && response.data) {
        items.value = response.data;
      } else {
        error.value = response.error || 'Failed to fetch items';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch items';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchItemById(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await itemsService.getItemById(id);
      if (response.success && response.data) {
        currentItem.value = response.data;
      } else {
        error.value = response.error || 'Item not found';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch item';
    } finally {
      isLoading.value = false;
    }
  }

  async function createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await itemsService.createItem(itemData);
      if (response.success && response.data) {
        // Refresh items list
        await fetchItems();
        return response.data;
      } else {
        error.value = response.error || 'Failed to create item';
        throw new Error(error.value);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create item';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateItem(id: string, updates: Partial<Omit<Item, 'id' | 'createdAt'>>) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await itemsService.updateItem(id, updates);
      if (response.success) {
        // Update local state
        const index = items.value.findIndex(item => item.id === id);
        if (index !== -1) {
          items.value[index] = { ...items.value[index], ...updates };
        }
        if (currentItem.value?.id === id) {
          currentItem.value = { ...currentItem.value, ...updates };
        }
      } else {
        error.value = response.error || 'Failed to update item';
        throw new Error(error.value);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update item';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteItem(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await itemsService.deleteItem(id);
      if (response.success) {
        // Remove from local state
        items.value = items.value.filter(item => item.id !== id);
        if (currentItem.value?.id === id) {
          currentItem.value = null;
        }
      } else {
        error.value = response.error || 'Failed to delete item';
        throw new Error(error.value);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete item';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function uploadItemImages(itemId: string, files: File[]) {
    try {
      const response = await itemsService.uploadItemImages(itemId, files);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to upload images');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to upload images';
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
    createItem,
    updateItem,
    deleteItem,
    uploadItemImages,
    clearError,
    clearCurrentItem,
  };
});