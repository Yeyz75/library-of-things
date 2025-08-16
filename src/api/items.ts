import {
  COLLECTIONS,
  handleApiError,
  handleApiSuccess,
  uploadMultipleFiles,
  deleteFile,
  type ApiResponse,
  type BaseEntity,
  type QueryOptions,
} from './api';
import { DatabaseService } from './database';

// Interfaz principal para Item con metadatos completos
export interface Item extends BaseEntity {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price?: number;
  currency?: string;
  images: string[];
  imageIds: string[]; // IDs de archivos en storage para gestión
  ownerId: string;
  ownerName?: string; // Cache del nombre del propietario
  status: 'available' | 'reserved' | 'unavailable' | 'deleted';
  location?: {
    address: string;
    city?: string;
    country?: string;
    coordinates?: [number, number]; // [lat, lng]
  };
  specifications?: Record<string, string | number | boolean>;
  tags: string[];
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  availability?: {
    startDate?: string;
    endDate?: string;
    timeSlots?: string[];
  };
  metadata: Record<string, unknown>;
  // Campos calculados/cache
  viewCount: number;
  favoriteCount: number;
  reservationCount: number;
  averageRating?: number;
  reviewCount?: number;
}

// Interfaz para crear un nuevo item
export interface CreateItemData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price?: number;
  currency?: string;
  ownerId: string;
  status?: 'available' | 'unavailable';
  location?: {
    address: string;
    city?: string;
    country?: string;
    coordinates?: [number, number];
  };
  specifications?: Record<string, string | number | boolean>;
  tags?: string[];
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  availability?: {
    startDate?: string;
    endDate?: string;
    timeSlots?: string[];
  };
  metadata?: Record<string, unknown>;
}

// Interfaz para actualizar un item
export interface UpdateItemData {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price?: number;
  currency?: string;
  images?: string[];
  imageIds?: string[];
  status?: 'available' | 'reserved' | 'unavailable' | 'deleted';
  location?: {
    address: string;
    city?: string;
    country?: string;
    coordinates?: [number, number];
  };
  specifications?: Record<string, string | number | boolean>;
  tags?: string[];
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  availability?: {
    startDate?: string;
    endDate?: string;
    timeSlots?: string[];
  };
  metadata?: Record<string, unknown>;
  viewCount?: number;
  favoriteCount?: number;
  reservationCount?: number;
  averageRating?: number;
  reviewCount?: number;
}

// Opciones de búsqueda específicas para items
export interface ItemSearchOptions extends QueryOptions {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  status?: string[];
  location?: {
    city?: string;
    country?: string;
    radius?: number; // en km
    center?: [number, number]; // [lat, lng]
  };
  tags?: string[];
  ownerId?: string;
  availability?: {
    startDate?: string;
    endDate?: string;
  };
}

// Categorías predefinidas del sistema
export const ITEM_CATEGORIES = {
  ELECTRONICS: 'electronics',
  VEHICLES: 'vehicles',
  TOOLS: 'tools',
  SPORTS: 'sports',
  BOOKS: 'books',
  CLOTHING: 'clothing',
  HOME: 'home',
  GARDEN: 'garden',
  MUSIC: 'music',
  GAMES: 'games',
  OTHER: 'other',
} as const;

export type ItemCategory =
  (typeof ITEM_CATEGORIES)[keyof typeof ITEM_CATEGORIES];

