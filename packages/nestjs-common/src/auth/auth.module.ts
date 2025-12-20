import { Module } from "@nestjs/common";

import { AuthHelper } from "./auth-helper";
import { MicroserviceAuthGuard } from "./microservice-auth.guard";

/**
 * Auth Module for NestJS microservices
 * Provides authentication guards and helpers that use auth-service via Kafka
 *
 * Guards automatically use AUTH_SERVICE_NAME Kafka client (injected via @Inject)
 * Bootstrap automatically registers AUTH_SERVICE_NAME client for all services
 *
 * Usage:
 * ```typescript
 * import { AuthModule } from "@axion/nestjs-common";
 *
 * @Module({
 *   imports: [AuthModule],
 *   controllers: [MyController],
 * })
 * export class MyModule {}
 * ```
 */
@Module({
  providers: [MicroserviceAuthGuard, AuthHelper],
  exports: [MicroserviceAuthGuard, AuthHelper],
})
export class AuthModule {}
