"use client";
import useAuthStore from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SetToken({ token }: { token?: string }) {
  const authStore = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (authStore.token) {
      router.replace("/");
    }

    if (token) {
      authStore.updateToken(token);
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return null;
}
