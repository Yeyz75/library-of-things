import { AuthAPI } from '../api/auth';

export const userService = {
  async getCurrentUser() {
    const response = await AuthAPI.getCurrentUser();
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get current user');
  },
};
