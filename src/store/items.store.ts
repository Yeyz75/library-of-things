import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  databases,
  storage,
  DATABASE_ID,
  COLLECTIONS,
  BUCKETS,
  ID,
  Query,
} from '@/lib/appwrite';
import type { Item } from '@/types';

export const useItemsStore = defineStore('items', () => {
  // State
  const items = ref<Item[]>([]);
  const currentItem = ref<Item | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const availableItems = computed(() =>
    items.value.filter((item) => item.isAvailable)
  );

  const itemsByCategory = computed(() => {
    return items.value.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, Item[]>
    );
  });

  async function getItemById(id: string): Promise<Item | null> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ITEMS,
        id
      );
      return response as unknown as Item;
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

      items.value = response.documents as unknown as Item[];
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
      currentItem.value = response as unknown as Item;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Item not found';
      error.value = errorMessage;
    } finally {
      isLoading.value = false;
    }
  }

  async function createItem(
    itemData: Omit<Item, '$id' | '$createdAt' | '$updatedAt'>
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

      const newItem = response as unknown as Item;
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
    updates: Partial<Omit<Item, '$id' | '$createdAt'>>
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

      const updatedItem = response as unknown as Item;

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

  async function uploadItemImages(files: File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(async (file) => {
        const fileId = ID.unique();
        const response = await storage.createFile(
          BUCKETS.ITEM_IMAGES,
          fileId,
          file
        );

        // Get the file URL
        const fileUrl = storage.getFileView(BUCKETS.ITEM_IMAGES, response.$id);
        return fileUrl.toString();
      });

      const imageUrls = await Promise.all(uploadPromises);
      return imageUrls;
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
