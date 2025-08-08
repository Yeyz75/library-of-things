import { databases, COLLECTIONS, DATABASE_ID } from '../lib/appwrite';

export const itemService = {
  async getAllItems() {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.ITEMS);
  },
};
