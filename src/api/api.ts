import { auth, db, storage } from '../lib/firebase';
import type {
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

// Servicios principales de Firebase
export { auth, db, storage };

// Puedes definir aquí los nombres de colecciones de Firestore
export const COLLECTIONS = {
  USERS: 'users',
  ITEMS: 'items',
  RESERVATIONS: 'reservations',
  REVIEWS: 'reviews',
  USER_STATS: 'userStats',
} as const;

// Storage Bucket (solo para referencia, Firebase usa el configurado en firebase.ts)
export const BUCKET_NAME = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '';

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
  // Validar que el collectionId esté presente
  if (!collectionId) {
    console.error(
      'apiResource: collectionId is required but was empty or undefined'
    );
    // Retornar métodos que fallan gracefully
    const failedMethod = <R>(): Promise<ApiResponse<R>> =>
      Promise.resolve(
        handleApiError<R>(
          'Collection ID is not configured. Please check your environment variables.'
        )
      );
    return {
      index: failedMethod,
      show: failedMethod,
      save: failedMethod,
      update: failedMethod,
      remove: failedMethod,
      search: failedMethod,
      count: failedMethod,
    };
  }

  return {
    // Listar todos los documentos (index) usando Firestore modular
    async index(
      options: QueryOptions = {}
    ): Promise<ApiResponse<{ documents: T[]; total: number }>> {
      try {
        const { collection, getDocs, query, orderBy, limit, where } =
          await import('firebase/firestore');
        const queryConstraints: QueryConstraint[] = [];

        if (options.orderBy) {
          queryConstraints.push(
            orderBy(
              options.orderBy,
              options.orderType === 'DESC' ? 'desc' : 'asc'
            )
          );
        }
        if (options.limit) {
          queryConstraints.push(limit(options.limit));
        }
        if (options.filters) {
          options.filters.forEach((filter) => {
            const [field, value] = filter.split('==');
            if (field && value) {
              queryConstraints.push(where(field, '==', value));
            }
          });
        }
        if (options.search) {
          queryConstraints.push(
            where(options.search.field, '==', options.search.value)
          );
        }

        const q = query(collection(db, collectionId), ...queryConstraints);
        const snapshot = await getDocs(q);
        const documents: T[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) =>
            ({ $id: doc.id, ...doc.data() }) as T
        );
        const total = documents.length;
        return handleApiSuccess({ documents, total });
      } catch (error) {
        return handleApiError<{ documents: T[]; total: number }>(error);
      }
    },

    // Obtener un documento por ID (show)
    async show(id: string): Promise<ApiResponse<T>> {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc(db, collectionId, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Documento no encontrado');
        }
        return handleApiSuccess({ $id: docSnap.id, ...docSnap.data() } as T);
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Crear un nuevo documento (save)
    async save(
      data: Omit<T, '$id'>,
      documentId?: string
    ): Promise<ApiResponse<T>> {
      try {
        const { collection, addDoc, doc, setDoc } = await import(
          'firebase/firestore'
        );
        let docRef;
        if (documentId) {
          docRef = doc(db, collectionId, documentId);
          await setDoc(docRef, data);
        } else {
          docRef = await addDoc(collection(db, collectionId), data);
        }
        const newDoc = documentId
          ? { $id: documentId, ...data }
          : { $id: docRef.id, ...data };
        return handleApiSuccess(newDoc as T, 'Documento creado exitosamente');
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Actualizar un documento existente (update)
    async update(
      id: string,
      data: Partial<Omit<T, '$id'>>
    ): Promise<ApiResponse<T>> {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const docRef = doc(db, collectionId, id);
        await updateDoc(docRef, data);
        return handleApiSuccess(
          { $id: id, ...data } as T,
          'Documento actualizado exitosamente'
        );
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Eliminar un documento (remove)
    async remove(id: string): Promise<ApiResponse<void>> {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        const docRef = doc(db, collectionId, id);
        await deleteDoc(docRef);
        return handleApiSuccess(undefined, 'Documento eliminado exitosamente');
      } catch (error) {
        return handleApiError<void>(error);
      }
    },

    // Buscar documentos (igual que index pero con search)
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
        // Usamos index y devolvemos el total
        const result = await this.index({ filters });
        return handleApiSuccess(result.data?.total ?? 0);
      } catch (error) {
        return handleApiError<number>(error);
      }
    },

    // ...métodos migrados arriba...
  };
}

// Helper functions para storage con Firebase
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

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

export const uploadFile = async (
  file: File,
  type: 'avatar' | 'item',
  entityId: string
): Promise<{ fileId: string; url: string; metadata: unknown }> => {
  const metadata = generateFileMetadata(type, entityId, file.name);
  const fileId = `${type}/${entityId}/${metadata.timestamp}_${metadata.originalName}`;
  const storageRef = ref(storage, fileId);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return {
    fileId,
    url,
    metadata,
  };
};

export const deleteFile = async (fileId: string): Promise<void> => {
  const storageRef = ref(storage, fileId);
  await deleteObject(storageRef);
};

export const uploadMultipleFiles = async (
  files: File[],
  type: 'avatar' | 'item',
  entityId: string
): Promise<Array<{ fileId: string; url: string; metadata: unknown }>> => {
  const uploadPromises = files.map((file) => uploadFile(file, type, entityId));
  return Promise.all(uploadPromises);
};
