import { index } from '../api/items';

export const itemService = {
  async getAllItems() {
    const response = await index();
    if (response.success) {
      return {
        documents: response.data?.documents || [],
        total: response.data?.total || 0,
      };
    }
    throw new Error(response.error || 'Failed to get items');
  },
};
