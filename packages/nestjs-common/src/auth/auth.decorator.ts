import { SetMetadata } from "@nestjs/common";

/**
 * Decorator to mark endpoints that require authentication
 * Usage: @RequireAuth()
 */
export const REQUIRE_AUTH_KEY = "requireAuth";
export const RequireAuth = () => SetMetadata(REQUIRE_AUTH_KEY, true);

/**
 * Decorator to mark endpoints that allow anonymous access
 * Usage: @AllowAnonymous()
 */
export const ALLOW_ANONYMOUS_KEY = "allowAnonymous";
export const AllowAnonymous = () => SetMetadata(ALLOW_ANONYMOUS_KEY, true);

