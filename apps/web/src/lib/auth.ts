import { cookies } from "next/headers";

/**
 * Gets the API request configuration with authentication token from cookies
 * Can be used in server components to make authenticated API calls
 */
export async function getRequestConfig() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  return token ? { auth: token.value } : {};
}
