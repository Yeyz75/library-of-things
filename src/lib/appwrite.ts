import { Client, Account, Databases, Storage, Query, ID } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = 'main';
export const COLLECTIONS = {
  USERS: 'users',
  ITEMS: 'items',
  RESERVATIONS: 'reservations',
} as const;

// Storage Bucket ID (single bucket for free plan)
export const BUCKET_ID = 'images';

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
