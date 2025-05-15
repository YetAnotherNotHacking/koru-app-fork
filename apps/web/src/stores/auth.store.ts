import apiClient from "@/clients/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

interface AuthStore {
  token: string | null;
  updateToken: (token: string) => void;
  clearToken: () => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      updateToken: (token: string) => {
        set({ token });
        Cookies.set("access_token", token, {
          secure: true,
          sameSite: "strict",
          expires: 7,
        });
      },
      clearToken: () => {
        set({ token: null });
        Cookies.remove("access_token");
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
