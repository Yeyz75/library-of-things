import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  databases,
  DATABASE_ID,
  COLLECTIONS,
  uploadMultipleFiles,
  ID,
  Query,
} from '@/lib/appwrite';
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
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        id
      );
      return response as unknown as ItemModel;
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
      const queries = [];

      if (filters?.category) {
        queries.push(Query.equal('category', filters.category));
      }

      if (filters?.ownerId) {
        queries.push(Query.equal('ownerId', filters.ownerId));
      }

      if (filters?.limit) {
        queries.push(Query.limit(filters.limit));
      }

      queries.push(Query.orderDesc('$createdAt'));

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        queries
      );

      items.value = response.documents as unknown as ItemModel[];
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
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        id
      );
      currentItem.value = response as unknown as ItemModel;
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
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        ID.unique(),
        itemData
      );

      const newItem = response as unknown as ItemModel;
      items.value.unshift(newItem);
      return newItem.$id;
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
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        id,
        updates
      );

      const updatedItem = response as unknown as ItemModel;

      // Update local state
      const index = items.value.findIndex((item) => item.$id === id);
      if (index !== -1) {
        items.value[index] = updatedItem;
      }
      if (currentItem.value?.$id === id) {
        currentItem.value = updatedItem;
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
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ITEMS, id);

      // Remove from local state
      items.value = items.value.filter((item) => item.$id !== id);
      if (currentItem.value?.$id === id) {
        currentItem.value = null;
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
