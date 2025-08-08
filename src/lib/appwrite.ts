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

// Storage Bucket IDs
export const BUCKETS = {
  ITEM_IMAGES: 'item-images',
  USER_AVATARS: 'user-avatars',
} as const;

export { ID, Query };
export default client;
