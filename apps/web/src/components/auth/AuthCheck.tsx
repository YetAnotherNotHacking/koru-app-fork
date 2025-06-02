"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/auth.store";

export default function AuthCheck({
  redirectTo = "/auth",
  invert = false,
  children,
}: {
  redirectTo?: string;
  invert?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loggedIn, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && loggedIn === invert) {
      router.replace(redirectTo);
      return;
    }
  }, [loggedIn, router, _hasHydrated, redirectTo, invert]);

  if (!_hasHydrated) {
    return null;
  }

  if (loggedIn === invert) {
    return null;
  }

  return <>{children}</>;
}
