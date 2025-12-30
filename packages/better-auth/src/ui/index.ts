"use client";

/**
 * Better Auth UI components and utilities
 * Re-exports from better-auth-ui for convenience
 */

// Main UI components
export {
  AuthView,
  AuthForm,
  SignInForm,
  SignUpForm,
  SignOut,
  SignedIn,
  SignedOut,
  UserButton,
  UserAvatar,
  AccountView,
  OrganizationView,
  type AuthViewProps,
  type AuthFormProps,
  type SignInFormProps,
  type SignUpFormProps,
  type UserButtonProps,
  type UserAvatarProps,
  type AccountViewProps,
  type OrganizationViewProps,
} from "better-auth-ui";

// UI Provider
export {
  AuthUIProvider,
  AuthUIContext,
  type AuthUIProviderProps,
  type AuthUIContextType,
} from "better-auth-ui";

// React hooks from better-auth-ui
export { useAuthData, useAuthenticate } from "better-auth-ui";

// Auth client from better-auth
export { createAuthClient } from "better-auth/react";
import type { BetterAuthClientPlugin } from "@better-auth/core";
import type { RequestContext, SuccessContext } from "@better-fetch/fetch";

/**
 * Bearer token plugin for the client.
 * Handles set-auth-token header and Authorization: Bearer header.
 */
export const bearerClient = (): BetterAuthClientPlugin => {
  return {
    id: "bearer",
    fetchPlugins: [
      {
        id: "bearer",
        name: "Bearer",
        hooks: {
          onRequest: async (context: RequestContext) => {
            if (typeof window !== "undefined") {
              const token = localStorage.getItem("bearer_token");
              if (token) {
                context.headers.set("Authorization", `Bearer ${token}`);
              }
            }
            return context;
          },
          onSuccess: async (context: SuccessContext) => {
            const token = context.response.headers.get("set-auth-token");
            if (token && typeof window !== "undefined") {
              localStorage.setItem("bearer_token", token);
            }
            // Clear token on sign out
            const url = context.request.url.toString();
            if (url.includes("/sign-out") && typeof window !== "undefined") {
              localStorage.removeItem("bearer_token");
            }
          },
        },
      },
    ],
  };
};

/**
 * Note: For useSession, useSignIn, useSignUp, useSignOut hooks,
 * import directly from "better-auth/react":
 *
 * import { useSession, useSignIn, useSignUp, useSignOut } from "better-auth/react";
 */
