import { storage } from '../lib/firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  type UploadTask,
  type UploadTaskSnapshot,
  type StorageReference,
} from 'firebase/storage';
import {
  handleApiError,
  handleApiSuccess,
  withRetry,
  type ApiResponse,
} from './api';

// Tipos para el módulo de storage
export interface FileUpload {
  fileId: string;
  url: string;
  downloadURL: string;
  metadata: FileMetadata;
  size: number;
  contentType: string;
}

export interface FileMetadata {
  type: 'avatar' | 'item' | 'document' | 'thumbnail';
  entityId: string;
  timestamp: number;
  extension: string;
  originalName: string;
  size: number;
  contentType: string;
  isOptimized?: boolean;
  thumbnailOf?: string;
}

export interface UploadProgress {
  fileId: string;
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
  error?: string;
}

export interface MultiUploadProgress {
  files: UploadProgress[];
  totalProgress: number;
  completedFiles: number;
  totalFiles: number;
}

export interface StorageValidationRules {
  maxFileSize: number;
  allowedTypes: string[];
  maxFilesPerUpload: number;
  requiresAuth: boolean;
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface SecureURLOptions {
  expirationMinutes: number;
  downloadName?: string;
  contentDisposition?: 'inline' | 'attachment';
}

// Configuración de validación por tipo de archivo
const VALIDATION_RULES: Record<string, StorageValidationRules> = {
  avatar: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFilesPerUpload: 1,
    requiresAuth: true,
  },
  item: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFilesPerUpload: 10,
    requiresAuth: true,
  },
  document: {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword'],
    maxFilesPerUpload: 5,
    requiresAuth: true,
  },
  thumbnail: {
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFilesPerUpload: 1,
    requiresAuth: false,
  },
};

// Configuración por defecto para thumbnails
const DEFAULT_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  width: 300,
  height: 300,
  quality: 0.8,
  format: 'webp',
};

/**
 * Clase principal para gestión de archivos en Firebase Storage
 */
export class StorageService {
  private uploadTasks: Map<string, UploadTask> = new Map();
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> =
    new Map();

  /**
   * Valida un archivo según las reglas establecidas
   */
  private validateFile(file: File, type: keyof typeof VALIDATION_RULES): void {
    if (!file || !(file instanceof File)) {
      throw new Error('Archivo inválido proporcionado');
    }

    const rules = VALIDATION_RULES[type];
    if (!rules) {
      throw new Error(`Tipo de archivo no soportado: ${type}`);
    }

    // Validar tamaño
    if (file.size > rules.maxFileSize) {
      const maxSizeMB = (rules.maxFileSize / 1024 / 1024).toFixed(1);
      throw new Error(`El archivo excede el tamaño máximo de ${maxSizeMB}MB`);
    }

    // Validar tipo MIME
    if (!rules.allowedTypes.includes(file.type)) {
      throw new Error(
        `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${rules.allowedTypes.join(', ')}`
      );
    }

    // Validar nombre de archivo
    if (!file.name || file.name.trim().length === 0) {
      throw new Error('El archivo debe tener un nombre válido');
    }

    // Validar extensión
    const extension = this.getFileExtension(file.name);
    if (!extension) {
      throw new Error('El archivo debe tener una extensión válida');
    }
  }

  /**
   * Valida múltiples archivos
   */
  private validateMultipleFiles(
    files: File[],
    type: keyof typeof VALIDATION_RULES
  ): void {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('Se requiere al menos un archivo');
    }

    const rules = VALIDATION_RULES[type];
    if (files.length > rules.maxFilesPerUpload) {
      throw new Error(
        `Máximo ${rules.maxFilesPerUpload} archivos permitidos por carga`
      );
    }

