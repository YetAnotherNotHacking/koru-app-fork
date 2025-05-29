"use client";
import { useEffect } from "react";
import useAuthStore from "@/stores/auth.store";

export default function SetLoginState({ expiration }: { expiration: number }) {
  const { login } = useAuthStore();

  useEffect(() => {
    if (expiration * 1000 >= Date.now()) {
      login();
    }
  }, [expiration, login]);

  return null;
}
