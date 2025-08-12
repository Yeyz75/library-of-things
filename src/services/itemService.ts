import { databases, COLLECTIONS, DATABASE_ID } from '../api/api';

export const itemService = {
  async getAllItems() {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.ITEMS);
  },
};
