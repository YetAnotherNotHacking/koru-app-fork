import SecureStore from "expo-secure-store";
import useAuthStore from "@/stores/auth.store";
import cookie from "cookie";
import { refreshToken } from "api-client";
import { client } from "api-client/client";

async function refreshAccessToken() {
  const { response } = await refreshToken({});

  if (response.status === 200) {
    const cookies = cookie.parse(response.headers.get("Set-Cookie") || "");

    if (cookies.access_token && cookies.access_token_expiration) {
      useAuthStore
        .getState()
        .setAccessToken(
          cookies.access_token,
          Number(cookies.access_token_expiration)
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
