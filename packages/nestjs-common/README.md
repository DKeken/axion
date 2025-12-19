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

Guard for protecting microservice message endpoints (e.g. Kafka). Validates that `user_id` is present in request metadata.

```typescript
import { AuthModule, MicroserviceAuthGuard } from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import {
  GRAPH_SERVICE_PATTERNS,
  type CreateProjectRequest,
} from "@axion/contracts";

@Module({
  imports: [AuthModule],
  controllers: [MyController],
})
export class MyModule {}

@Controller()
@UseGuards(MicroserviceAuthGuard) // Protects all endpoints
export class MyController {
  @MessagePattern(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
  async handle(@Payload() data: CreateProjectRequest) {
    // user_id is guaranteed to be in data.metadata (after guard)
    // ...delegate to service
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

For NestJS microservices (Kafka transport in Control Plane):

1. **HTTP entrypoint** (any service exposing public HTTP, or Next.js API routes) validates the session using better-auth
2. The entrypoint extracts `user_id` from the validated session
3. The entrypoint includes `user_id` (and optional session info) in the `metadata` field when sending messages
4. **MicroserviceAuthGuard** validates that `user_id` is present in metadata for MessagePattern handlers

## Exports

### Auth

- `MicroserviceAuthGuard` - Guard for protecting endpoints
- `AuthHelper` - Service for authentication validation
- `AuthModule` - NestJS module with auth providers
- `RequireAuth` - Decorator to mark endpoints requiring auth
- `AllowAnonymous` - Decorator to mark endpoints allowing anonymous access

### Swagger/OpenAPI

- `setupSwagger` - Function to setup Swagger documentation
- `SwaggerOptions` - Type for Swagger configuration

#### Usage

Swagger is automatically configured when using `bootstrapMicroservice`:

```typescript
import { bootstrapMicroservice } from "@axion/nestjs-common";
import { GRAPH_SERVICE_NAME } from "@axion/contracts";

bootstrapMicroservice(AppModule, {
  serviceName: GRAPH_SERVICE_NAME,
  defaultPort: 3001,
  swagger: {
    serviceName: "Graph Service",
    apiVersion: "v1",
    description: "Graph Service API for managing projects and graphs",
  },
});
```

Swagger UI will be available at `http://localhost:3001/api-docs`

### Kafka DLQ Interceptor

Dead Letter Queue interceptor for handling failed Kafka messages:

```typescript
import { KafkaDLQInterceptor } from "@axion/nestjs-common";
import { APP_INTERCEPTOR } from "@nestjs/core";

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: (kafkaClient: ClientKafka) =>
        new KafkaDLQInterceptor({
          serviceName: GRAPH_SERVICE_NAME,
          maxRetries: 3,
          useCommonDLQ: false,
          dlqClient: kafkaClient,
          enabled: true,
        }),
      inject: [GRAPH_SERVICE_NAME],
    },
  ],
})
export class AppModule {}
```

See [Kafka DLQ Documentation](../../docs/KAFKA_DLQ.mdx) for detailed usage.

### BullMQ

- `BullMQModule` - Module for BullMQ integration
- `createBullMQConnectionConfig` - Helper for Redis connection
- `enrichJobPayloadWithMetadata` - Add correlationId to job payload
- `BACKOFF_STRATEGIES` - Standard backoff strategies
- `JOB_OPTIONS_PRESETS` - Pre-configured job options

#### Usage

```typescript
import {
  BullMQModule,
  createBullMQConnectionConfig,
  enrichJobPayloadWithMetadata,
  JOB_OPTIONS_PRESETS,
} from "@axion/nestjs-common";

@Module({
  imports: [
    BullMQModule.forRootAsync({
      useFactory: () => ({
        connection: createBullMQConnectionConfig(env.redisUrl),
      }),
    }),
  ],
})
export class AppModule {}

// In service
const job = await queue.add(
  "job-name",
  enrichJobPayloadWithMetadata(payload, metadata),
  JOB_OPTIONS_PRESETS.standard()
);

// Queue configuration (rate limiting, stalled jobs)
import {
  createQueueOptions,
  createWorkerOptions,
  QUEUE_CONFIGS,
} from "@axion/nestjs-common";

// For Queue constructor
const queueOptions = createQueueOptions(QUEUE_CONFIGS.highVolume());
// Returns: { limiter: { max: 100, duration: 60000 } }

// For Worker constructor
const workerOptions = createWorkerOptions({
  concurrency: 3,
  lockDuration: 60000,
  maxStalledCount: 2,
});
```

### BullMQ Metrics

Queue metrics and observability:

```typescript
import {
  getQueueMetrics,
  getQueueMetricsSummary,
  getJobMetrics,
} from "@axion/nestjs-common";

// Get queue metrics
const metrics = await getQueueMetrics(queue);
// { queueName, active, waiting, delayed, completed, failed, paused, timestamp }

// Get extended metrics with calculations
const summary = await getQueueMetricsSummary(queue);
// { ...metrics, total, successRate, averageDuration }

// Get job metrics
const jobMetrics = await getJobMetrics(job);
// { jobId, name, state, duration, attempts, progress, ... }
```

See [BullMQ Metrics Documentation](../../docs/BULLMQ_METRICS.mdx) for detailed usage.

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
