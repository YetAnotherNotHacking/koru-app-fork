import { refreshToken } from "api-client";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

async function refreshExpiredToken(token: string) {
  const { data, error } = await refreshToken({
    headers: { Cookie: `refresh_token=${token}` },
  });

  if (data && !error) {
    return data.access_token;
  }
}

/**
 * Gets the API request configuration with authentication token from cookies
 * Can be used in server components to make authenticated API calls
 */
export async function getRequestConfig() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("access_token");
  const refreshTokenCookie = cookieStore.get("refresh_token");

  let token: string | undefined = tokenCookie?.value;
  const refreshToken: string | undefined = refreshTokenCookie?.value;

  if (!token && !refreshToken) return {};

  if (!token && refreshToken) {
    token = await refreshExpiredToken(refreshToken);
  }

  if (!token) return {};

  const decodedToken = jwtDecode(token);

  if (!decodedToken.exp || decodedToken.exp < Date.now() / 1000) {
    if (!refreshTokenCookie) return {};

    token = await refreshExpiredToken(refreshTokenCookie.value);
  }

  return { auth: token };
}
