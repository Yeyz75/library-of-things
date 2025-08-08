import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import type { Item, ApiResponse } from '@/types';

class ItemsService {
  private collectionName = 'items';

  /**
   * Get all items with optional filters
   */
  async getItems(filters?: {
    category?: string;
    ownerId?: string;
    limit?: number;
  }): Promise<ApiResponse<Item[]>> {
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.ownerId) {
        q = query(q, where('ownerId', '==', filters.ownerId));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const items: Item[] = [];

      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as Item);
      });

      return { data: items, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch items',
        success: false,
      };
    }
  }

  /**
   * Get item by ID
   */
  async getItemById(id: string): Promise<ApiResponse<Item>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const item = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as Item;

        return { data: item, success: true };
      } else {
        return { error: 'Item not found', success: false };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch item',
        success: false,
      };
    }
  }

  /**
   * Create new item
   */
  async createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<string>> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...itemData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { data: docRef.id, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create item',
        success: false,
      };
    }
  }

  /**
   * Update item
   */
  async updateItem(id: string, updates: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to update item',
        success: false,
      };
    }
  }

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);

      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to delete item',
        success: false,
      };
    }
  }

  /**
   * Upload item images
   */
  async uploadItemImages(itemId: string, files: File[]): Promise<ApiResponse<string[]>> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileName = `${itemId}-${index}-${Date.now()}`;
        const storageRef = ref(storage, `items/${fileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
      });

      const imageUrls = await Promise.all(uploadPromises);
      return { data: imageUrls, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to upload images',
        success: false,
      };
    }
  }

  /**
   * Delete item image
   */
  async deleteItemImage(imageUrl: string): Promise<ApiResponse<void>> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to delete image',
        success: false,
      };
    }
  }
}

export const itemsService = new ItemsService();