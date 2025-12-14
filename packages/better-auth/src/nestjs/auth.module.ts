import { Module, type DynamicModule } from "@nestjs/common";
import { AuthModule as NestJSBetterAuthModule } from "@thallesp/nestjs-better-auth";
import type { betterAuth } from "better-auth";

/**
 * Better Auth module configuration
 */
export interface AxionAuthModuleOptions {
  /**
   * Better Auth instance (returned from betterAuth())
   */
  auth: ReturnType<typeof betterAuth>;
  /**
   * Disable trusted origins CORS (default: false)
   */
  disableTrustedOriginsCors?: boolean;
  /**
   * Disable body parser (default: false)
   */
  disableBodyParser?: boolean;
  /**
   * Disable global auth guard (default: false)
   */
  disableGlobalAuthGuard?: boolean;
}

/**
 * Axion Better Auth Module
 * Wrapper around @thallesp/nestjs-better-auth with Axion-specific defaults
 */
@Module({})
export class AxionAuthModule {
  static forRoot(options: AxionAuthModuleOptions): DynamicModule {
    const nestjsOptions: {
      disableTrustedOriginsCors?: boolean;
      disableBodyParser?: boolean;
      disableGlobalAuthGuard?: boolean;
    } = {};

    if (options.disableTrustedOriginsCors !== undefined) {
      nestjsOptions.disableTrustedOriginsCors =
        options.disableTrustedOriginsCors;
    }
    if (options.disableBodyParser !== undefined) {
      nestjsOptions.disableBodyParser = options.disableBodyParser;
    }
    if (options.disableGlobalAuthGuard !== undefined) {
      nestjsOptions.disableGlobalAuthGuard = options.disableGlobalAuthGuard;
    }

    // forRoot expects: forRoot(auth, options?)
    return {
      module: AxionAuthModule,
      imports: [NestJSBetterAuthModule.forRoot(options.auth, nestjsOptions)],
      exports: [NestJSBetterAuthModule],
    };
  }
}
