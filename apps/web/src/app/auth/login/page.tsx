import SetLoginState from "@/components/auth/SetLoginState";
import { cookies } from "next/headers";
import React from "react";

export default async function LoginRedirectPage() {
  const cookieStore = await cookies();

  const expiration = cookieStore.get("access_token_expiration");

  return <SetLoginState expiration={Number(expiration?.value)} />;
}
