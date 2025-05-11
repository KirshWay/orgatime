import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { STORE_NAMES } from "@/shared/lib/store";

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

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }, false, "user/setUser"),
      updateUser: (update) =>
        set(
          (state) => ({
            user: state.user ? { ...state.user, ...update } : null,
          }),
          false,
          "user/updateUser",
        ),
      clearUser: () => set({ user: null }, false, "user/clearUser"),
    }),
    { name: STORE_NAMES.USER_STORE },
  ),
);
