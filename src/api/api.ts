import { auth, db, storage } from '../lib/firebase';
import type {
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import type { AuthError } from 'firebase/auth';
import type { StorageError } from 'firebase/storage';

// Servicios principales de Firebase
export { auth, db, storage };

// Constantes de colecciones tipadas
export const COLLECTIONS = {
  USERS: 'users',
  ITEMS: 'items',
  RESERVATIONS: 'reservations',
  REVIEWS: 'reviews',
  USER_STATS: 'userStats',
} as const;

// Tipo para las claves de colecciones
export type CollectionKey = keyof typeof COLLECTIONS;

// Configuración de Firebase validada
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Validación de configuración de Firebase
export const validateFirebaseConfig = (): FirebaseConfig => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter((field) => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Configuración de Firebase incompleta. Faltan las siguientes variables de entorno: ${missingFields
        .map(
          (field) =>
            `VITE_FIREBASE_${field.toUpperCase().replace(/([A-Z])/g, '_$1')}`
        )
        .join(', ')}`
    );
  }

  return config as FirebaseConfig;
};

// Validar configuración al inicializar
try {
  validateFirebaseConfig();
} catch (error) {
  console.error('Error de configuración de Firebase:', error);
}

// Tipos base para respuestas
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
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

// Configuración de reintentos
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

// Configuración por defecto para reintentos
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableErrors: [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'internal',
    'network-request-failed',
  ],
};

// Mapeo de códigos de error de Firebase a mensajes user-friendly
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Errores de autenticación
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/email-already-in-use': 'El email ya está en uso',
  'auth/weak-password': 'La contraseña es muy débil',
  'auth/invalid-email': 'Email inválido',
  'auth/user-disabled': 'Usuario deshabilitado',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',

  // Errores de Firestore
  'firestore/permission-denied': 'No tienes permisos para realizar esta acción',
  'firestore/not-found': 'Documento no encontrado',
  'firestore/already-exists': 'El documento ya existe',
  'firestore/resource-exhausted': 'Límite de recursos excedido',
  'firestore/failed-precondition': 'Condición previa fallida',
  'firestore/aborted': 'Operación cancelada',
  'firestore/out-of-range': 'Valor fuera de rango',
  'firestore/unimplemented': 'Operación no implementada',
  'firestore/internal': 'Error interno del servidor',
  'firestore/unavailable': 'Servicio no disponible temporalmente',
  'firestore/data-loss': 'Pérdida de datos detectada',
  'firestore/unauthenticated': 'Usuario no autenticado',
  'firestore/deadline-exceeded': 'Tiempo de espera agotado',

  // Errores de Storage
  'storage/object-not-found': 'Archivo no encontrado',
  'storage/bucket-not-found': 'Bucket de almacenamiento no encontrado',
  'storage/project-not-found': 'Proyecto no encontrado',
  'storage/quota-exceeded': 'Cuota de almacenamiento excedida',
  'storage/unauthenticated': 'Usuario no autenticado',
  'storage/unauthorized': 'No autorizado para esta operación',
  'storage/retry-limit-exceeded': 'Límite de reintentos excedido',
  'storage/invalid-checksum': 'Checksum inválido',
  'storage/canceled': 'Operación cancelada',
  'storage/invalid-event-name': 'Nombre de evento inválido',
  'storage/invalid-url': 'URL inválida',
  'storage/invalid-argument': 'Argumento inválido',
  'storage/no-default-bucket': 'No hay bucket por defecto configurado',
  'storage/cannot-slice-blob': 'No se puede dividir el blob',
  'storage/server-file-wrong-size':
    'Tamaño de archivo incorrecto en el servidor',
};

// Función para extraer código de error de Firebase
const getFirebaseErrorCode = (error: unknown): string | null => {
  if (error && typeof error === 'object') {
    const firebaseError = error as FirestoreError | AuthError | StorageError;
    return firebaseError.code || null;
  }
  return null;
};

// Función para determinar si un error es reintentable
const isRetryableError = (error: unknown): boolean => {
  const code = getFirebaseErrorCode(error);
  return code ? DEFAULT_RETRY_CONFIG.retryableErrors.includes(code) : false;
};

// Función de delay con backoff exponencial
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const calculateBackoffDelay = (
  attempt: number,
  config: RetryConfig
): number => {
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  return Math.min(exponentialDelay + jitter, config.maxDelay);
};

// Wrapper mejorado para manejo de errores
export const handleApiError = <T = unknown>(error: unknown): ApiResponse<T> => {
  console.error('API Error:', error);

  const code = getFirebaseErrorCode(error);
  const errorMessage =
    error instanceof Error ? error.message : 'Error desconocido';

  // Buscar mensaje user-friendly
  const userMessage = code ? FIREBASE_ERROR_MESSAGES[code] : null;

  return {
    success: false,
    error: errorMessage,
    message: userMessage || errorMessage || 'Ha ocurrido un error inesperado',
    code: code || undefined,
  };
};

// Función de reintento con backoff exponencial
export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Si no es reintentable o es el último intento, lanzar error
      if (!isRetryableError(error) || attempt === config.maxRetries) {
        throw error;
      }

      // Calcular delay y esperar antes del siguiente intento
      const delayMs = calculateBackoffDelay(attempt, config);
      console.warn(
        `Intento ${attempt + 1} falló, reintentando en ${delayMs}ms:`,
        error
      );
      await delay(delayMs);
    }
  }

  throw lastError;
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

// Interfaz base para entidades con ID
export interface BaseEntity {
  $id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Función genérica para crear recursos API con manejo mejorado de errores
export function apiResource<T extends BaseEntity>(collectionId: string) {
  // Validar que el collectionId esté presente
  if (!collectionId || typeof collectionId !== 'string') {
    console.error(
      'apiResource: collectionId is required but was empty, undefined, or not a string'
    );
    // Retornar métodos que fallan gracefully
    const failedMethod = <R>(): Promise<ApiResponse<R>> =>
      Promise.resolve(
        handleApiError<R>(
          new Error(
            'Collection ID is not configured. Please check your environment variables.'
          )
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
    // Listar todos los documentos (index) usando Firestore modular con reintentos
    async index(
      options: QueryOptions = {}
    ): Promise<ApiResponse<{ documents: T[]; total: number }>> {
      try {
        return await withRetry(async () => {
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
          if (options.limit && options.limit > 0) {
            queryConstraints.push(limit(options.limit));
          }
          if (options.filters && Array.isArray(options.filters)) {
            options.filters.forEach((filter) => {
              const [field, value] = filter.split('==');
              if (field?.trim() && value?.trim()) {
                queryConstraints.push(where(field.trim(), '==', value.trim()));
              }
            });
          }
          if (options.search?.field && options.search?.value) {
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
        });
      } catch (error) {
        return handleApiError<{ documents: T[]; total: number }>(error);
      }
    },

    // Obtener un documento por ID (show) con reintentos
    async show(id: string): Promise<ApiResponse<T>> {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return handleApiError<T>(new Error('ID de documento requerido'));
      }

      try {
        return await withRetry(async () => {
          const { doc, getDoc } = await import('firebase/firestore');
          const docRef = doc(db, collectionId, id.trim());
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const error = new Error(
              'Documento no encontrado'
            ) as FirestoreError;
            throw error;
          }
          return handleApiSuccess({ $id: docSnap.id, ...docSnap.data() } as T);
        });
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Crear un nuevo documento (save) con reintentos y validación
    async save(
      data: Omit<T, '$id'>,
      documentId?: string
    ): Promise<ApiResponse<T>> {
      if (!data || typeof data !== 'object') {
        return handleApiError<T>(
          new Error('Datos requeridos para crear documento')
        );
      }

      try {
        return await withRetry(async () => {
          const { collection, addDoc, doc, setDoc, serverTimestamp } =
            await import('firebase/firestore');

          // Agregar timestamps automáticamente
          const timestamp = serverTimestamp();
          const dataWithTimestamps = {
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          let docRef;
          if (
            documentId &&
            typeof documentId === 'string' &&
            documentId.trim() !== ''
          ) {
            docRef = doc(db, collectionId, documentId.trim());
            await setDoc(docRef, dataWithTimestamps);
          } else {
            docRef = await addDoc(
              collection(db, collectionId),
              dataWithTimestamps
            );
          }

          const newDoc = documentId
            ? { $id: documentId.trim(), ...dataWithTimestamps }
            : { $id: docRef.id, ...dataWithTimestamps };
          return handleApiSuccess(
            newDoc as unknown as T,
            'Documento creado exitosamente'
          );
        });
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Actualizar un documento existente (update) con reintentos y validación
    async update(
      id: string,
      data: Partial<Omit<T, '$id'>>
    ): Promise<ApiResponse<T>> {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return handleApiError<T>(new Error('ID de documento requerido'));
      }
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return handleApiError<T>(
          new Error('Datos requeridos para actualizar documento')
        );
      }

      try {
        return await withRetry(async () => {
          const { doc, updateDoc, serverTimestamp } = await import(
            'firebase/firestore'
          );

          // Agregar timestamp de actualización
          const dataWithTimestamp = {
            ...data,
            updatedAt: serverTimestamp(),
          };

          const docRef = doc(db, collectionId, id.trim());
          await updateDoc(docRef, dataWithTimestamp);
          return handleApiSuccess(
            { $id: id.trim(), ...dataWithTimestamp } as unknown as T,
            'Documento actualizado exitosamente'
          );
        });
      } catch (error) {
        return handleApiError<T>(error);
      }
    },

    // Eliminar un documento (remove) con reintentos y validación
    async remove(id: string): Promise<ApiResponse<void>> {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return handleApiError<void>(new Error('ID de documento requerido'));
      }

      try {
        return await withRetry(async () => {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const docRef = doc(db, collectionId, id.trim());
          await deleteDoc(docRef);
          return handleApiSuccess(
            undefined,
            'Documento eliminado exitosamente'
          );
        });
      } catch (error) {
        return handleApiError<void>(error);
      }
    },

    // Buscar documentos con validación mejorada
    async search(
      searchField: string,
      searchValue: string,
      options: Omit<QueryOptions, 'search'> = {}
    ): Promise<ApiResponse<{ documents: T[]; total: number }>> {
      if (
        !searchField ||
        typeof searchField !== 'string' ||
        searchField.trim() === ''
      ) {
        return handleApiError<{ documents: T[]; total: number }>(
          new Error('Campo de búsqueda requerido')
        );
      }
      if (
        !searchValue ||
        typeof searchValue !== 'string' ||
        searchValue.trim() === ''
      ) {
        return handleApiError<{ documents: T[]; total: number }>(
          new Error('Valor de búsqueda requerido')
        );
      }

      return this.index({
        ...options,
        search: { field: searchField.trim(), value: searchValue.trim() },
      });
    },

    // Contar documentos con manejo mejorado de errores
    async count(filters?: string[]): Promise<ApiResponse<number>> {
      try {
        // Validar filtros si se proporcionan
        if (filters && !Array.isArray(filters)) {
          return handleApiError<number>(
            new Error('Los filtros deben ser un array')
          );
        }

        // Usamos index y devolvemos el total
        const result = await this.index({ filters });
        if (!result.success) {
          return handleApiError<number>(
            new Error(result.error || 'Error al contar documentos')
          );
        }
        return handleApiSuccess(result.data?.total ?? 0);
      } catch (error) {
        return handleApiError<number>(error);
      }
    },

    // ...métodos migrados arriba...
  };
}

// Helper functions para storage con Firebase mejoradas
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

// Tipos para metadatos de archivos
export interface FileMetadata {
  type: 'avatar' | 'item';
  entityId: string;
  timestamp: number;
  extension: string;
  originalName: string;
  size?: number;
  contentType?: string;
}

// Tipos permitidos de archivos
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'text/plain'],
} as const;

// Tamaño máximo de archivo (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Validar archivo
const validateFile = (file: File): void => {
  if (!file || !(file instanceof File)) {
    throw new Error('Archivo inválido');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  const isValidType = [
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.documents,
  ].includes(file.type);

  if (!isValidType) {
    throw new Error('Tipo de archivo no permitido');
  }
};

export const generateFileMetadata = (
  type: 'avatar' | 'item',
  entityId: string,
  originalFileName: string,
  file?: File
): FileMetadata => {
  if (!type || !entityId || !originalFileName) {
    throw new Error('Parámetros requeridos para generar metadatos');
  }

  const timestamp = Date.now();
  const extension = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';

  return {
    type,
    entityId: entityId.trim(),
    timestamp,
    extension,
    originalName: originalFileName,
    size: file?.size,
    contentType: file?.type,
  };
};

export const uploadFile = async (
  file: File,
  type: 'avatar' | 'item',
  entityId: string
): Promise<{ fileId: string; url: string; metadata: FileMetadata }> => {
  // Validar archivo
  validateFile(file);

  if (!entityId || typeof entityId !== 'string' || entityId.trim() === '') {
    throw new Error('ID de entidad requerido');
  }

  return await withRetry(async () => {
    const metadata = generateFileMetadata(type, entityId, file.name, file);
    const fileId = `${type}/${entityId.trim()}/${metadata.timestamp}_${metadata.originalName}`;
    const storageRef = ref(storage, fileId);

    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: metadata.originalName,
        entityId: metadata.entityId,
        type: metadata.type,
      },
    });

    const url = await getDownloadURL(storageRef);

    return {
      fileId,
      url,
      metadata,
    };
  });
};

export const deleteFile = async (fileId: string): Promise<void> => {
  if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
    throw new Error('ID de archivo requerido');
  }

  return await withRetry(async () => {
    const storageRef = ref(storage, fileId.trim());
    await deleteObject(storageRef);
  });
};

export const uploadMultipleFiles = async (
  files: File[],
  type: 'avatar' | 'item',
  entityId: string
): Promise<Array<{ fileId: string; url: string; metadata: FileMetadata }>> => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Array de archivos requerido');
  }

  if (!entityId || typeof entityId !== 'string' || entityId.trim() === '') {
    throw new Error('ID de entidad requerido');
  }

  // Validar todos los archivos antes de subir
  files.forEach(validateFile);

  // Subir archivos en paralelo con límite de concurrencia
  const BATCH_SIZE = 3;
  const results: Array<{
    fileId: string;
    url: string;
    metadata: FileMetadata;
  }> = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map((file) => uploadFile(file, type, entityId));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
};
