/**
 * Authentication module for NestJS microservices
 */

export { MicroserviceAuthGuard } from "./microservice-auth.guard";
export { AuthHelper } from "./auth-helper";
export { createAuthDatabaseConnection } from "./auth-database.helper";
export { AuthModule } from "./auth.module";
export {
  RequireAuth,
  AllowAnonymous,
  REQUIRE_AUTH_KEY,
  ALLOW_ANONYMOUS_KEY,
} from "./auth.decorator";
