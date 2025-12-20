import { createFrontendApi } from "@axion/frontend-api";
import { config } from "@/config/env";
import { authClient } from "@/lib/auth-client";

const frontendApi = createFrontendApi({
  baseUrl: config.apiUrl,
  getAuthToken: async () => {
    const result = await authClient.getSession();
    
    if ("data" in result) {
      return result.data?.session?.token ?? null;
    }

    return null;
  },
});

export { frontendApi };
