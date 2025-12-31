import { createFrontendApi } from "@axion/frontend-api";
import { config } from "@/config/env";
import { authClient } from "@/lib/auth-client";

const frontendApi = createFrontendApi({
  baseUrl: config.apiUrl,
  getAuthToken: async () => {
    // 1. Try to get token from localStorage first (handled by bearerClient plugin)
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("bearer_token");
      if (storedToken) return storedToken;
    }

    // 2. Fallback to getSession
    const result = await authClient.getSession();

    return result.data?.session?.token ?? null;
  },
  getUserId: async () => {
    const result = await authClient.getSession();
    return result.data?.user?.id ?? null;
  },
});

export { frontendApi };
