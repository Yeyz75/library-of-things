import { account } from '../api/api';

export const userService = {
  async getCurrentUser() {
    return await account.get();
  },
};
