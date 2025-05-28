import { logout } from "api-client";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SecureStore from "expo-secure-store";

interface AuthStore {
  accessToken: string | null;
  expiresAt: number | null;
  setAccessToken: (accessToken: string, expiresAt: number) => void;
  logout: () => void;
  _hasHydrated: boolean;
}

const hydrate = async () => {
  const accessToken = await SecureStore.getItemAsync("accessToken");
  const expiresAtValue = await AsyncStorage.getItem("expiresAt");

  const expiresAt = expiresAtValue ? parseInt(expiresAtValue) : null;

  return { accessToken, expiresAt };
};

const useAuthStore = create<AuthStore>()((set) => ({
  accessToken: null,
  expiresAt: null,
  setAccessToken: async (accessToken: string, expiresAt: number) => {
    set({ accessToken, expiresAt });
    await SecureStore.setItemAsync("accessToken", accessToken);
    await AsyncStorage.setItem("expiresAt", expiresAt.toString());
  },
  logout: async () => {
    await logout();
    set({ accessToken: null, expiresAt: null });
    await SecureStore.deleteItemAsync("accessToken");
    await AsyncStorage.removeItem("expiresAt");
  },
  _hasHydrated: false,
}));

hydrate()
  .then(({ accessToken, expiresAt }) => {
    useAuthStore.setState({ accessToken, expiresAt, _hasHydrated: true });
  })
  .catch((error) => {
    console.error(error);
    useAuthStore.setState({ _hasHydrated: true });
  });

export default useAuthStore;
