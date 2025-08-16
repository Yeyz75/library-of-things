import {
  db,
  COLLECTIONS,
  handleApiError,
  handleApiSuccess,
  withRetry,
  type ApiResponse,
  type QueryOptions,
  type BaseEntity,
} from './api';
import type {
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  WriteBatch,
  Transaction,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';

// Interfaz para operaciones batch
export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: Record<string, unknown>;
}

// Interfaz para opciones de transacción
export interface TransactionOptions {
  maxAttempts?: number;
}

// Clase principal del servicio de base de datos
export class DatabaseService {
  // Crear documento con ID automático o personalizado
  static async create<T extends BaseEntity>(
    collection: string,
    data: Omit<T, '$id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ): Promise<ApiResponse<T>> {
    if (!collection || typeof collection !== 'string') {
      return handleApiError<T>(new Error('Nombre de colección requerido'));
    }

    if (!data || typeof data !== 'object') {
      return handleApiError<T>(
        new Error('Datos requeridos para crear documento')
      );
    }

    try {
      return await withRetry(async () => {
        const {
          collection: firestoreCollection,
          addDoc,
          doc,
          setDoc,
          serverTimestamp,
        } = await import('firebase/firestore');

        const timestamp = serverTimestamp();
        const dataWithTimestamps = {
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        let docRef: DocumentReference;
        if (id && typeof id === 'string' && id.trim() !== '') {
          docRef = doc(db, collection, id.trim());
          await setDoc(docRef, dataWithTimestamps);
        } else {
          docRef = await addDoc(
            firestoreCollection(db, collection),
            dataWithTimestamps
          );
        }

        const newDoc = {
          $id: id?.trim() || docRef.id,
          ...dataWithTimestamps,
        } as unknown as T;

        return handleApiSuccess(newDoc, 'Documento creado exitosamente');
      });
    } catch (error) {
      return handleApiError<T>(error);
    }
  }

  // Leer documento por ID
  static async read<T extends BaseEntity>(
    collection: string,
    id: string
  ): Promise<ApiResponse<T>> {
    if (!collection || typeof collection !== 'string') {
      return handleApiError<T>(new Error('Nombre de colección requerido'));
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<T>(new Error('ID de documento requerido'));
    }

    try {
      return await withRetry(async () => {
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc(db, collection, id.trim());
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Documento no encontrado');
        }

        const document = {
          $id: docSnap.id,
          ...docSnap.data(),
        } as T;

        return handleApiSuccess(document);
      });
    } catch (error) {
      return handleApiError<T>(error);
    }
  }

