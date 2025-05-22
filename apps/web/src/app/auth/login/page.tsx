import SetToken from "@/components/auth/SetToken";
import { cookies } from "next/headers";
import React from "react";

export default async function LoginRedirectPage() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("access_token");

  return <SetToken token={accessToken?.value} />;
}
