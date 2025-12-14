# @axion/nestjs-common

NestJS-specific utilities, guards, and modules for Axion Stack microservices.

This package provides **NestJS framework components** (Guards, Injectable services, Modules, Decorators) that are specific to NestJS microservices architecture.

## Key Principle

**This package contains ONLY NestJS-specific components.** For framework-agnostic utilities, use `@axion/shared` instead.

## Architecture

### Separation of Concerns

- **@axion/shared**: Pure functions, no framework dependencies
  - Use for: Helper functions, utilities that work everywhere
  - Example: `getUserIdFromMetadata()`, `handleServiceError()`

- **@axion/nestjs-common**: NestJS-specific components
  - Use for: Guards, Injectable services, Modules, Decorators
  - Example: `MicroserviceAuthGuard`, `AuthHelper`, `AuthModule`

- **@axion/contracts**: Protobuf contracts and types
  - Use for: Types, response utilities, contract validation
  - Example: `createSuccessResponse()`, `createErrorResponse()`

## Installation

This package is part of the monorepo. For external usage:

```bash
npm install @axion/nestjs-common
```

## Installation

This package is part of the monorepo. For external usage:

```bash
npm install @axion/nestjs-common
```

## Features

### Authentication

#### MicroserviceAuthGuard

Guard for protecting RabbitMQ microservice endpoints. Validates that `user_id` is present in request metadata.

```typescript
import { AuthModule, MicroserviceAuthGuard } from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";

@Module({
  imports: [AuthModule],
  controllers: [MyController],
})
export class MyModule {}

@Controller()
@UseGuards(MicroserviceAuthGuard) // Protects all endpoints
export class MyController {
  @MessagePattern("my.pattern")
  async handle(@Payload() data: { metadata: unknown }) {
    // user_id is guaranteed to be in data.metadata
  }
}
```

#### AuthHelper

Service for validating authentication in business logic:

```typescript
import { Injectable } from "@nestjs/common";
import { AuthHelper } from "@axion/nestjs-common";

@Injectable()
export class MyService {
  constructor(private readonly authHelper: AuthHelper) {}

  async doSomething(metadata: unknown) {
    const validation = this.authHelper.validateUserIdOrError(metadata);
    if (!validation.success) {
      return validation.response;
    }

    const { userId } = validation;
    // Use userId...
  }
}
```

## Architecture

For RabbitMQ microservices:

1. **API Gateway** validates the session using better-auth
2. Gateway extracts `user_id` from the validated session
3. Gateway includes `user_id` in the `metadata` field when sending messages
4. **MicroserviceAuthGuard** validates that `user_id` is present in metadata

## Exports

### Auth

- `MicroserviceAuthGuard` - Guard for protecting endpoints
- `AuthHelper` - Service for authentication validation
- `AuthModule` - NestJS module with auth providers
- `RequireAuth` - Decorator to mark endpoints requiring auth
- `AllowAnonymous` - Decorator to mark endpoints allowing anonymous access

## Dependencies

This package intentionally does NOT include:

- `better-auth-ui` - UI components are in `@axion/better-auth/ui`
- Database adapters - Use `@axion/database` directly
- HTTP-specific code - This is for microservices only

## Usage with Better Auth

Better Auth configuration should be done in your service's `app.module.ts`:

```typescript
import { createBetterAuth } from "@axion/better-auth";
import { AxionAuthModule } from "@axion/better-auth/nestjs";
import { AuthModule } from "@axion/nestjs-common";

const auth = createBetterAuth({
  database: db,
  basePath: "/api/auth",
});

@Module({
  imports: [
    AxionAuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
    AuthModule, // Use our microservice guard
    // ... other modules
  ],
})
export class AppModule {}
```

## Why Separate Package?

- **Framework-specific**: Contains NestJS decorators, guards, and injectable services
- **Separation of concerns**: UI code (better-auth-ui) should not be in microservices
- **Smaller bundles**: Microservices don't need React/UI dependencies
- **Reusability**: Common NestJS logic can be shared across all microservices
- **Type safety**: Shared types and utilities ensure consistency

## When to Use

✅ **Use @axion/nestjs-common when:**

- You need NestJS Guards (`MicroserviceAuthGuard`)
- You need Injectable services (`AuthHelper`)
- You need NestJS Modules (`AuthModule`)
- You need NestJS Decorators (`@RequireAuth`, `@AllowAnonymous`)

❌ **Don't use @axion/nestjs-common when:**

- You need pure functions (use `@axion/shared`)
- You need types or response utilities (use `@axion/contracts`)
- You're not using NestJS framework
