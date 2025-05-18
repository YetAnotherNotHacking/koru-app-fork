import { refreshToken } from "api-client";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

/**
 * Gets the API request configuration with authentication token from cookies
 * Can be used in server components to make authenticated API calls
 */
export async function getRequestConfig() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("access_token");

  if (!tokenCookie) return {};

  let token = tokenCookie.value;

  const decodedToken = jwtDecode(tokenCookie.value);

  if (!decodedToken.exp || decodedToken.exp < Date.now() / 1000) {
    const refreshTokenCookie = cookieStore.get("refresh_token");

    if (!refreshTokenCookie) return {};

    const { data, error } = await refreshToken({
      headers: { Cookie: `refresh_token=${refreshTokenCookie.value}` },
    });

    if (data && !error) {
      token = data.access_token;
    }
  }

  return { auth: token };
}