  // Actualizar documento
  static async update<T extends BaseEntity>(
    collection: string,
    id: string,
    data: Partial<Omit<T, '$id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ApiResponse<T>> {
    if (!collection || typeof collection !== 'string') {
      return handleApiError<T>(new Error('Nombre de colección requerido'));
    }

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

        const dataWithTimestamp = {
          ...data,
          updatedAt: serverTimestamp(),
        };

        const docRef = doc(db, collection, id.trim());
        await updateDoc(docRef, dataWithTimestamp);

        const updatedDoc = {
          $id: id.trim(),
          ...dataWithTimestamp,
        } as unknown as T;

        return handleApiSuccess(
          updatedDoc,
          'Documento actualizado exitosamente'
        );
      });
    } catch (error) {
      return handleApiError<T>(error);
    }
  }

  // Eliminar documento
  static async delete(
    collection: string,
    id: string
  ): Promise<ApiResponse<void>> {
    if (!collection || typeof collection !== 'string') {
      return handleApiError<void>(new Error('Nombre de colección requerido'));
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return handleApiError<void>(new Error('ID de documento requerido'));
    }

    try {
      return await withRetry(async () => {
        const { doc, deleteDoc } = await import('firebase/firestore');
        const docRef = doc(db, collection, id.trim());
        await deleteDoc(docRef);

        return handleApiSuccess(undefined, 'Documento eliminado exitosamente');
      });
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  // Consultar documentos con filtros, ordenamiento y paginación
  static async query<T extends BaseEntity>(
    collection: string,
    options: QueryOptions = {}
  ): Promise<ApiResponse<{ documents: T[]; total: number }>> {
    if (!collection || typeof collection !== 'string') {
      return handleApiError<{ documents: T[]; total: number }>(
        new Error('Nombre de colección requerido')
      );
    }

    try {
      return await withRetry(async () => {
        const {
          collection: firestoreCollection,
          getDocs,
          query,
          orderBy,
          limit,
          startAfter,
          where,
        } = await import('firebase/firestore');

        const queryConstraints: QueryConstraint[] = [];

        // Aplicar filtros
        if (options.filters && Array.isArray(options.filters)) {
          options.filters.forEach((filter) => {
            const parts = filter.split('==');
            if (parts.length === 2) {
              const [field, value] = parts.map((p) => p.trim());
              if (field && value) {
                queryConstraints.push(where(field, '==', value));
              }
            }
          });
        }

        // Aplicar búsqueda
        if (options.search?.field && options.search?.value) {
          queryConstraints.push(
            where(options.search.field, '>=', options.search.value),
            where(options.search.field, '<=', options.search.value + '\uf8ff')
          );
        }

        // Aplicar ordenamiento
        if (options.orderBy) {
          queryConstraints.push(
            orderBy(
              options.orderBy,
              options.orderType === 'DESC' ? 'desc' : 'asc'
            )
          );
        }

        // Aplicar paginación con offset
        if (options.offset && options.offset > 0) {
          // Para offset, necesitamos hacer una consulta previa para obtener el documento de inicio
          const offsetConstraints = [...queryConstraints];
          if (options.limit) {
            offsetConstraints.push(limit(options.offset));
          }

          const offsetQuery = query(
            firestoreCollection(db, collection),
            ...offsetConstraints
          );
          const offsetSnapshot = await getDocs(offsetQuery);
          if (offsetSnapshot.docs.length > 0) {
            const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
            queryConstraints.push(startAfter(lastDoc));
          }
        }

        if (options.limit && options.limit > 0) {
          queryConstraints.push(limit(options.limit));
        }

        const q = query(
          firestoreCollection(db, collection),
          ...queryConstraints
        );
        const snapshot = await getDocs(q);

        const documents: T[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) =>
            ({ $id: doc.id, ...doc.data() }) as T
        );

        return handleApiSuccess({
          documents,
          total: documents.length,
        });
      });
    } catch (error) {
      return handleApiError<{ documents: T[]; total: number }>(error);
    }
  }

  // Contar documentos con filtros opcionales
  static async count(
    collection: string,
    filters?: string[]
  ): Promise<ApiResponse<number>> {
    if (!collection || typeof collection !== 'string') {
      return handleApiError<number>(new Error('Nombre de colección requerido'));
    }

    try {
      return await withRetry(async () => {
        const {
          collection: firestoreCollection,
          getCountFromServer,
          query,
          where,
        } = await import('firebase/firestore');

        const queryConstraints: QueryConstraint[] = [];

        // Aplicar filtros si se proporcionan
        if (filters && Array.isArray(filters)) {
          filters.forEach((filter) => {
            const parts = filter.split('==');
            if (parts.length === 2) {
              const [field, value] = parts.map((p) => p.trim());
              if (field && value) {
                queryConstraints.push(where(field, '==', value));
              }
            }
          });
        }

        const q =
          queryConstraints.length > 0
            ? query(firestoreCollection(db, collection), ...queryConstraints)
            : firestoreCollection(db, collection);

        const snapshot = await getCountFromServer(q);
        return handleApiSuccess(snapshot.data().count);
      });
    } catch (error) {
      return handleApiError<number>(error);
    }
  }

  // Operaciones batch para múltiples escrituras
  static async batchWrite(
    operations: BatchOperation[]
  ): Promise<ApiResponse<void>> {
    if (!Array.isArray(operations) || operations.length === 0) {
      return handleApiError<void>(
        new Error('Operaciones requeridas para batch write')
      );
    }

    try {
      return await withRetry(async () => {
        const { writeBatch, doc, serverTimestamp } = await import(
          'firebase/firestore'
        );
        const batch: WriteBatch = writeBatch(db);
        const timestamp = serverTimestamp();

        for (const operation of operations) {
          if (
            !operation.collection ||
            typeof operation.collection !== 'string'
          ) {
            throw new Error('Nombre de colección requerido en operación batch');
          }

          const docRef = operation.id
            ? doc(db, operation.collection, operation.id)
            : doc(db, operation.collection);

          switch (operation.type) {
            case 'create':
              if (!operation.data) {
                throw new Error('Datos requeridos para operación create');
              }
              batch.set(docRef, {
                ...operation.data,
                createdAt: timestamp,
                updatedAt: timestamp,
              });
              break;

            case 'update':
              if (!operation.data) {
                throw new Error('Datos requeridos para operación update');
              }
              batch.update(docRef, {
                ...operation.data,
                updatedAt: timestamp,
              });
              break;

            case 'delete':
              batch.delete(docRef);
              break;

            default:
              throw new Error(`Tipo de operación no válido: ${operation.type}`);
          }
        }

        await batch.commit();
        return handleApiSuccess(
          undefined,
          'Operaciones batch completadas exitosamente'
        );
      });
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  // Soporte para transacciones
  static async runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<ApiResponse<T>> {
    if (typeof updateFunction !== 'function') {
      return handleApiError<T>(new Error('Función de actualización requerida'));
    }

    try {
      return await withRetry(async () => {
        const { runTransaction } = await import('firebase/firestore');

        const result = await runTransaction(db, updateFunction, {
          maxAttempts: options.maxAttempts || 5,
        });

        return handleApiSuccess(result, 'Transacción completada exitosamente');
      });
    } catch (error) {
      return handleApiError<T>(error);
    }
  }

  // Referencias de colección tipadas
  static async getCollectionRef(
    collectionName: keyof typeof COLLECTIONS
  ): Promise<CollectionReference> {
    const { collection } = await import('firebase/firestore');
    return collection(db, COLLECTIONS[collectionName]);
  }

  // Referencia de documento tipada
  static async getDocumentRef(
    collectionName: keyof typeof COLLECTIONS,
    documentId: string
  ): Promise<DocumentReference> {
    const { doc } = await import('firebase/firestore');
    return doc(db, COLLECTIONS[collectionName], documentId);
  }
}
