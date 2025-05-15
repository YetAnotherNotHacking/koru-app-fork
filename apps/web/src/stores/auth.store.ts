import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  loggedIn: boolean;
  toggleLoggedIn: () => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      loggedIn: false,
      toggleLoggedIn: () => set((state) => ({ loggedIn: !state.loggedIn })),
    }),
    {
      name: "auth-storage",
    }
  )
);

export default useAuthStore;
