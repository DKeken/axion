import { createAuthClient } from "@axion/better-auth/ui";
import { config } from "@/config/env";

export const authClient = createAuthClient({
  baseURL: config.apiUrl,
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem("bearer_token", authToken);
      }
    },
    auth: {
      type: "Bearer",
      token: () => {
        if (typeof window !== "undefined") {
          return localStorage.getItem("bearer_token") || "";
        }
        return "";
      },
    },
  },
});
