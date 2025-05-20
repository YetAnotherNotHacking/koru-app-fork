"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/stores/auth.store";

const PUBLIC_PATHS = ["/auth"];

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && pathname === "/auth" && token) {
      router.replace("/");
      return;
    }

    if (
      _hasHydrated &&
      !PUBLIC_PATHS.some((path) => pathname.startsWith(path)) &&
      !token
    ) {
      router.replace("/auth");
      return;
    }
  }, [pathname, token, router, _hasHydrated]);

  if (!_hasHydrated) {
    return null;
  }

  if (
    (pathname === "/auth" && token) ||
    (!PUBLIC_PATHS.some((path) => pathname.startsWith(path)) && !token)
  ) {
    return null;
  }

  return <>{children}</>;
}
