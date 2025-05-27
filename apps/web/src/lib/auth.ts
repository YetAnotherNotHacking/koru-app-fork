import { refreshToken } from "api-client";
import { cookies } from "next/headers";
import { parse } from "cookie";

async function refreshExpiredToken(token: string) {
  const { response } = await refreshToken({
    headers: { Cookie: `refresh_token=${token}` },
  });

  const cookies = parse(response.headers.get("set-cookie") ?? "");

  return cookies.access_token;
}

/**
 * Gets the API request configuration with authentication token from cookies
 * Can be used in server components to make authenticated API calls
 */
export async function getRequestConfig() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("access_token");
  const expirationCookie = cookieStore.get("access_token_expiration");
  const refreshTokenCookie = cookieStore.get("refresh_token");

  let token: string | undefined = tokenCookie?.value;
  const refreshToken: string | undefined = refreshTokenCookie?.value;

  if (!token && !refreshToken) return {};

  if (!token && refreshToken) {
    token = await refreshExpiredToken(refreshToken);
  }

  const expiration = parseInt(expirationCookie?.value ?? "0") * 1000;

  if (expiration < Date.now() && refreshToken) {
    token = await refreshExpiredToken(refreshToken);
  }

  return { headers: { Cookie: `access_token=${token}` } };
}
