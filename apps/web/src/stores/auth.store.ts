import { create } from "zustand";
import { persist } from "zustand/middleware";
import { client } from "api-client/client";

interface AuthStore {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token: string) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);

console.log(useAuthStore.getState().token);

// Initialize client with potentially persisted token
client.setConfig({
  auth: useAuthStore.getState().token ?? undefined,
});

// Subscribe to token changes to keep client config updated
useAuthStore.subscribe((state, prevState) => {
  if (state.token !== prevState.token) {
    client.setConfig({
      auth: state.token ?? undefined,
    });
  }
});

export default useAuthStore;