// Subcategorías por categoría principal
export const ITEM_SUBCATEGORIES: Record<ItemCategory, string[]> = {
  [ITEM_CATEGORIES.ELECTRONICS]: [
    'smartphones',
    'laptops',
    'tablets',
    'cameras',
    'audio',
    'gaming',
    'accessories',
  ],
  [ITEM_CATEGORIES.VEHICLES]: [
    'cars',
    'motorcycles',
    'bicycles',
    'boats',
    'accessories',
  ],
  [ITEM_CATEGORIES.TOOLS]: [
    'power_tools',
    'hand_tools',
    'garden_tools',
    'construction',
    'automotive',
  ],
  [ITEM_CATEGORIES.SPORTS]: [
    'fitness',
    'outdoor',
    'water_sports',
    'winter_sports',
    'team_sports',
  ],
  [ITEM_CATEGORIES.BOOKS]: [
    'fiction',
    'non_fiction',
    'textbooks',
    'children',
    'comics',
  ],
  [ITEM_CATEGORIES.CLOTHING]: [
    'mens',
    'womens',
    'children',
    'shoes',
    'accessories',
  ],
  [ITEM_CATEGORIES.HOME]: [
    'furniture',
    'appliances',
    'decor',
    'kitchen',
    'cleaning',
  ],
  [ITEM_CATEGORIES.GARDEN]: [
    'plants',
    'tools',
    'furniture',
    'equipment',
    'supplies',
  ],
  [ITEM_CATEGORIES.MUSIC]: [
    'instruments',
    'equipment',
    'accessories',
    'sheet_music',
  ],
  [ITEM_CATEGORIES.GAMES]: ['board_games', 'video_games', 'puzzles', 'toys'],
  [ITEM_CATEGORIES.OTHER]: ['miscellaneous'],
};

// Condiciones válidas
export const ITEM_CONDITIONS = [
  'new',
  'like_new',
  'good',
  'fair',
  'poor',
] as const;

export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

