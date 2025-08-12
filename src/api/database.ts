import {
  databases,
  DATABASE_ID,
  COLLECTIONS,
  handleApiError,
  handleApiSuccess,
  type ApiResponse,
} from './api';
import { ID, Query } from 'appwrite';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderType?: 'ASC' | 'DESC';
  filters?: Array<string>;
}

export interface Document {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
  [key: string]: unknown;
}

export class DatabaseAPI {
  // Crear documento
  static async createDocument<
    T = Document,
    D extends Record<string, unknown> = Record<string, unknown>,
  >(
    collectionId: string,
    data: D,
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

      return handleApiSuccess(document as T, 'Documento creado exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<T>;
    }
  }

  // Obtener documento por ID
  static async getDocument<T = Document>(
    collectionId: string,
    documentId: string
  ): Promise<ApiResponse<T>> {
    try {
      const document = await databases.getDocument(
        DATABASE_ID,
        collectionId,
        documentId
      );

      return handleApiSuccess(document as T);
    } catch (error) {
      return handleApiError(error) as ApiResponse<T>;
    }
  }

  // Listar documentos con opciones de consulta
  static async listDocuments<T = Document>(
    collectionId: string,
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

      const response = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        queries
      );

      return handleApiSuccess({
        documents: response.documents as T[],
        total: response.total,
      });
    } catch (error) {
      return handleApiError(error) as ApiResponse<{
        documents: T[];
        total: number;
      }>;
    }
  }

  // Actualizar documento
  static async updateDocument<
    T = Document,
    D extends Record<string, unknown> = Record<string, unknown>,
  >(
    collectionId: string,
    documentId: string,
    data: D,
    permissions?: string[]
  ): Promise<ApiResponse<T>> {
    try {
      const document = await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        documentId,
        data,
        permissions
      );

      return handleApiSuccess(
        document as T,
        'Documento actualizado exitosamente'
      );
    } catch (error) {
      return handleApiError(error) as ApiResponse<T>;
    }
  }

  // Eliminar documento
  static async deleteDocument(
    collectionId: string,
    documentId: string
  ): Promise<ApiResponse<null>> {
    try {
      await databases.deleteDocument(DATABASE_ID, collectionId, documentId);

      return handleApiSuccess(null, 'Documento eliminado exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<null>;
    }
  }

  // Buscar documentos
  static async searchDocuments<T = Document>(
    collectionId: string,
    searchTerm: string,
    searchFields: string[],
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: T[]; total: number }>> {
    try {
      const queries = [];

      // Crear consultas de búsqueda para cada campo
      const searchQueries = searchFields.map((field) =>
        Query.search(field, searchTerm)
      );

      queries.push(...searchQueries);

      if (options.limit) {
        queries.push(Query.limit(options.limit));
      }

      if (options.offset) {
        queries.push(Query.offset(options.offset));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        queries
      );

      return handleApiSuccess({
        documents: response.documents as T[],
        total: response.total,
      });
    } catch (error) {
      return handleApiError(error) as ApiResponse<{
        documents: T[];
        total: number;
      }>;
    }
  }

  // Métodos específicos para colecciones comunes
  static async createUser<
    D extends Record<string, unknown> = Record<string, unknown>,
  >(userData: D): Promise<ApiResponse<Document>> {
    return this.createDocument(COLLECTIONS.USERS, userData);
  }

  static async getUser(userId: string): Promise<ApiResponse<Document>> {
    return this.getDocument(COLLECTIONS.USERS, userId);
  }

  static async updateUser<
    D extends Record<string, unknown> = Record<string, unknown>,
  >(userId: string, userData: D): Promise<ApiResponse<Document>> {
    return this.updateDocument(COLLECTIONS.USERS, userId, userData);
  }

  // Métodos para POSTS eliminados o comentados porque COLLECTIONS.POSTS no existe
  /*
  static async createPost<
    D extends Record<string, unknown> = Record<string, unknown>,
  >(postData: D): Promise<ApiResponse<Document>> {
    return this.createDocument(COLLECTIONS.POSTS, postData);
  }

  static async getPosts(
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: Document[]; total: number }>> {
    return this.listDocuments(COLLECTIONS.POSTS, options);
  }
  */
}
