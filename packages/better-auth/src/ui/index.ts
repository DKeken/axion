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

/**
 * Note: For useSession, useSignIn, useSignUp, useSignOut hooks,
 * import directly from "better-auth/react":
 *
 * import { useSession, useSignIn, useSignUp, useSignOut } from "better-auth/react";
 */
