// stores/useUserStore.ts
import { create } from 'zustand';
import type { Database } from '@/app/types/supabase';

export type AppUser = Database['public']['Tables']['profiles']['Row'] | null;

interface UserState {
  user: AppUser;
  setUser: (user: AppUser) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
