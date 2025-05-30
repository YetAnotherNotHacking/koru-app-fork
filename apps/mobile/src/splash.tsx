import { SplashScreen } from "expo-router";
import useAuthStore from "./stores/auth.store";

export function SplashScreenController() {
  const { _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    SplashScreen.hideAsync();
  }

  return null;
}
