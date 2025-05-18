import apiClient from "@/clients/api";
import { logout } from "api-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  token: string | null;
  updateToken: (token: string) => void;
  logOut: () => void;
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
    }),
    {
      name: "auth-storage",
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
