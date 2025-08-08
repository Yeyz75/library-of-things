import { account } from '../lib/appwrite';

export const userService = {
  async getCurrentUser() {
    return await account.get();
  },
};
