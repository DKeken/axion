import { createAuthClient, bearerClient } from "@axion/better-auth/ui";
import { config } from "@/config/env";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: config.apiUrl,
    plugins: [bearerClient()],
  }
);
