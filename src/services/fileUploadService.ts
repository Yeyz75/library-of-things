import { StorageAPI } from '../api/storage';
import { BUCKET_ID } from '../api/api';

export const fileUploadService = {
  async uploadPhotos(photos?: File[]): Promise<string[]> {
    if (!photos || photos.length === 0) {
      return [];
    }

    try {
      const response = await StorageAPI.uploadMultipleFiles(BUCKET_ID, photos);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to upload photos');
      }

      return response.data.map((file) =>
        StorageAPI.getFileView(BUCKET_ID, file.$id)
      );
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw new Error('Failed to upload photos');
    }
  },

  async deletePhoto(fileId: string): Promise<void> {
    try {
      const response = await StorageAPI.deleteFile(BUCKET_ID, fileId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw new Error('Failed to delete photo');
    }
  },
};
