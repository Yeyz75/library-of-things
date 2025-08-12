import { index } from '../api/reservations';

export const reservationService = {
  async getAllReservations() {
    const response = await index();
    if (response.success) {
      return {
        documents: response.data?.documents || [],
        total: response.data?.total || 0,
      };
    }
    throw new Error(response.error || 'Failed to get reservations');
  },
};
