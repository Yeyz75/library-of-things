import {
  Client,
  Account,
  Databases,
  Storage,
  Functions,
  ID,
  Query,
} from 'appwrite';

// Configuración del cliente Appwrite
const client = new Client();

client
  .setEndpoint(
    import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
  )
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

// Servicios de Appwrite
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Configuración de la base de datos
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';

// IDs de colecciones usando las mismas variables de entorno que ya tienes
export const COLLECTIONS = {
  USERS: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || '',
  ITEMS: import.meta.env.VITE_APPWRITE_ITEMS_COLLECTION_ID || '',
  RESERVATIONS: import.meta.env.VITE_APPWRITE_RESERVATIONS_COLLECTION_ID || '',
  REVIEWS: import.meta.env.VITE_APPWRITE_REVIEWS_COLLECTION_ID || '',
  USER_STATS: import.meta.env.VITE_APPWRITE_USER_STATS_COLLECTION_ID || '',
} as const;

// Storage Bucket ID
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || '';

// Tipos base para respuestas
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Opciones para consultas
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderType?: 'ASC' | 'DESC';
  filters?: string[];
  search?: {
    field: string;
    value: string;
  };
}

// Wrapper para manejo de errores
export const handleApiError = <T = unknown>(error: unknown): ApiResponse<T> => {
  console.error('API Error:', error);

  const errorMessage =
    error instanceof Error ? error.message : 'Error desconocido';

  return {
    success: false,
    error: errorMessage,
    message: errorMessage || 'Ha ocurrido un error inesperado',
  };
};

// Wrapper para respuestas exitosas
export const handleApiSuccess = <T>(
  data: T,
  message?: string
): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
  };
};

// Función genérica para crear recursos API
export function apiResource<T extends { $id?: string }>(collectionId: string) {
  return {
    // Listar todos los documentos (index)
    async index(
      options: QueryOptions = {}
    ): Promise<ApiResponse<{ documents: T[]; total: number }>> {
      try {
        const queries = [];

        if (options.limit) {
          queries.push(Query.limit(options.limit));
        }

        if (options.offset) {
          queries.push(Query.offset(options.offset));
        }

        if (options.orderBy) {
          const orderType = options.orderType || 'ASC';
          if (orderType === 'DESC') {
            queries.push(Query.orderDesc(options.orderBy));
          } else {
            queries.push(Query.orderAsc(options.orderBy));
          }
        }

        if (options.filters) {
          queries.push(...options.filters);
        }

        if (options.search) {
          queries.push(
            Query.search(options.search.field, options.search.value)
          );
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          collectionId,
          queries
        );

        return handleApiSuccess({
          documents: response.documents as unknown as T[],
          total: response.total,
        });
      } catch (error) {
        return handleApiError<{ documents: T[]; total: number }>(error);
      }
    },

    // Obtener un documento por ID (show)
    async show(id: string): Promise<ApiResponse<T>> {
      try {
        const document = await databases.getDocument(
          DATABASE_ID,
          collectionId,
          id
        );

        return handleApiSuccess(document as unknown as T);
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Crear un nuevo documento (save)
    async save(
      data: Omit<
        T,
        | '$id'
        | '$createdAt'
        | '$updatedAt'
        | '$permissions'
        | '$collectionId'
        | '$databaseId'
      >,
      documentId?: string,
      permissions?: string[]
    ): Promise<ApiResponse<T>> {
      try {
        const document = await databases.createDocument(
          DATABASE_ID,
          collectionId,
          documentId || ID.unique(),
          data,
          permissions
        );

        return handleApiSuccess(
          document as unknown as T,
          'Documento creado exitosamente'
        );
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Actualizar un documento existente (update)
    async update(
      id: string,
      data: Partial<
        Omit<
          T,
          | '$id'
          | '$createdAt'
          | '$updatedAt'
          | '$permissions'
          | '$collectionId'
          | '$databaseId'
        >
      >,
      permissions?: string[]
    ): Promise<ApiResponse<T>> {
      try {
        const document = await databases.updateDocument(
          DATABASE_ID,
          collectionId,
          id,
          data,
          permissions
        );

        return handleApiSuccess(
          document as unknown as T,
          'Documento actualizado exitosamente'
        );
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Eliminar un documento (remove)
    async remove(id: string): Promise<ApiResponse<void>> {
      try {
        await databases.deleteDocument(DATABASE_ID, collectionId, id);

        return handleApiSuccess(undefined, 'Documento eliminado exitosamente');
      } catch (error) {
        return handleApiError<void>(error);
      }
    },

    // Buscar documentos
    async search(
      searchField: string,
      searchValue: string,
      options: Omit<QueryOptions, 'search'> = {}
    ): Promise<ApiResponse<{ documents: T[]; total: number }>> {
      return this.index({
        ...options,
        search: { field: searchField, value: searchValue },
      });
    },

    // Contar documentos
    async count(filters?: string[]): Promise<ApiResponse<number>> {
      try {
        const queries = filters || [];
        queries.push(Query.limit(1)); // Solo necesitamos el total

        const response = await databases.listDocuments(
          DATABASE_ID,
          collectionId,
          queries
        );

        return handleApiSuccess(response.total);
      } catch (error) {
        return handleApiError<number>(error);
      }
    },
  };
}

// Helper functions para storage (migradas desde lib/appwrite)
export const generateFileMetadata = (
  type: 'avatar' | 'item',
  entityId: string,
  originalFileName: string
) => {
  const timestamp = Date.now();
  const extension = originalFileName.split('.').pop() || 'jpg';
  return {
    type,
    entityId,
    timestamp,
    extension,
    originalName: originalFileName,
  };
};

export const getFilePreview = (fileId: string, width = 400, height = 400) => {
  return storage.getFilePreview(BUCKET_ID, fileId, width, height);
};

export const getFileView = (fileId: string) => {
  return storage.getFileView(BUCKET_ID, fileId);
};

export const uploadFile = async (
  file: File,
  type: 'avatar' | 'item',
  entityId: string
): Promise<{ fileId: string; url: string; metadata: unknown }> => {
  const metadata = generateFileMetadata(type, entityId, file.name);

  const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
  const url = getFileView(response.$id).toString();

  return {
    fileId: response.$id,
    url,
    metadata,
  };
};

export const deleteFile = async (fileId: string): Promise<void> => {
  await storage.deleteFile(BUCKET_ID, fileId);
};

export const uploadMultipleFiles = async (
  files: File[],
  type: 'avatar' | 'item',
  entityId: string
): Promise<Array<{ fileId: string; url: string; metadata: unknown }>> => {
  const uploadPromises = files.map((file) => uploadFile(file, type, entityId));
  return Promise.all(uploadPromises);
};

// Exportar Query y ID para uso en filtros personalizados
export { Query, ID };