// Estados válidos
export const ITEM_STATUSES = [
  'available',
  'reserved',
  'unavailable',
  'deleted',
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

// Validaciones
const validateItemData = (data: CreateItemData | UpdateItemData): void => {
  // Validar título
  if ('title' in data && data.title !== undefined) {
    if (
      !data.title ||
      typeof data.title !== 'string' ||
      data.title.trim().length < 3
    ) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }
    if (data.title.length > 100) {
      throw new Error('El título no puede exceder 100 caracteres');
    }
  }

  // Validar descripción
  if ('description' in data && data.description !== undefined) {
    if (
      !data.description ||
      typeof data.description !== 'string' ||
      data.description.trim().length < 10
    ) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
    if (data.description.length > 2000) {
      throw new Error('La descripción no puede exceder 2000 caracteres');
    }
  }

  // Validar categoría
  if ('category' in data && data.category !== undefined) {
    if (!data.category || typeof data.category !== 'string') {
      throw new Error('La categoría es requerida');
    }
    const validCategories = Object.values(ITEM_CATEGORIES);
    if (!validCategories.includes(data.category as ItemCategory)) {
      throw new Error(
        `Categoría inválida. Debe ser una de: ${validCategories.join(', ')}`
      );
    }
  }

  // Validar subcategoría
  if (
    'subcategory' in data &&
    data.subcategory !== undefined &&
    data.subcategory !== null
  ) {
    if (typeof data.subcategory !== 'string') {
      throw new Error('La subcategoría debe ser una cadena de texto');
    }
    if ('category' in data && data.category) {
      const validSubcategories =
        ITEM_SUBCATEGORIES[data.category as ItemCategory] || [];
      if (!validSubcategories.includes(data.subcategory)) {
        throw new Error(
          `Subcategoría inválida para la categoría ${data.category}`
        );
      }
    }
  }

  // Validar precio
  if ('price' in data && data.price !== undefined && data.price !== null) {
    if (typeof data.price !== 'number' || data.price < 0) {
      throw new Error('El precio debe ser un número positivo');
    }
    if (data.price > 1000000) {
      throw new Error('El precio no puede exceder 1,000,000');
    }
  }

  // Validar moneda
  if (
    'currency' in data &&
    data.currency !== undefined &&
    data.currency !== null
  ) {
    if (typeof data.currency !== 'string' || data.currency.length !== 3) {
      throw new Error(
        'La moneda debe ser un código de 3 letras (ej: USD, EUR)'
      );
    }
  }

  // Validar condición
  if ('condition' in data && data.condition !== undefined) {
    if (!ITEM_CONDITIONS.includes(data.condition as ItemCondition)) {
      throw new Error(
        `Condición inválida. Debe ser una de: ${ITEM_CONDITIONS.join(', ')}`
      );
    }
  }

  // Validar estado
  if ('status' in data && data.status !== undefined) {
    const validStatuses = ['available', 'reserved', 'unavailable'];
    if (!validStatuses.includes(data.status)) {
      throw new Error(
        `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`
      );
    }
  }

  // Validar tags
  if ('tags' in data && data.tags !== undefined && data.tags !== null) {
    if (!Array.isArray(data.tags)) {
      throw new Error('Los tags deben ser un array');
    }
    if (data.tags.length > 10) {
      throw new Error('No se pueden agregar más de 10 tags');
    }
    data.tags.forEach((tag, index) => {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        throw new Error(
          `Tag en posición ${index} debe ser una cadena no vacía`
        );
      }
      if (tag.length > 30) {
        throw new Error(`Tag "${tag}" no puede exceder 30 caracteres`);
      }
    });
  }

  // Validar ubicación
  if (
    'location' in data &&
    data.location !== undefined &&
    data.location !== null
  ) {
    if (typeof data.location !== 'object') {
      throw new Error('La ubicación debe ser un objeto');
    }
    if (!data.location.address || typeof data.location.address !== 'string') {
      throw new Error('La dirección es requerida en la ubicación');
    }
    if (data.location.coordinates) {
      if (
        !Array.isArray(data.location.coordinates) ||
        data.location.coordinates.length !== 2
      ) {
        throw new Error(
          'Las coordenadas deben ser un array de 2 números [lat, lng]'
        );
      }
      const [lat, lng] = data.location.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('Las coordenadas deben ser números');
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Coordenadas inválidas');
      }
    }
  }

  // Validar disponibilidad
  if (
    'availability' in data &&
    data.availability !== undefined &&
    data.availability !== null
  ) {
    if (typeof data.availability !== 'object') {
      throw new Error('La disponibilidad debe ser un objeto');
    }
    if (data.availability.startDate && data.availability.endDate) {
      const startDate = new Date(data.availability.startDate);
      const endDate = new Date(data.availability.endDate);
      if (startDate >= endDate) {
        throw new Error(
          'La fecha de inicio debe ser anterior a la fecha de fin'
        );
      }
    }
  }

  // Validar arrays de imágenes
  if ('images' in data && data.images !== undefined && data.images !== null) {
    if (!Array.isArray(data.images)) {
      throw new Error('Las imágenes deben ser un array');
    }
    if (data.images.length > 10) {
      throw new Error('No se pueden tener más de 10 imágenes');
    }
  }

  if (
    'imageIds' in data &&
    data.imageIds !== undefined &&
    data.imageIds !== null
  ) {
    if (!Array.isArray(data.imageIds)) {
      throw new Error('Los IDs de imágenes deben ser un array');
    }
  }

  // Validar contadores numéricos
  const numericFields = [
    'viewCount',
    'favoriteCount',
    'reservationCount',
    'reviewCount',
  ];
  numericFields.forEach((field) => {
    if (field in data && data[field as keyof typeof data] !== undefined) {
      const value = data[field as keyof typeof data];
      if (typeof value !== 'number' || value < 0) {
        throw new Error(`${field} debe ser un número positivo`);
      }
    }
  });

  // Validar rating promedio
  if (
    'averageRating' in data &&
    data.averageRating !== undefined &&
    data.averageRating !== null
  ) {
    if (
      typeof data.averageRating !== 'number' ||
      data.averageRating < 0 ||
      data.averageRating > 5
    ) {
      throw new Error('El rating promedio debe ser un número entre 0 y 5');
    }
  }
};