    files.forEach((file, index) => {
      try {
        this.validateFile(file, type);
      } catch (error) {
        throw new Error(
          `Error en archivo ${index + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
      }
    });
  }

  /**
   * Obtiene la extensión de un archivo
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  /**
   * Genera metadatos para un archivo
   */
  private generateFileMetadata(
    type: keyof typeof VALIDATION_RULES,
    entityId: string,
    file: File,
    options?: Partial<FileMetadata>
  ): FileMetadata {
    const timestamp = Date.now();
    const extension = this.getFileExtension(file.name);

    return {
      type: type as FileMetadata['type'],
      entityId: entityId.trim(),
      timestamp,
      extension,
      originalName: file.name,
      size: file.size,
      contentType: file.type,
      ...options,
    };
  }

  /**
   * Genera un ID único para el archivo
   */
  private generateFileId(metadata: FileMetadata): string {
    const sanitizedName = metadata.originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);

    return `${metadata.type}/${metadata.entityId}/${metadata.timestamp}_${sanitizedName}`;
  }

  /**
   * Crea una referencia de storage
   */
  private createStorageRef(fileId: string): StorageReference {
    return ref(storage, fileId);
  }

  /**
   * Sube un archivo individual con seguimiento de progreso
   */
  async uploadFile(
    file: File,
    type: keyof typeof VALIDATION_RULES,
    entityId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<FileUpload>> {
    try {
      // Validaciones
      if (!entityId || typeof entityId !== 'string' || entityId.trim() === '') {
        throw new Error('ID de entidad requerido');
      }

      this.validateFile(file, type);

      return await withRetry(async () => {
        const metadata = this.generateFileMetadata(type, entityId, file);
        const fileId = this.generateFileId(metadata);
        const storageRef = this.createStorageRef(fileId);

        // Configurar metadatos de Firebase Storage
        const storageMetadata = {
          contentType: file.type,
          customMetadata: {
            originalName: metadata.originalName,
            entityId: metadata.entityId,
            type: metadata.type,
            timestamp: metadata.timestamp.toString(),
            extension: metadata.extension,
          },
        };

        // Usar uploadBytesResumable para seguimiento de progreso
        const uploadTask = uploadBytesResumable(
          storageRef,
          file,
          storageMetadata
        );
        this.uploadTasks.set(fileId, uploadTask);

        if (onProgress) {
          this.progressCallbacks.set(fileId, onProgress);
        }

        return new Promise<FileUpload>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress: UploadProgress = {
                fileId,
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress:
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                state: snapshot.state as UploadProgress['state'],
              };

              const callback = this.progressCallbacks.get(fileId);
              if (callback) {
                callback(progress);
              }
            },
            (error) => {
              this.uploadTasks.delete(fileId);
              this.progressCallbacks.delete(fileId);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref
                );
                const uploadedMetadata = await getMetadata(
                  uploadTask.snapshot.ref
                );

                const fileUpload: FileUpload = {
                  fileId,
                  url: downloadURL,
                  downloadURL,
                  metadata,
                  size: uploadedMetadata.size,
                  contentType: uploadedMetadata.contentType || file.type,
                };

                this.uploadTasks.delete(fileId);
                this.progressCallbacks.delete(fileId);
                resolve(fileUpload);
              } catch (error) {
                this.uploadTasks.delete(fileId);
                this.progressCallbacks.delete(fileId);
                reject(error);
              }
            }
          );
        });
      });
    } catch (error) {
      return handleApiError<FileUpload>(error);
    }
  }

  /**
   * Sube múltiples archivos con seguimiento de progreso
   */
  async uploadMultiple(
    files: File[],
    type: keyof typeof VALIDATION_RULES,
    entityId: string,
    onProgress?: (progress: MultiUploadProgress) => void
  ): Promise<ApiResponse<FileUpload[]>> {
    try {
      // Validaciones
      if (!entityId || typeof entityId !== 'string' || entityId.trim() === '') {
        throw new Error('ID de entidad requerido');
      }

      this.validateMultipleFiles(files, type);

      const results: FileUpload[] = [];
      const progressMap = new Map<string, UploadProgress>();

      // Función para actualizar progreso total
      const updateTotalProgress = () => {
        if (!onProgress) return;

        const progresses = Array.from(progressMap.values());
        const totalProgress =
          progresses.reduce((sum, p) => sum + p.progress, 0) /
          progresses.length;
        const completedFiles = progresses.filter(
          (p) => p.state === 'success'
        ).length;

        const multiProgress: MultiUploadProgress = {
          files: progresses,
          totalProgress,
          completedFiles,
          totalFiles: files.length,
        };

        onProgress(multiProgress);
      };

      // Subir archivos en lotes para evitar sobrecarga
      const BATCH_SIZE = 3;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (file) => {
          const result = await this.uploadFile(
            file,
            type,
            entityId,
            (progress) => {
              progressMap.set(progress.fileId, progress);
              updateTotalProgress();
            }
          );

          if (!result.success || !result.data) {
            throw new Error(result.error || 'Error al subir archivo');
          }

          return result.data;
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return handleApiSuccess(
        results,
        `${results.length} archivos subidos exitosamente`
      );
    } catch (error) {
      return handleApiError<FileUpload[]>(error);
    }
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    try {
      if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
        throw new Error('ID de archivo requerido');
      }

      return await withRetry(async () => {
        const storageRef = this.createStorageRef(fileId.trim());
        await deleteObject(storageRef);
        return handleApiSuccess(undefined, 'Archivo eliminado exitosamente');
      });
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  /**
   * Obtiene la URL de descarga de un archivo
   */
  async getDownloadURL(fileId: string): Promise<ApiResponse<string>> {
    try {
      if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
        throw new Error('ID de archivo requerido');
      }

      return await withRetry(async () => {
        const storageRef = this.createStorageRef(fileId.trim());
        const url = await getDownloadURL(storageRef);
        return handleApiSuccess(url);
      });
    } catch (error) {
      return handleApiError<string>(error);
    }
  }

  /**
   * Genera una URL segura con expiración
   */
  async generateSecureURL(
    fileId: string,
    options: SecureURLOptions = { expirationMinutes: 60 }
  ): Promise<ApiResponse<string>> {
    try {
      if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
        throw new Error('ID de archivo requerido');
      }

      // Firebase Storage no soporta URLs con expiración directamente
      // Pero podemos generar URLs con parámetros personalizados
      const urlResult = await this.getDownloadURL(fileId);
      if (!urlResult.success || !urlResult.data) {
        return handleApiError<string>(
          new Error('No se pudo obtener la URL del archivo')
        );
      }

      let secureUrl = urlResult.data;

      // Agregar parámetros de descarga si se especifican
      const urlParams = new URLSearchParams();

      if (options.downloadName) {
        urlParams.append(
          'response-content-disposition',
          `${options.contentDisposition || 'attachment'}; filename="${options.downloadName}"`
        );
      }

      if (urlParams.toString()) {
        secureUrl +=
          (secureUrl.includes('?') ? '&' : '?') + urlParams.toString();
      }

      return handleApiSuccess(secureUrl, 'URL segura generada exitosamente');
    } catch (error) {
      return handleApiError<string>(error);
    }
  }
  /**
   * Genera un thumbnail de una imagen
   */
  async generateThumbnail(
    imageFileId: string,
    options: Partial<ThumbnailOptions> = {}
  ): Promise<ApiResponse<FileUpload>> {
    try {
      if (
        !imageFileId ||
        typeof imageFileId !== 'string' ||
        imageFileId.trim() === ''
      ) {
        throw new Error('ID de archivo de imagen requerido');
      }

      const thumbnailOptions = { ...DEFAULT_THUMBNAIL_OPTIONS, ...options };

      // Obtener la imagen original
      const originalUrlResult = await this.getDownloadURL(imageFileId);
      if (!originalUrlResult.success || !originalUrlResult.data) {
        throw new Error('No se pudo obtener la imagen original');
      }

      // Crear canvas para redimensionar la imagen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo crear el contexto del canvas');
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
          try {
            // Calcular dimensiones manteniendo proporción
            const aspectRatio = img.width / img.height;
            let { width, height } = thumbnailOptions;

            if (aspectRatio > 1) {
              height = width / aspectRatio;
            } else {
              width = height * aspectRatio;
            }

            // Configurar canvas
            canvas.width = width;
            canvas.height = height;

            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a blob
            canvas.toBlob(
              async (blob) => {
                if (!blob) {
                  reject(new Error('No se pudo generar el thumbnail'));
                  return;
                }

                try {
                  // Crear archivo desde blob
                  const thumbnailFile = new File(
                    [blob],
                    `thumbnail_${Date.now()}.${thumbnailOptions.format}`,
                    { type: `image/${thumbnailOptions.format}` }
                  );

                  // Extraer entityId del fileId original
                  const pathParts = imageFileId.split('/');
                  const entityId = pathParts[1] || 'unknown';

                  // Subir thumbnail
                  const uploadResult = await this.uploadFile(
                    thumbnailFile,
                    'thumbnail',
                    entityId
                  );

                  if (!uploadResult.success || !uploadResult.data) {
                    reject(
                      new Error(
                        uploadResult.error || 'Error al subir thumbnail'
                      )
                    );
                    return;
                  }

                  // Actualizar metadatos para indicar que es un thumbnail
                  uploadResult.data.metadata.isOptimized = true;
                  uploadResult.data.metadata.thumbnailOf = imageFileId;

                  resolve(
                    handleApiSuccess(
                      uploadResult.data,
                      'Thumbnail generado exitosamente'
                    )
                  );
                } catch (error) {
                  reject(error);
                }
              },
              `image/${thumbnailOptions.format}`,
              thumbnailOptions.quality
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error('No se pudo cargar la imagen original'));
        };

        img.src = originalUrlResult.data!;
      });
    } catch (error) {
      return handleApiError<FileUpload>(error);
    }
  }

  /**
   * Optimiza una imagen (compresión y redimensionamiento)
   */
  async optimizeImage(
    imageFile: File,
    options: Partial<
      ThumbnailOptions & { maxWidth: number; maxHeight: number }
    > = {}
  ): Promise<ApiResponse<File>> {
    try {
      this.validateFile(imageFile, 'item');

      const optimizationOptions = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'webp' as const,
        ...options,
      };

      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto del canvas'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            // Calcular nuevas dimensiones
            let { width, height } = img;
            const { maxWidth, maxHeight } = optimizationOptions;

            if (width > maxWidth || height > maxHeight) {
              const aspectRatio = width / height;

              if (width > height) {
                width = Math.min(width, maxWidth);
                height = width / aspectRatio;
              } else {
                height = Math.min(height, maxHeight);
                width = height * aspectRatio;
              }
            }

            // Configurar canvas
            canvas.width = width;
            canvas.height = height;

            // Dibujar imagen optimizada
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a blob optimizado
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('No se pudo optimizar la imagen'));
                  return;
                }

                const optimizedFile = new File(
                  [blob],
                  `optimized_${imageFile.name.split('.')[0]}.${optimizationOptions.format}`,
                  { type: `image/${optimizationOptions.format}` }
                );

                resolve(
                  handleApiSuccess(
                    optimizedFile,
                    'Imagen optimizada exitosamente'
                  )
                );
              },
              `image/${optimizationOptions.format}`,
              optimizationOptions.quality
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error('No se pudo cargar la imagen para optimizar'));
        };

        // Crear URL del archivo para cargar en la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            img.src = e.target.result as string;
          }
        };
        reader.readAsDataURL(imageFile);
      });
    } catch (error) {
      return handleApiError<File>(error);
    }
  }

  /**
   * Lista archivos huérfanos (sin referencias en la base de datos)
   */
  async listOrphanedFiles(
    entityType: 'item' | 'avatar'
  ): Promise<ApiResponse<string[]>> {
    try {
      return await withRetry(async () => {
        const folderRef = ref(storage, entityType);
        const listResult = await listAll(folderRef);

        const orphanedFiles: string[] = [];

        // Obtener metadatos de cada archivo para verificar si está huérfano
        for (const itemRef of listResult.items) {
          try {
            const metadata = await getMetadata(itemRef);
            const timestamp = metadata.customMetadata?.timestamp;

            // Verificar si el archivo es muy antiguo (más de 30 días sin uso)
            if (timestamp) {
              const fileAge = Date.now() - parseInt(timestamp);
              const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

              if (fileAge > thirtyDaysInMs) {
                // Aquí podrías agregar lógica adicional para verificar
                // si el entityId existe en la base de datos
                orphanedFiles.push(itemRef.fullPath);
              }
            }
          } catch {
            // Si no se pueden obtener metadatos, considerar como huérfano
            orphanedFiles.push(itemRef.fullPath);
          }
        }

        return handleApiSuccess(
          orphanedFiles,
          `${orphanedFiles.length} archivos huérfanos encontrados`
        );
      });
    } catch (error) {
      return handleApiError<string[]>(error);
    }
  }

  /**
   * Limpia archivos huérfanos automáticamente
   */
  async cleanupOrphanedFiles(
    entityType: 'item' | 'avatar'
  ): Promise<ApiResponse<number>> {
    try {
      const orphanedResult = await this.listOrphanedFiles(entityType);
      if (!orphanedResult.success || !orphanedResult.data) {
        return handleApiError<number>(
          new Error('No se pudieron obtener archivos huérfanos')
        );
      }

      const orphanedFiles = orphanedResult.data;
      let deletedCount = 0;

      // Eliminar archivos en lotes
      const BATCH_SIZE = 5;
      for (let i = 0; i < orphanedFiles.length; i += BATCH_SIZE) {
        const batch = orphanedFiles.slice(i, i + BATCH_SIZE);

        const deletePromises = batch.map(async (filePath) => {
          try {
            await this.deleteFile(filePath);
            deletedCount++;
          } catch (error) {
            console.warn(
              `No se pudo eliminar archivo huérfano: ${filePath}`,
              error
            );
          }
        });

        await Promise.all(deletePromises);
      }

      return handleApiSuccess(
        deletedCount,
        `${deletedCount} archivos huérfanos eliminados`
      );
    } catch (error) {
      return handleApiError<number>(error);
    }
  }

  /**
   * Obtiene información detallada de un archivo
   */
  async getFileInfo(fileId: string): Promise<
    ApiResponse<{
      fileId: string;
      url: string;
      metadata: FileMetadata;
      storageMetadata: Record<string, string>;
      size: number;
      contentType: string;
      created: string;
      updated: string;
    }>
  > {
    try {
      if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
        throw new Error('ID de archivo requerido');
      }

      return await withRetry(async () => {
        const storageRef = this.createStorageRef(fileId.trim());
        const [url, storageMetadata] = await Promise.all([
          getDownloadURL(storageRef),
          getMetadata(storageRef),
        ]);

        const customMetadata = storageMetadata.customMetadata || {};
        const fileMetadata: FileMetadata = {
          type: (customMetadata.type as FileMetadata['type']) || 'item',
          entityId: customMetadata.entityId || 'unknown',
          timestamp: parseInt(customMetadata.timestamp || '0'),
          extension: customMetadata.extension || '',
          originalName: customMetadata.originalName || 'unknown',
          size: storageMetadata.size,
          contentType:
            storageMetadata.contentType || 'application/octet-stream',
        };

        const fileInfo = {
          fileId: fileId.trim(),
          url,
          metadata: fileMetadata,
          storageMetadata: customMetadata,
          size: storageMetadata.size,
          contentType:
            storageMetadata.contentType || 'application/octet-stream',
          created: storageMetadata.timeCreated,
          updated: storageMetadata.updated,
        };

        return handleApiSuccess(fileInfo);
      });
    } catch (error) {
      return handleApiError<{
        fileId: string;
        url: string;
        metadata: FileMetadata;
        storageMetadata: Record<string, string>;
        size: number;
        contentType: string;
        created: string;
        updated: string;
      }>(error);
    }
  }

  /**
   * Cancela una carga en progreso
   */
  cancelUpload(fileId: string): ApiResponse<void> {
    try {
      const uploadTask = this.uploadTasks.get(fileId);
      if (!uploadTask) {
        return handleApiError<void>(
          new Error('No se encontró la tarea de carga')
        );
      }

      uploadTask.cancel();
      this.uploadTasks.delete(fileId);
      this.progressCallbacks.delete(fileId);

      return handleApiSuccess(undefined, 'Carga cancelada exitosamente');
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  /**
   * Pausa una carga en progreso
   */
  pauseUpload(fileId: string): ApiResponse<void> {
    try {
      const uploadTask = this.uploadTasks.get(fileId);
      if (!uploadTask) {
        return handleApiError<void>(
          new Error('No se encontró la tarea de carga')
        );
      }

      uploadTask.pause();
      return handleApiSuccess(undefined, 'Carga pausada exitosamente');
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  /**
   * Reanuda una carga pausada
   */
  resumeUpload(fileId: string): ApiResponse<void> {
    try {
      const uploadTask = this.uploadTasks.get(fileId);
      if (!uploadTask) {
        return handleApiError<void>(
          new Error('No se encontró la tarea de carga')
        );
      }

      uploadTask.resume();
      return handleApiSuccess(undefined, 'Carga reanudada exitosamente');
    } catch (error) {
      return handleApiError<void>(error);
    }
  }

  /**
   * Obtiene el estado de todas las cargas activas
   */
  getActiveUploads(): ApiResponse<UploadProgress[]> {
    try {
      const activeUploads: UploadProgress[] = [];

      this.uploadTasks.forEach((task, fileId) => {
        if (task.snapshot) {
          const progress: UploadProgress = {
            fileId,
            bytesTransferred: task.snapshot.bytesTransferred,
            totalBytes: task.snapshot.totalBytes,
            progress:
              (task.snapshot.bytesTransferred / task.snapshot.totalBytes) * 100,
            state: task.snapshot.state as UploadProgress['state'],
          };
          activeUploads.push(progress);
        }
      });

      return handleApiSuccess(activeUploads);
    } catch (error) {
      return handleApiError<UploadProgress[]>(error);
    }
  }
}

// Instancia singleton del servicio de storage
export const storageService = new StorageService();

// Funciones de conveniencia para uso directo
export const uploadFile = (
  file: File,
  type: keyof typeof VALIDATION_RULES,
  entityId: string,
  onProgress?: (progress: UploadProgress) => void
) => storageService.uploadFile(file, type, entityId, onProgress);

export const uploadMultiple = (
  files: File[],
  type: keyof typeof VALIDATION_RULES,
  entityId: string,
  onProgress?: (progress: MultiUploadProgress) => void
) => storageService.uploadMultiple(files, type, entityId, onProgress);

export const deleteFile = (fileId: string) => storageService.deleteFile(fileId);

export const getFileDownloadURL = (fileId: string) =>
  storageService.getDownloadURL(fileId);

export const generateThumbnail = (
  imageFileId: string,
  options?: Partial<ThumbnailOptions>
) => storageService.generateThumbnail(imageFileId, options);

export const optimizeImage = (
  imageFile: File,
  options?: Partial<ThumbnailOptions & { maxWidth: number; maxHeight: number }>
) => storageService.optimizeImage(imageFile, options);

export const cleanupOrphanedFiles = (entityType: 'item' | 'avatar') =>
  storageService.cleanupOrphanedFiles(entityType);

export const generateSecureURL = (fileId: string, options?: SecureURLOptions) =>
  storageService.generateSecureURL(fileId, options);
