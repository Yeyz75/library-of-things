import { databases, COLLECTIONS, DATABASE_ID } from '../api/api';

export const reservationService = {
  async getAllReservations() {
    return await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESERVATIONS);
  },
};
