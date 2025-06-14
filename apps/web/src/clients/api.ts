import useAuthStore from "@/stores/auth.store";
import { refreshToken } from "api-client";
import { client } from "api-client/client";
import Cookies from "js-cookie";

if (typeof window !== "undefined") {
  client.interceptors.request.use(async (request) => {
    const expirationCookie = Cookies.get("access_token_expiration");

    const path = new URL(request.url).pathname;

    if (path === "/api/auth/refresh") return request;

    if (!expirationCookie) {
      await refreshToken({});
      return request;
    }

    const expiration = parseInt(expirationCookie) * 1000;

    if (expiration > Date.now()) {
      return request;
    }

    await refreshToken({});

    return request;
  });

  client.interceptors.response.use(async (response) => {
    const path = new URL(response.url).pathname;

    if (
      (response.status === 401 || response.status === 422) &&
      useAuthStore.getState().loggedIn &&
      path !== "/api/auth/refresh"
    ) {
      const { error } = await refreshToken({});

      if (error) {
        useAuthStore.getState().logout();
      }
    }

    return response;
  });
}

const apiClient = client;

export default apiClient;
