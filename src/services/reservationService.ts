import { databases, COLLECTIONS, DATABASE_ID } from '../lib/appwrite';

export const reservationService = {
  async getAllReservations() {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESERVATIONS);
  },
};
