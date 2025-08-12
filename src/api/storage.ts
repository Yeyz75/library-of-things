import {
  storage,
  handleApiError,
  handleApiSuccess,
  type ApiResponse,
} from './api';
import { ID, ImageGravity, ImageFormat } from 'appwrite';

export interface FileUploadOptions {
  bucketId: string;
  file: File;
  fileId?: string;
  permissions?: string[];
  onProgress?: (progress: number) => void;
}

export interface FileInfo {
  $id: string;
  bucketId: string;
  name: string;
  signature: string;
  mimeType: string;
  sizeOriginal: number;
  chunksTotal: number;
  chunksUploaded: number;
  $createdAt: string;
  $updatedAt: string;
}

export class StorageAPI {
  // Subir archivo
  static async uploadFile(
    options: FileUploadOptions
  ): Promise<ApiResponse<FileInfo>> {
    try {
      const { bucketId, file, fileId, permissions } = options;

      const uploadedFile = await storage.createFile(
        bucketId,
        fileId || ID.unique(),
        file,
        permissions
      );

      return handleApiSuccess(
        uploadedFile as FileInfo,
        'Archivo subido exitosamente'
      );
    } catch (error) {
      return handleApiError(error) as ApiResponse<FileInfo>;
    }
  }

  // Obtener información del archivo
  static async getFile(
    bucketId: string,
    fileId: string
  ): Promise<ApiResponse<FileInfo>> {
    try {
      const file = await storage.getFile(bucketId, fileId);
      return handleApiSuccess(file as FileInfo);
    } catch (error) {
      return handleApiError(error) as ApiResponse<FileInfo>;
    }
  }

  // Listar archivos
  static async listFiles(
    bucketId: string,
    queries?: string[]
  ): Promise<ApiResponse<{ files: FileInfo[]; total: number }>> {
    try {
      const response = await storage.listFiles(bucketId, queries);

      return handleApiSuccess({
        files: response.files as FileInfo[],
        total: response.total,
      });
    } catch (error) {
      return handleApiError(error) as ApiResponse<{
        files: FileInfo[];
        total: number;
      }>;
    }
  }

  // Obtener URL de vista previa del archivo
  static getFilePreview(
    bucketId: string,
    fileId: string,
    width?: number,
    height?: number,
    gravity?: ImageGravity,
    quality?: number,
    borderWidth?: number,
    borderColor?: string,
    borderRadius?: number,
    opacity?: number,
    rotation?: number,
    background?: string,
    output?: ImageFormat
  ): string {
    return storage
      .getFilePreview(
        bucketId,
        fileId,
        width,
        height,
        gravity,
        quality,
        borderWidth,
        borderColor,
        borderRadius,
        opacity,
        rotation,
        background,
        output
      )
      .toString();
  }

  // Obtener URL de descarga del archivo
  static getFileDownload(bucketId: string, fileId: string): string {
    return storage.getFileDownload(bucketId, fileId).toString();
  }

  // Obtener URL de visualización del archivo
  static getFileView(bucketId: string, fileId: string): string {
    return storage.getFileView(bucketId, fileId).toString();
  }

  // Actualizar archivo
  static async updateFile(
    bucketId: string,
    fileId: string,
    name?: string,
    permissions?: string[]
  ): Promise<ApiResponse<FileInfo>> {
    try {
      const file = await storage.updateFile(
        bucketId,
        fileId,
        name,
        permissions
      );
      return handleApiSuccess(
        file as FileInfo,
        'Archivo actualizado exitosamente'
      );
    } catch (error) {
      return handleApiError(error) as ApiResponse<FileInfo>;
    }
  }

  // Eliminar archivo
  static async deleteFile(
    bucketId: string,
    fileId: string
  ): Promise<ApiResponse<null>> {
    try {
      await storage.deleteFile(bucketId, fileId);
      return handleApiSuccess(null, 'Archivo eliminado exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<null>;
    }
  }

  // Subir múltiples archivos
  static async uploadMultipleFiles(
    bucketId: string,
    files: File[],
    permissions?: string[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<ApiResponse<FileInfo[]>> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const result = await this.uploadFile({
          bucketId,
          file,
          permissions,
          onProgress: (progress) => onProgress?.(index, progress),
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data!;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      return handleApiSuccess(uploadedFiles, 'Archivos subidos exitosamente');
    } catch (error) {
      return handleApiError(error) as ApiResponse<FileInfo[]>;
    }
  }

  // Validar tipo de archivo
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  // Validar tamaño de archivo
  static validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  // Obtener información del archivo antes de subir
  static getFileInfo(file: File): {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  } {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  }
}
