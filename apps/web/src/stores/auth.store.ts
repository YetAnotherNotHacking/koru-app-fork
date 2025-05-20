import apiClient from "@/clients/api";
import { logout } from "api-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  token: string | null;
  updateToken: (token: string) => void;
  logOut: () => void;
  _hasHydrated: boolean;
  _setHasHydrated: (state: boolean) => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      updateToken: (token: string) => set({ token }),
      logOut: async () => {
        await logout();
        set({ token: null });
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

if (typeof window !== "undefined") {
  // Initialize client with potentially persisted token
  apiClient.setConfig({
    auth: useAuthStore.getState().token ?? undefined,
  });

  // Subscribe to token changes to keep client config updated
  useAuthStore.subscribe((state, prevState) => {
    if (state.token !== prevState.token) {
      apiClient.setConfig({
        auth: state.token ?? undefined,
      });
    }
  });
}

export default useAuthStore;
