"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/stores/auth.store";

const PUBLIC_PATHS = ["/auth"];

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loggedIn, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && pathname === "/auth" && loggedIn) {
      router.replace("/");
      return;
    }

    if (
      _hasHydrated &&
      !PUBLIC_PATHS.some((path) => pathname.startsWith(path)) &&
      !loggedIn
    ) {
      router.replace("/auth");
      return;
    }
  }, [pathname, loggedIn, router, _hasHydrated]);

  if (!_hasHydrated) {
    return null;
  }

  if (
    (pathname === "/auth" && loggedIn) ||
    (!PUBLIC_PATHS.some((path) => pathname.startsWith(path)) && !loggedIn)
  ) {
    return null;
  }

  return <>{children}</>;
}
