import * as SecureStore from "expo-secure-store";
import useAuthStore from "@/stores/auth.store";
import { refreshToken } from "api-client";
import { client } from "api-client/client";
import parseCookie from "set-cookie-parser";
async function refreshAccessToken() {
  const { response } = await refreshToken({});

  if (response.status === 200) {
    const cookieHeader = response.headers.get("set-cookie") ?? "";

    const cookies = parseCookie(cookieHeader, { map: true });

    let accessTokenExpiration = cookies.access_token_expiration.value;

    // getSetCookie isn't available in react native, and headers.get returns additional cookies like this on Android (possibly iOS too)
    if ("secure, access_token_expiration" in cookies.access_token) {
      accessTokenExpiration = cookies.access_token[
        "secure, access_token_expiration"
      ] as string;
    }

    if (cookies.access_token && accessTokenExpiration) {
      useAuthStore
        .getState()
        .setAccessToken(
          cookies.access_token.value,
          Number(accessTokenExpiration)
        );
    }
  }
}

client.interceptors.request.use(async (request) => {
  // Refresh access token if it's about to expire

  const expiresAt = useAuthStore.getState().expiresAt;

  if (expiresAt && expiresAt * 1000 < Date.now()) {
    try {
      await refreshAccessToken();
    } catch (error) {
      console.error(error);
    }
  }

  // Add cookies to request

  const path = new URL(request.url).pathname;

  const cookies: Record<string, string> = {};

  // Add refresh token to request if it's a refresh request
  if (path === "/api/auth/refresh") {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    if (refreshToken) {
      cookies.refresh_token = refreshToken;
    }
  }

  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) return request;

  cookies.access_token = accessToken;

  let cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  const existingCookieString = request.headers.get("Cookie");

  if (existingCookieString) {
    cookieString = `${existingCookieString}; ${cookieString}`;
  }

  request.headers.set("Cookie", cookieString);

  return request;
});

client.interceptors.response.use(async (response) => {
  const path = new URL(response.url).pathname;

  if (
    response.status === 401 &&
    useAuthStore.getState().accessToken &&
    path !== "/api/auth/refresh"
  ) {
    try {
      await refreshAccessToken();
    } catch (error) {
      console.error(error);
      useAuthStore.getState().logout();
    }
  }

  return response;
});

const apiClient = client;

export default apiClient;
