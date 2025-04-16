import { create } from "zustand";

export type UserProfile = {
  username: string;
  email: string;
  avatar?: string;
};

type UserStore = {
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateUser: (update: Partial<UserProfile>) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (update) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...update } : null,
    })),
  clearUser: () => set({ user: null }),
}));
