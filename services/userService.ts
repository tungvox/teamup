import { User } from '../types';
import { getUserProfile as getProfileFromSupabase, getUserByUserId as getUserByUserIdFromSupabase } from './supabaseService';

export const userService = {
  async getUser(userId: string): Promise<User | null> {
    return await getProfileFromSupabase(userId);
  },

  async getUserProfile(clerkId: string): Promise<User | null> {
    return await getProfileFromSupabase(clerkId);
  },

  async getUserByUserId(userId: string): Promise<User | null> {
    return await getUserByUserIdFromSupabase(userId);
  },

  async getUsers(userIds: string[]): Promise<User[]> {
    const users = await Promise.all(
      userIds.map(id => getProfileFromSupabase(id))
    );
    return users.filter((u): u is User => u !== null);
  },
};

