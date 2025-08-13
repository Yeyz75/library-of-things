import { apiResource, COLLECTIONS, Query, type ApiResponse } from './api';
import type { ItemModel, ItemCategoryModel } from '@/types/models';

// Endpoint para items
const endpoint = COLLECTIONS.ITEMS;

// Validar que el endpoint esté configurado
if (!endpoint) {
  console.warn(
    'COLLECTIONS.ITEMS is not configured. Please check your environment variables.'
  );
}

// Exportar métodos estándar manteniendo el contexto
const itemResource = apiResource<ItemModel>(endpoint);

// Verificar que todas las funciones estén disponibles antes de exportar
if (!itemResource || typeof itemResource.search !== 'function') {
  console.error(
    'apiResource did not return valid functions. Check environment configuration.'
  );
}

// Exportar funciones manteniendo el contexto para evitar el problema de 'this'
export const index = (...args: Parameters<typeof itemResource.index>) =>
  itemResource.index(...args);
export const show = (...args: Parameters<typeof itemResource.show>) =>
  itemResource.show(...args);
export const save = (...args: Parameters<typeof itemResource.save>) =>
  itemResource.save(...args);
export const update = (...args: Parameters<typeof itemResource.update>) =>
  itemResource.update(...args);
export const remove = (...args: Parameters<typeof itemResource.remove>) =>
  itemResource.remove(...args);
export const search = (...args: Parameters<typeof itemResource.search>) =>
  itemResource.search(...args);
export const count = (...args: Parameters<typeof itemResource.count>) =>
  itemResource.count(...args);

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

  // Obtener items por categoría (usar filtro igual, no búsqueda)
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

  // Buscar items por título (versión mejorada con fulltext cuando esté disponible)
  async searchByTitle(
    title: string
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    try {
      // Primero intentar búsqueda fulltext (requiere índice)
      return await search('title', title);
    } catch {
      console.warn('Fulltext search not available, trying startsWith...');
      try {
        // Si falla fulltext, intentar startsWith
        return await index({
          filters: [Query.startsWith('title', title)],
        });
      } catch {
        // Si también falla startsWith, filtrar en el cliente
        console.warn(
          'Index-based search failed, falling back to client-side filtering'
        );
        const allItemsResponse = await index({});

        if (allItemsResponse.success && allItemsResponse.data) {
          const filteredItems = allItemsResponse.data.documents.filter((item) =>
            item.title?.toLowerCase().includes(title.toLowerCase())
          );

          return {
            success: true,
            data: {
              documents: filteredItems,
              total: filteredItems.length,
            },
          };
        }

        return allItemsResponse;
      }
    }
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
