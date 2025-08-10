import { Client, Account, Databases, Storage, Query, ID } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const COLLECTIONS = {
  USERS: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
  ITEMS: import.meta.env.VITE_APPWRITE_ITEMS_COLLECTION_ID,
  RESERVATIONS: import.meta.env.VITE_APPWRITE_RESERVATIONS_COLLECTION_ID,
  REVIEWS: import.meta.env.VITE_APPWRITE_REVIEWS_COLLECTION_ID,
  USER_STATS: import.meta.env.VITE_APPWRITE_USER_STATS_COLLECTION_ID,
} as const;

// Storage Bucket ID
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

// Helper function to generate file metadata
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

// Additional helper functions for complete storage management
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

export { ID, Query };
export default client;