// Clase principal para gestión de items
export class ItemsService {
  // Crear un nuevo item
  static async createItem(data: CreateItemData): Promise<ApiResponse<Item>> {
    try {
      // Validar datos
      validateItemData(data);

      // Preparar datos del item con valores por defecto
      const itemData: Omit<Item, '$id' | 'createdAt' | 'updatedAt'> = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        subcategory: data.subcategory || undefined,
        price: data.price || undefined,
        currency: data.currency || 'USD',
        images: [], // Se llenarán al subir imágenes
        imageIds: [], // Se llenarán al subir imágenes
        ownerId: data.ownerId,
        ownerName: undefined, // Se puede llenar después con datos del usuario
        status: data.status || 'available',
        location: data.location || undefined,
        specifications: data.specifications || {},
        tags: data.tags ? data.tags.map((tag) => tag.trim().toLowerCase()) : [],
        condition: data.condition,
        availability: data.availability || undefined,
        metadata: data.metadata || {},
        // Campos calculados inicializados
        viewCount: 0,
        favoriteCount: 0,
        reservationCount: 0,
        averageRating: undefined,
        reviewCount: 0,
      };

      return await DatabaseService.create<Item>(COLLECTIONS.ITEMS, itemData);
    } catch (error) {
      return handleApiError<Item>(error);
    }
  }

  // Obtener item por ID
  static async getItem(id: string): Promise<ApiResponse<Item>> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<Item>(new Error('ID de item requerido'));
    }

    return await DatabaseService.read<Item>(COLLECTIONS.ITEMS, id.trim());
  }

  // Actualizar item
  static async updateItem(
    id: string,
    data: UpdateItemData
  ): Promise<ApiResponse<Item>> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<Item>(new Error('ID de item requerido'));
    }

    try {
      // Validar datos
      validateItemData(data);

      // Preparar datos de actualización
      const updateData: Partial<Omit<Item, '$id' | 'createdAt' | 'updatedAt'>> =
        {};

      // Solo incluir campos que han cambiado
      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.description !== undefined)
        updateData.description = data.description.trim();
      if (data.category !== undefined) updateData.category = data.category;
      if (data.subcategory !== undefined)
        updateData.subcategory = data.subcategory;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.images !== undefined) updateData.images = data.images;
      if (data.imageIds !== undefined) updateData.imageIds = data.imageIds;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.specifications !== undefined)
        updateData.specifications = data.specifications;
      if (data.tags !== undefined)
        updateData.tags = data.tags.map((tag) => tag.trim().toLowerCase());
      if (data.condition !== undefined) updateData.condition = data.condition;
      if (data.availability !== undefined)
        updateData.availability = data.availability;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;
      if (data.viewCount !== undefined) updateData.viewCount = data.viewCount;
      if (data.favoriteCount !== undefined)
        updateData.favoriteCount = data.favoriteCount;
      if (data.reservationCount !== undefined)
        updateData.reservationCount = data.reservationCount;
      if (data.averageRating !== undefined)
        updateData.averageRating = data.averageRating;
      if (data.reviewCount !== undefined)
        updateData.reviewCount = data.reviewCount;

      return await DatabaseService.update<Item>(
        COLLECTIONS.ITEMS,
        id.trim(),
        updateData
      );
    } catch (error) {
      return handleApiError<Item>(error);
    }
  }

  // Eliminar item (soft delete)
  static async deleteItem(id: string): Promise<ApiResponse<void>> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<void>(new Error('ID de item requerido'));
    }

    try {
      // Marcar como eliminado en lugar de eliminar físicamente
      const result = await DatabaseService.update<Item>(
        COLLECTIONS.ITEMS,
        id.trim(),
        {
          status: 'deleted',
        }
      );

      if (result.success) {
        return handleApiSuccess(undefined, 'Item eliminado exitosamente');
      } else {
        return handleApiError<void>(
          new Error(result.error || 'Error al eliminar item')
        );
      }
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  // Eliminar item permanentemente
  static async permanentDeleteItem(id: string): Promise<ApiResponse<void>> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<void>(new Error('ID de item requerido'));
    }

    try {
      // Primero obtener el item para limpiar imágenes
      const itemResult = await this.getItem(id);
      if (itemResult.success && itemResult.data?.imageIds) {
        // Eliminar imágenes del storage
        for (const imageId of itemResult.data.imageIds) {
          try {
            await deleteFile(imageId);
          } catch (error) {
            console.warn(`Error al eliminar imagen ${imageId}:`, error);
          }
        }
      }

      return await DatabaseService.delete(COLLECTIONS.ITEMS, id.trim());
    } catch (error) {
      return handleApiError<void>(error);
    }
  } // Listar items con filtros y paginación
  static async listItems(
    options: ItemSearchOptions = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    try {
      // Construir filtros para la consulta
      const filters: string[] = [];

      // Filtrar por categoría
      if (options.category) {
        filters.push(`category==${options.category}`);
      }

      // Filtrar por subcategoría
      if (options.subcategory) {
        filters.push(`subcategory==${options.subcategory}`);
      }

      // Filtrar por estado (excluir eliminados por defecto)
      if (options.status && options.status.length > 0) {
        // Si se especifican estados, usar esos
        options.status.forEach((status) => {
          if (status !== 'deleted') {
            filters.push(`status==${status}`);
          }
        });
      } else {
        // Por defecto, excluir eliminados
        filters.push(`status==available`);
        filters.push(`status==reserved`);
        filters.push(`status==unavailable`);
      }

      // Filtrar por propietario
      if (options.ownerId) {
        filters.push(`ownerId==${options.ownerId}`);
      }

      // Filtrar por condición
      if (options.condition && options.condition.length > 0) {
        options.condition.forEach((condition) => {
          filters.push(`condition==${condition}`);
        });
      }

      // Preparar opciones de consulta
      const queryOptions: QueryOptions = {
        filters,
        limit: options.limit,
        offset: options.offset,
        orderBy: options.orderBy || 'createdAt',
        orderType: options.orderType || 'DESC',
      };

      // Aplicar búsqueda por texto si se especifica
      if (options.search?.field && options.search?.value) {
        queryOptions.search = options.search;
      }

      return await DatabaseService.query<Item>(COLLECTIONS.ITEMS, queryOptions);
    } catch (error) {
      return handleApiError<{ documents: Item[]; total: number }>(error);
    }
  }

  // Buscar items por múltiples criterios
  static async searchItems(
    searchTerm: string,
    options: Omit<ItemSearchOptions, 'search'> = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    if (
      !searchTerm ||
      typeof searchTerm !== 'string' ||
      searchTerm.trim() === ''
    ) {
      return handleApiError<{ documents: Item[]; total: number }>(
        new Error('Término de búsqueda requerido')
      );
    }

    try {
      // Buscar en título primero
      const titleSearch = await this.listItems({
        ...options,
        search: { field: 'title', value: searchTerm.trim() },
      });

      // Si no hay resultados en título, buscar en descripción
      if (
        titleSearch.success &&
        titleSearch.data &&
        titleSearch.data.documents.length === 0
      ) {
        return await this.listItems({
          ...options,
          search: { field: 'description', value: searchTerm.trim() },
        });
      }

      return titleSearch;
    } catch (error) {
      return handleApiError<{ documents: Item[]; total: number }>(error);
    }
  }

  // Obtener items por categoría
  static async getItemsByCategory(
    category: ItemCategory,
    options: Omit<ItemSearchOptions, 'category'> = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    if (!category || !Object.values(ITEM_CATEGORIES).includes(category)) {
      return handleApiError<{ documents: Item[]; total: number }>(
        new Error('Categoría inválida')
      );
    }

    return await this.listItems({
      ...options,
      category,
    });
  }

  // Obtener items por propietario
  static async getItemsByOwner(
    ownerId: string,
    options: Omit<ItemSearchOptions, 'ownerId'> = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    if (!ownerId || typeof ownerId !== 'string' || ownerId.trim() === '') {
      return handleApiError<{ documents: Item[]; total: number }>(
        new Error('ID de propietario requerido')
      );
    }

    return await this.listItems({
      ...options,
      ownerId: ownerId.trim(),
    });
  }

  // Obtener items disponibles
  static async getAvailableItems(
    options: Omit<ItemSearchOptions, 'status'> = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    return await this.listItems({
      ...options,
      status: ['available'],
    });
  }

  // Filtrar items por rango de precio
  static async getItemsByPriceRange(
    minPrice: number,
    maxPrice: number,
    options: Omit<ItemSearchOptions, 'minPrice' | 'maxPrice'> = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    if (typeof minPrice !== 'number' || typeof maxPrice !== 'number') {
      return handleApiError<{ documents: Item[]; total: number }>(
        new Error('Los precios deben ser números')
      );
    }

    if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
      return handleApiError<{ documents: Item[]; total: number }>(
        new Error('Rango de precios inválido')
      );
    }

    return await this.listItems({
      ...options,
      minPrice,
      maxPrice,
    });
  }

  // Obtener items por tags
  static async getItemsByTags(
    tags: string[],
    options: Omit<ItemSearchOptions, 'tags'> = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    if (!Array.isArray(tags) || tags.length === 0) {
      return handleApiError<{ documents: Item[]; total: number }>(
        new Error('Tags requeridos')
      );
    }

    return await this.listItems({
      ...options,
      tags: tags.map((tag) => tag.trim().toLowerCase()),
    });
  }

  // Gestión de imágenes
  static async addImages(
    itemId: string,
    files: File[]
  ): Promise<ApiResponse<{ images: string[]; imageIds: string[] }>> {
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      return handleApiError<{ images: string[]; imageIds: string[] }>(
        new Error('ID de item requerido')
      );
    }

    if (!Array.isArray(files) || files.length === 0) {
      return handleApiError<{ images: string[]; imageIds: string[] }>(
        new Error('Archivos de imagen requeridos')
      );
    }

    try {
      // Obtener item actual
      const itemResult = await this.getItem(itemId);
      if (!itemResult.success || !itemResult.data) {
        return handleApiError<{ images: string[]; imageIds: string[] }>(
          new Error('Item no encontrado')
        );
      }

      const item = itemResult.data;

      // Validar límite de imágenes (máximo 10)
      if (item.images.length + files.length > 10) {
        return handleApiError<{ images: string[]; imageIds: string[] }>(
          new Error('No se pueden agregar más de 10 imágenes por item')
        );
      }

      // Subir archivos
      const uploadResults = await uploadMultipleFiles(
        files,
        'item',
        itemId.trim()
      );

      // Extraer URLs e IDs
      const newImages = uploadResults.map((result) => result.url);
      const newImageIds = uploadResults.map((result) => result.fileId);

      // Actualizar item con nuevas imágenes
      const updatedImages = [...item.images, ...newImages];
      const updatedImageIds = [...item.imageIds, ...newImageIds];

      const updateResult = await this.updateItem(itemId, {
        images: updatedImages,
        imageIds: updatedImageIds,
      } as UpdateItemData);

      if (updateResult.success) {
        return handleApiSuccess(
          { images: updatedImages, imageIds: updatedImageIds },
          'Imágenes agregadas exitosamente'
        );
      } else {
        // Si falla la actualización, intentar limpiar archivos subidos
        for (const imageId of newImageIds) {
          try {
            await deleteFile(imageId);
          } catch (error) {
            console.warn(`Error al limpiar imagen ${imageId}:`, error);
          }
        }
        return handleApiError<{ images: string[]; imageIds: string[] }>(
          new Error(
            updateResult.error || 'Error al actualizar item con imágenes'
          )
        );
      }
    } catch (error) {
      return handleApiError<{ images: string[]; imageIds: string[] }>(error);
    }
  }

  // Eliminar imagen específica
  static async removeImage(
    itemId: string,
    imageIndex: number
  ): Promise<ApiResponse<{ images: string[]; imageIds: string[] }>> {
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      return handleApiError<{ images: string[]; imageIds: string[] }>(
        new Error('ID de item requerido')
      );
    }

    if (typeof imageIndex !== 'number' || imageIndex < 0) {
      return handleApiError<{ images: string[]; imageIds: string[] }>(
        new Error('Índice de imagen inválido')
      );
    }

    try {
      // Obtener item actual
      const itemResult = await this.getItem(itemId);
      if (!itemResult.success || !itemResult.data) {
        return handleApiError<{ images: string[]; imageIds: string[] }>(
          new Error('Item no encontrado')
        );
      }

      const item = itemResult.data;

      // Validar índice
      if (imageIndex >= item.images.length) {
        return handleApiError<{ images: string[]; imageIds: string[] }>(
          new Error('Índice de imagen fuera de rango')
        );
      }

      // Obtener ID de imagen a eliminar
      const imageIdToDelete = item.imageIds[imageIndex];

      // Crear nuevos arrays sin la imagen eliminada
      const updatedImages = item.images.filter(
        (_, index) => index !== imageIndex
      );
      const updatedImageIds = item.imageIds.filter(
        (_, index) => index !== imageIndex
      );

      // Actualizar item
      const updateResult = await this.updateItem(itemId, {
        images: updatedImages,
        imageIds: updatedImageIds,
      } as UpdateItemData);

      if (updateResult.success) {
        // Eliminar archivo del storage
        try {
          await deleteFile(imageIdToDelete);
        } catch (error) {
          console.warn(
            `Error al eliminar imagen del storage ${imageIdToDelete}:`,
            error
          );
        }

        return handleApiSuccess(
          { images: updatedImages, imageIds: updatedImageIds },
          'Imagen eliminada exitosamente'
        );
      } else {
        return handleApiError<{ images: string[]; imageIds: string[] }>(
          new Error(updateResult.error || 'Error al actualizar item')
        );
      }
    } catch (error) {
      return handleApiError<{ images: string[]; imageIds: string[] }>(error);
    }
  }

  // Actualizar estado de disponibilidad
  static async updateAvailabilityStatus(
    itemId: string,
    status: ItemStatus,
    availability?: {
      startDate?: string;
      endDate?: string;
      timeSlots?: string[];
    }
  ): Promise<ApiResponse<Item>> {
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      return handleApiError<Item>(new Error('ID de item requerido'));
    }

    if (!ITEM_STATUSES.includes(status)) {
      return handleApiError<Item>(
        new Error(
          `Estado inválido. Debe ser uno de: ${ITEM_STATUSES.join(', ')}`
        )
      );
    }

    try {
      const updateData: UpdateItemData = { status };

      if (availability) {
        updateData.availability = availability;
      }

      return await this.updateItem(itemId, updateData);
    } catch (error) {
      return handleApiError<Item>(error);
    }
  }

  // Incrementar contador de vistas
  static async incrementViewCount(itemId: string): Promise<ApiResponse<void>> {
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      return handleApiError<void>(new Error('ID de item requerido'));
    }

    try {
      // Obtener item actual
      const itemResult = await this.getItem(itemId);
      if (!itemResult.success || !itemResult.data) {
        return handleApiError<void>(new Error('Item no encontrado'));
      }

      const currentViewCount = itemResult.data.viewCount || 0;

      const updateResult = await this.updateItem(itemId, {
        viewCount: currentViewCount + 1,
      } as UpdateItemData);

      if (updateResult.success) {
        return handleApiSuccess(undefined, 'Contador de vistas actualizado');
      } else {
        return handleApiError<void>(
          new Error(updateResult.error || 'Error al actualizar contador')
        );
      }
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  // Obtener estadísticas de items por categoría
  static async getCategoryStats(): Promise<
    ApiResponse<Record<ItemCategory, number>>
  > {
    try {
      const stats: Record<ItemCategory, number> = {} as Record<
        ItemCategory,
        number
      >;

      // Obtener conteo para cada categoría
      for (const category of Object.values(ITEM_CATEGORIES)) {
        const countResult = await DatabaseService.count(COLLECTIONS.ITEMS, [
          `category==${category}`,
          'status==available',
        ]);
        if (countResult.success && countResult.data !== undefined) {
          stats[category] = countResult.data;
        } else {
          stats[category] = 0;
        }
      }

      return handleApiSuccess(stats, 'Estadísticas de categorías obtenidas');
    } catch (error) {
      return handleApiError<Record<ItemCategory, number>>(error);
    }
  }

  // Obtener items populares (más vistos)
  static async getPopularItems(
    limit: number = 10,
    options: Omit<ItemSearchOptions, 'limit' | 'orderBy' | 'orderType'> = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    return await this.listItems({
      ...options,
      limit,
      orderBy: 'viewCount',
      orderType: 'DESC',
      status: ['available'], // Solo items disponibles
    });
  }

  // Obtener items recientes
  static async getRecentItems(
    limit: number = 10,
    options: Omit<ItemSearchOptions, 'limit' | 'orderBy' | 'orderType'> = {}
  ): Promise<ApiResponse<{ documents: Item[]; total: number }>> {
    return await this.listItems({
      ...options,
      limit,
      orderBy: 'createdAt',
      orderType: 'DESC',
      status: ['available'], // Solo items disponibles
    });
  }

  // Validar disponibilidad de item para reserva
  static async checkAvailability(
    itemId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{ available: boolean; conflicts?: string[] }>> {
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      return handleApiError<{ available: boolean; conflicts?: string[] }>(
        new Error('ID de item requerido')
      );
    }

    if (!startDate || !endDate) {
      return handleApiError<{ available: boolean; conflicts?: string[] }>(
        new Error('Fechas de inicio y fin requeridas')
      );
    }

    try {
      // Obtener item
      const itemResult = await this.getItem(itemId);
      if (!itemResult.success || !itemResult.data) {
        return handleApiError<{ available: boolean; conflicts?: string[] }>(
          new Error('Item no encontrado')
        );
      }

      const item = itemResult.data;

      // Verificar estado del item
      if (item.status !== 'available') {
        return handleApiSuccess({
          available: false,
          conflicts: [`Item no disponible (estado: ${item.status})`],
        });
      }

      // Verificar disponibilidad configurada
      if (item.availability) {
        const requestStart = new Date(startDate);
        const requestEnd = new Date(endDate);

        if (item.availability.startDate) {
          const availableStart = new Date(item.availability.startDate);
          if (requestStart < availableStart) {
            return handleApiSuccess({
              available: false,
              conflicts: [
                'Fecha de inicio anterior a la disponibilidad del item',
              ],
            });
          }
        }

        if (item.availability.endDate) {
          const availableEnd = new Date(item.availability.endDate);
          if (requestEnd > availableEnd) {
            return handleApiSuccess({
              available: false,
              conflicts: [
                'Fecha de fin posterior a la disponibilidad del item',
              ],
            });
          }
        }
      }

      // TODO: Aquí se podría verificar contra reservas existentes
      // Por ahora, asumimos que está disponible si pasa las validaciones básicas

      return handleApiSuccess({
        available: true,
      });
    } catch (error) {
      return handleApiError<{ available: boolean; conflicts?: string[] }>(
        error
      );
    }
  }
}

// Funciones de utilidad exportadas
export const getValidCategories = (): ItemCategory[] => {
  return Object.values(ITEM_CATEGORIES);
};

export const getSubcategoriesForCategory = (
  category: ItemCategory
): string[] => {
  return ITEM_SUBCATEGORIES[category] || [];
};

export const getValidConditions = (): ItemCondition[] => {
  return [...ITEM_CONDITIONS];
};

export const getValidStatuses = (): ItemStatus[] => {
  return [...ITEM_STATUSES];
};

// Función para formatear precio con moneda
export const formatPrice = (
  price: number,
  currency: string = 'USD'
): string => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
};

// Función para generar slug de item para URLs amigables
export const generateItemSlug = (title: string, id: string): string => {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .trim();

  return `${slug}-${id}`;
};
