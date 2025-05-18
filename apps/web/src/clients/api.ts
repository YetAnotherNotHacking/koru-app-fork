import useAuthStore from "@/stores/auth.store";
import { refreshToken } from "api-client";
import { client } from "api-client/client";
import { jwtDecode } from "jwt-decode";

let isRefreshing = false;

if (typeof window !== "undefined") {
  client.interceptors.request.use(async (request) => {
    const accessToken = request.headers.get("Authorization")?.split(" ")[1];

    if (!accessToken) return request;

    const decodedToken = jwtDecode(accessToken);

    if (!decodedToken.exp || decodedToken.exp > Date.now() / 1000) {
      return request;
    }

    const { data, error } = await refreshToken({});

    if (data && !error) {
      useAuthStore.getState().updateToken(data.access_token);
      request.headers.set("Authorization", `Bearer ${data.access_token}`);
    }

    return request;
  });

  client.interceptors.response.use(async (response) => {
    if (
      response.status === 401 &&
      useAuthStore.getState().token &&
      !isRefreshing
    ) {
      isRefreshing = true;
      try {
        const { data, error } = await refreshToken({});

        if (data && !error) {
          useAuthStore.getState().updateToken(data.access_token);
        } else {
          useAuthStore.getState().logOut();
        }
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  });
}

const apiClient = client;

export default apiClient;
