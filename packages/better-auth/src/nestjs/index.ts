/**
 * NestJS integration for Better Auth
 */

export { AxionAuthModule } from "./auth.module";
// Re-export only what's available from @thallesp/nestjs-better-auth
export {
  AuthGuard,
  Session,
  AuthService,
  type UserSession,
  type AuthHookContext,
  Hook,
  BeforeHook,
  AfterHook,
} from "@thallesp/nestjs-better-auth";

// Note: AllowAnonymous, OptionalAuth, Roles might not be exported
// If needed, check @thallesp/nestjs-better-auth documentation




