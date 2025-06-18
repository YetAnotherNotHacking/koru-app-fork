import * as SecureStore from "expo-secure-store";
import useAuthStore from "@/stores/auth.store";
import { refreshToken } from "api-client";
import { client } from "api-client/client";
import parseCookie from "@/lib/cookie";

async function refreshAccessToken() {
  const { response, error } = await refreshToken({});

  if (error) {
    throw error;
  }

  if (response.status === 200) {
    const cookieHeader = response.headers.get("set-cookie") ?? "";

    const cookies = parseCookie(cookieHeader);

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

const REFRESH_WHITELIST = ["/api/auth/refresh", "/api/auth/logout"];
const INCLUDE_REFRESH_PATHS = ["/api/auth/refresh", "/api/auth/logout"];

client.interceptors.request.use(async (request) => {
  // Refresh access token if it's about to expire

  const path = new URL(request.url).pathname;

  const expiresAt = useAuthStore.getState().expiresAt;

  if (
    !REFRESH_WHITELIST.includes(path) &&
    expiresAt &&
    expiresAt * 1000 < Date.now()
  ) {
    try {
      await refreshAccessToken();
    } catch (error) {
      console.error(error);
    }
  }

  // Add cookies to request

  const cookies: Record<string, string> = {};

  // Add refresh token to request if it's a refresh or a logout request
  if (INCLUDE_REFRESH_PATHS.includes(path)) {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    if (refreshToken) {
      cookies.refresh_token = refreshToken;
    }
  }

  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    cookies.access_token = accessToken;
  }

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
    !REFRESH_WHITELIST.includes(path) &&
    (response.status === 401 || response.status === 422) &&
    useAuthStore.getState().accessToken
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

client.setConfig({ credentials: "omit" });

const apiClient = client;

export default apiClient;
