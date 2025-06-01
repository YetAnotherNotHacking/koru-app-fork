"use client";
import { useEffect } from "react";
import useAuthStore from "@/stores/auth.store";
import { useRouter } from "next/navigation";

export default function SetLoginState({ expiration }: { expiration: number }) {
  const { login } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (expiration * 1000 >= Date.now()) {
      login();
    }

    router.push("/");
  }, [expiration, login, router]);

  return null;
}
