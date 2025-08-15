import { apiResource, COLLECTIONS, Query, type ApiResponse } from './api';
import type { ItemModel, ItemCategoryModel } from '@/types/models';
import type { PaginatedResponse } from '@/types/pagination';

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

// Versión paginada del método index principal
export const indexPaginated = async (
  paginationParams: PaginationParams = {},
  options: Omit<
    Parameters<typeof itemResource.index>[0],
    'limit' | 'offset'
  > = {}
): Promise<PaginatedResponse<ItemModel>> => {
  const { page = 1, pageSize = 20 } = paginationParams;
  const offset = (page - 1) * pageSize;

  const apiResponse = await itemResource.index({
    ...options,
    limit: pageSize,
    offset,
  });

  return convertToPaginatedResponse(apiResponse, page, pageSize);
};

// Interfaz para parámetros de paginación
interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Función helper para convertir respuesta API a formato paginado
function convertToPaginatedResponse<T>(
  apiResponse: ApiResponse<{ documents: T[]; total: number }>,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  if (!apiResponse.success || !apiResponse.data) {
    return {
      data: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const { documents, total } = apiResponse.data;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: documents,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// Métodos adicionales específicos para items
export const itemsAPI = {
  // Obtener items disponibles con paginación
  async getAvailableItems(
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await index({
      filters: [Query.equal('isAvailable', true)],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Obtener items por categoría con paginación
  async getItemsByCategory(
    category: ItemCategoryModel,
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await index({
      filters: [Query.equal('category', category)],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Obtener items por propietario con paginación
  async getItemsByOwner(
    ownerId: string,
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await index({
      filters: [Query.equal('ownerId', ownerId)],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Buscar items por título con paginación
  async searchByTitle(
    title: string,
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    try {
      // Primero intentar búsqueda fulltext (requiere índice)
      const apiResponse = await search('title', title, {
        limit: pageSize,
        offset,
        orderBy: '$createdAt',
        orderType: 'DESC',
      });
      return convertToPaginatedResponse(apiResponse, page, pageSize);
    } catch {
      console.warn('Fulltext search not available, trying startsWith...');
      try {
        // Si falla fulltext, intentar startsWith
        const apiResponse = await index({
          filters: [Query.startsWith('title', title)],
          limit: pageSize,
          offset,
          orderBy: '$createdAt',
          orderType: 'DESC',
        });
        return convertToPaginatedResponse(apiResponse, page, pageSize);
      } catch {
        // Si también falla startsWith, filtrar en el cliente
        console.warn(
          'Index-based search failed, falling back to client-side filtering'
        );
        const allItemsResponse = await index({
          orderBy: '$createdAt',
          orderType: 'DESC',
        });

        if (allItemsResponse.success && allItemsResponse.data) {
          const filteredItems = allItemsResponse.data.documents.filter((item) =>
            item.title?.toLowerCase().includes(title.toLowerCase())
          );

          // Aplicar paginación manual para el filtrado del cliente
          const startIndex = offset;
          const endIndex = startIndex + pageSize;
          const paginatedItems = filteredItems.slice(startIndex, endIndex);

          return {
            data: paginatedItems,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(filteredItems.length / pageSize),
              totalItems: filteredItems.length,
              itemsPerPage: pageSize,
              hasNextPage: endIndex < filteredItems.length,
              hasPreviousPage: page > 1,
            },
          };
        }

        return convertToPaginatedResponse(allItemsResponse, page, pageSize);
      }
    }
  },

  // Buscar items por ubicación con paginación
  async searchByLocation(
    location: string,
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await search('location', location, {
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Obtener items por condición con paginación
  async getItemsByCondition(
    condition: 'excellent' | 'good' | 'fair' | 'poor',
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await index({
      filters: [Query.equal('condition', condition)],
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Obtener items con mejor rating con paginación
  async getTopRatedItems(
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 10 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await index({
      limit: pageSize,
      offset,
      orderBy: 'averageRating',
      orderType: 'DESC',
      filters: [Query.greaterThan('totalReviews', 0)],
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Obtener items recientes con paginación
  async getRecentItems(
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 10 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await index({
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Buscar items por tags con paginación
  async searchByTags(
    tags: string[],
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const filters = tags.map((tag) => Query.search('tags', tag));
    const apiResponse = await index({
      filters,
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Filtros avanzados para items con paginación
  async getItemsWithFilters(
    filters: {
      category?: ItemCategoryModel;
      condition?: 'excellent' | 'good' | 'fair' | 'poor';
      isAvailable?: boolean;
      ownerId?: string;
      location?: string;
      minRating?: number;
      tags?: string[];
    },
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

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

    const apiResponse = await index({
      filters: queries,
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
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

  // Métodos de compatibilidad hacia atrás (mantienen la API original)
  // Estos métodos devuelven el formato ApiResponse original para no romper código existente
  async getAvailableItemsLegacy(): Promise<
    ApiResponse<{ documents: ItemModel[]; total: number }>
  > {
    return index({
      filters: [Query.equal('isAvailable', true)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  async getItemsByCategoryLegacy(
    category: ItemCategoryModel
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      filters: [Query.equal('category', category)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  async getItemsByOwnerLegacy(
    ownerId: string
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      filters: [Query.equal('ownerId', ownerId)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  async searchByTitleLegacy(
    title: string
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    try {
      return await search('title', title, {
        orderBy: '$createdAt',
        orderType: 'DESC',
      });
    } catch {
      console.warn('Fulltext search not available, trying startsWith...');
      try {
        return await index({
          filters: [Query.startsWith('title', title)],
          orderBy: '$createdAt',
          orderType: 'DESC',
        });
      } catch {
        console.warn(
          'Index-based search failed, falling back to client-side filtering'
        );
        const allItemsResponse = await index({
          orderBy: '$createdAt',
          orderType: 'DESC',
        });

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

  async searchByLocationLegacy(
    location: string
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return search('location', location, {
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  async getItemsByConditionLegacy(
    condition: 'excellent' | 'good' | 'fair' | 'poor'
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      filters: [Query.equal('condition', condition)],
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  async getTopRatedItemsLegacy(
    limit = 10
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      limit,
      orderBy: 'averageRating',
      orderType: 'DESC',
      filters: [Query.greaterThan('totalReviews', 0)],
    });
  },

  async getRecentItemsLegacy(
    limit = 10
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    return index({
      limit,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  async searchByTagsLegacy(
    tags: string[]
  ): Promise<ApiResponse<{ documents: ItemModel[]; total: number }>> {
    const filters = tags.map((tag) => Query.search('tags', tag));
    return index({
      filters,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });
  },

  async getItemsWithFiltersLegacy(filters: {
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

  // Método universal para consultas de items con paginación
  async queryItems(
    queryOptions: {
      filters?: string[];
      search?: { field: string; value: string };
      orderBy?: string;
      orderType?: 'ASC' | 'DESC';
    } = {},
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await index({
      ...queryOptions,
      limit: pageSize,
      offset,
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },

  // Método para obtener todos los items con paginación (sin filtros)
  async getAllItems(
    paginationParams: PaginationParams = {}
  ): Promise<PaginatedResponse<ItemModel>> {
    const { page = 1, pageSize = 20 } = paginationParams;
    const offset = (page - 1) * pageSize;

    const apiResponse = await index({
      limit: pageSize,
      offset,
      orderBy: '$createdAt',
      orderType: 'DESC',
    });

    return convertToPaginatedResponse(apiResponse, page, pageSize);
  },
};

// Exportar también los métodos adicionales individualmente
// Por defecto, exportamos las versiones paginadas (nuevas)
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
  queryItems,
  getAllItems,
  updateAvailability,
  updateImages,
  updateRating,
  // También exportamos las versiones legacy para compatibilidad
  getAvailableItemsLegacy,
  getItemsByCategoryLegacy,
  getItemsByOwnerLegacy,
  searchByTitleLegacy,
  searchByLocationLegacy,
  getItemsByConditionLegacy,
  getTopRatedItemsLegacy,
  getRecentItemsLegacy,
  searchByTagsLegacy,
  getItemsWithFiltersLegacy,
} = itemsAPI;
