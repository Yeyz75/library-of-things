import { storage, BUCKET_ID, ID } from '../api/api';

export const fileUploadService = {
  async uploadPhotos(photos?: File[]): Promise<string[]> {
    if (!photos || photos.length === 0) {
      return [];
    }

    try {
      const uploadPromises = photos.map(async (photo) => {
        const response = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          photo
        );
        return storage.getFileView(BUCKET_ID, response.$id).toString();
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw new Error('Failed to upload photos');
    }
  },

  async deletePhoto(fileId: string): Promise<void> {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw new Error('Failed to delete photo');
    }
  },
};
