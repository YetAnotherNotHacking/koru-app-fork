import { logout } from "api-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  loggedIn: boolean;
  login: () => void;
  logout: () => void;
  _hasHydrated: boolean;
  _setHasHydrated: (state: boolean) => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      loggedIn: false,
      login: () => set({ loggedIn: true }),
      logout: async () => {
        await logout();
        set({ loggedIn: false });
      },
      _hasHydrated: false,
      _setHasHydrated: (state: boolean) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: (state) => {
        return () => state._setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
