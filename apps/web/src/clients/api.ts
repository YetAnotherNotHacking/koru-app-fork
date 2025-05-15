import useAuthStore from "@/stores/auth.store";
import { refreshToken } from "api-client";
import { client } from "api-client/client";

if (typeof window !== "undefined") {
  // TODO: Refresh at request when near expiry instead of refreshing after the fact
  client.interceptors.response.use(async (response) => {
    if (response.status === 401 && useAuthStore.getState().token) {
      const { data, error } = await refreshToken({});

      if (data && !error) {
        useAuthStore.getState().updateToken(data.access_token);
      } else {
        useAuthStore.getState().clearToken();
      }
    }

    return response;
  });
}

const apiClient = client;

export default apiClient;
