import { apiResource, COLLECTIONS, Query, type ApiResponse } from './api';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

// Endpoint para items
const endpoint = COLLECTIONS.ITEMS;

// Exportar métodos estándar usando destructuring
export const { index, show, save, update, remove, search, count } =
  apiResource<ItemModel>(endpoint);

// Métodos adicionales específicos para items
export const itemsAPI = {
  // Obtener items disponibles
  async getAvailableItems(): Promise<
    ApiResponse<{ documents: ItemModel[]; total: number }>
  > {
    return index({
      filters: [Query.equal('isAvailable', true)],
    });
  },

  // Obtener items por categoría
  async getItemsByCategory(
    category: ItemCategoryModel
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      filters: [Query.equal('category', category)],
    });
  },

  // Obtener items por propietario
  async getItemsByOwner(
    ownerId: string
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      filters: [Query.equal('ownerId', ownerId)],
    });
  },

  // Buscar items por título
  async searchByTitle(
    title: string
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return search('title', title);
  },

  // Buscar items por ubicación
  async searchByLocation(
    location: string
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return search('location', location);
  },

  // Obtener items por condición
  async getItemsByCondition(
    condition: 'excellent' | 'good' | 'fair' | 'poor'
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      filters: [Query.equal('condition', condition)],
    });
  },

  // Obtener items con mejor rating
  async getTopRatedItems(
    limit = 10
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      limit,
      orderBy: 'averageRating',
      orderType: 'DESC',
      filters: [Query.greaterThan('totalReviews', 0)],
    });
  },

  // Obtener items recientes
  async getRecentItems(
    limit = 10
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      limit,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Buscar items por tags
  async searchByTags(
    tags: string[]
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    const filters = tags.map((tag) => Query.search('tags', tag));
    return index({
      filters,
    });
  },

  // Filtros avanzados para items
  async getItemsWithFilters(filters: {
    category?: ItemCategoryModel;
    condition?: 'excellent' | 'good' | 'fair' | 'poor';
    isAvailable?: boolean;
    ownerId?: string;
    location?: string;
    minRating?: number;
    tags?: string[];
  }): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    const queries = [];

    if (filters.category) {
      queries.push(Query.equal('category', filters.category));
    }
    if (filters.condition) {
      queries.push(Query.equal('condition', filters.condition));
    }
    if (filters.isAvailable !== undefined) {
      queries.push(Query.equal('isAvailable', filters.isAvailable));
    }
    if (filters.ownerId) {
      queries.push(Query.equal('ownerId', filters.ownerId));
    }
    if (filters.location) {
      queries.push(Query.search('location', filters.location));
    }
    if (filters.minRating) {
      queries.push(Query.greaterThanEqual('averageRating', filters.minRating));
    }
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag) => {
        queries.push(Query.search('tags', tag));
      });
    }

    return index({
      filters: queries,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  // Actualizar disponibilidad del item
  async updateAvailability(
    itemId: string,
    isAvailable: boolean
  ): Promise<ApiResponse<ItemModel>> {
    return update(itemId, { isAvailable });
  },

  // Actualizar imágenes del item
  async updateImages(
    itemId: string,
    imageUrls: string[]
  ): Promise<ApiResponse<ItemModel>> {
    return update(itemId, { imageUrls });
  },

  // Actualizar rating del item
  async updateRating(
    itemId: string,
    averageRating: number,
    totalReviews: number,
    ratingDistribution?: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    }
  ): Promise<ApiResponse<ItemModel>> {
    const updateData: Partial<ItemModel> = {
      averageRating,
      totalReviews,
    };

    if (ratingDistribution) {
      updateData.ratingDistribution = ratingDistribution;
    }

    return update(itemId, updateData);
  },
};

// Exportar también los métodos adicionales individualmente
export const {
  getAvailableItems,
  getItemsByCategory,
  getItemsByOwner,
  searchByTitle,
  searchByLocation,
  getItemsByCondition,
  getTopRatedItems,
  getRecentItems,
  searchByTags,
  getItemsWithFilters,
  updateAvailability,
  updateImages,
  updateRating,
} = itemsAPI;
