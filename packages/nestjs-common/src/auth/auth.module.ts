import { Module, type DynamicModule } from "@nestjs/common";
import type { betterAuth } from "better-auth";
import {
  createBetterAuth,
  type BetterAuthConfigOptions,
} from "@axion/better-auth";

import { AuthHelper } from "./auth-helper";
import { MicroserviceAuthGuard } from "./microservice-auth.guard";

/**
 * Auth Module options
 */
export interface AuthModuleOptions {
  /**
   * Better Auth instance (returned from betterAuth())
   * Required for session validation in microservices
   */
  auth: ReturnType<typeof betterAuth>;
}

/**
 * Auth Module async options
 */
export interface AuthModuleAsyncOptions {
  /**
   * Factory function that returns Better Auth config options
   */
  useFactory: () => BetterAuthConfigOptions | Promise<BetterAuthConfigOptions>;
}

/**
 * Auth Module for NestJS microservices
 * Provides authentication guards and helpers for Kafka microservices
 * with Better Auth session validation
 *
 * Usage (synchronous):
 * ```typescript
 * import { createBetterAuth } from "@axion/better-auth";
 * import { AuthModule } from "@axion/nestjs-common";
 *
 * const auth = createBetterAuth({ database: db });
 *
 * @Module({
 *   imports: [AuthModule.forRoot({ auth })],
 *   controllers: [MyController],
 * })
 * export class MyModule {}
 * ```
 *
 * Usage (asynchronous):
 * ```typescript
 * import { AuthModule } from "@axion/nestjs-common";
 * import { db } from "./database";
 *
 * @Module({
 *   imports: [
 *     AuthModule.forRootAsync({
 *       useFactory: () => ({
 *         database: db,
 *         basePath: "/api/auth",
 *         trustedOrigins: ["http://localhost:3000"],
 *       }),
 *     }),
 *   ],
 * })
 * export class MyModule {}
 * ```
 */
@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true, // Make module global so it's available in all modules
      providers: [
        {
          provide: "BETTER_AUTH",
          useValue: options.auth,
        },
        MicroserviceAuthGuard,
        AuthHelper,
      ],
      exports: [
        "BETTER_AUTH", // Export BETTER_AUTH so it's available in modules that use MicroserviceAuthGuard
        MicroserviceAuthGuard,
        AuthHelper,
      ],
    };
  }

  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      providers: [
        {
          provide: "BETTER_AUTH",
          useFactory: async () => {
            const config = await options.useFactory();
            return createBetterAuth(config);
          },
        },
        MicroserviceAuthGuard,
        AuthHelper,
      ],
      exports: ["BETTER_AUTH", MicroserviceAuthGuard, AuthHelper],
    };
  }
}
