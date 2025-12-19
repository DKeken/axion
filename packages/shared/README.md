# @axion/shared

Framework-agnostic shared utilities and helpers for Axion Stack.

This package contains **pure functions and utilities** that can be used across the entire stack, including:

- NestJS microservices
- Next.js applications
- CLI tools
- Scripts
- Any other TypeScript/JavaScript code

## Key Principle

**This package has NO framework dependencies.** It only depends on:

- `@axion/contracts` - for types and contract utilities
- `@nestjs/microservices` - as peer dependency (for types only, not runtime)

## Installation

This package is part of the monorepo. For external usage:

```bash
npm install @axion/shared
```

## Features

### Helpers

#### Error Handling

Unified error handling system - minimal, reusable, automatic classification.

```typescript
import { handleServiceError } from "@axion/shared";

try {
  // Your operation
  const result = await repository.create(data);
  return createSuccessResponse(result);
} catch (error) {
  return handleServiceError(this.logger, "creating resource", error);
}
```

With context for better logging:

```typescript
catch (error) {
  return handleServiceError(this.logger, "getting project", error, {
    resourceType: "Project",
    resourceId: id,
    userId: context.userId,
  });
}
```

**Features:**

- ✅ Automatic error classification (Database, Validation, NotFound, etc.)
- ✅ Appropriate log levels (warn for validation, error for internal)
- ✅ Converts to Protobuf-compatible format
- ✅ Handles PostgreSQL/Drizzle errors automatically

See [errors/README.md](./src/errors/README.md) for detailed documentation.

#### Access Control

```typescript
import { verifyResourceAccess } from "@axion/shared";

const access = await verifyResourceAccess(
  {
    findById: (id) => repository.findById(id),
    getOwnerId: (resource) => resource.userId,
    resourceName: "Resource",
  },
  resourceId,
  metadata
);

if (!access.success) {
  return access.response;
}
```

#### Metadata

```typescript
import {
  getUserIdFromMetadata,
  getProjectIdFromMetadata,
  createRequestMetadata,
} from "@axion/shared";

const userId = getUserIdFromMetadata(metadata);
const projectId = getProjectIdFromMetadata(metadata);
const newMetadata = createRequestMetadata(userId, projectId);
```

#### Kafka Headers

Standardized Kafka headers for request tracing and context:

```typescript
import {
  createKafkaHeaders,
  extractMetadataFromHeaders,
  getCorrelationIdFromHeaders,
} from "@axion/shared";

// Create headers from RequestMetadata
const headers = createKafkaHeaders(metadata);

// Extract metadata from Kafka message headers
const metadata = extractMetadataFromHeaders(kafkaMessage.headers);

// Get correlationId for logging
const correlationId = getCorrelationIdFromHeaders(headers);
```

See [Kafka Headers Documentation](../../docs/KAFKA_HEADERS.mdx) for detailed usage.

#### Kafka DLQ

Dead Letter Queue utilities for handling failed messages:

```typescript
import {
  createDLQEventEnvelope,
  getDLQTopicName,
  prepareDLQReplay,
  shouldSendToDLQ,
} from "@axion/shared";

// Create DLQ envelope
const envelope = createDLQEventEnvelope(
  "original-topic",
  "key",
  headers,
  payload,
  error,
  3,
  "graph-service"
);

// Get DLQ topic name
const dlqTopic = getDLQTopicName("graph-service", false); // "graph-service-dlq"

// Prepare replay
const replay = prepareDLQReplay(envelope, {
  resetAttempt: true,
});
```

See [Kafka DLQ Documentation](../../docs/KAFKA_DLQ.mdx) for detailed usage.

#### Status

```typescript
import { mapServiceStatus } from "@axion/shared";
// Status mapping utilities
```

#### Kafka Helpers

```typescript
import {
  createKafkaServerOptions,
  createKafkaClientOptions,
} from "@axion/shared";

// Create Kafka server options
const serverOptions = createKafkaServerOptions(
  GRAPH_SERVICE_NAME,
  "localhost:9092"
);

// Create Kafka client options
const clientOptions = createKafkaClientOptions(
  GRAPH_SERVICE_NAME,
  "localhost:9092"
);
```

### Utils

#### Response

**Note:** Response utilities are in `@axion/contracts` to avoid circular dependencies. Always use `@axion/contracts` for response utilities.

```typescript
import { createSuccessResponse, createErrorResponse } from "@axion/contracts";
// Response utilities are in contracts, not shared
```

#### Health

```typescript
import { checkHealth } from "@axion/shared/utils";
// Health check utilities
```

#### Pagination

```typescript
import { paginate } from "@axion/shared/utils";
// Pagination utilities
```

## Architecture

### Separation from @axion/nestjs-common

- **@axion/shared**: Pure functions, no framework dependencies
- **@axion/nestjs-common**: NestJS-specific components (Guards, Injectable services, Modules)

### Usage Pattern

```typescript
// ✅ CORRECT - Use shared for pure functions
import { getUserIdFromMetadata, handleServiceError } from "@axion/shared";

// ✅ CORRECT - Use contracts for response utilities
import { createSuccessResponse, createErrorResponse } from "@axion/contracts";

// ✅ CORRECT - Use nestjs-common for NestJS components
import { MicroserviceAuthGuard, AuthHelper } from "@axion/nestjs-common";
```

## Exports

### Main Export

```typescript
import { getUserIdFromMetadata, handleServiceError } from "@axion/shared";
```

### Subpath Exports

```typescript
// Helpers only
import { getUserIdFromMetadata } from "@axion/shared/helpers";

// Utils only
import { checkHealth } from "@axion/shared/utils";
```

## Dependencies

- `@axion/contracts` - Types and contract utilities
- `@nestjs/microservices` - Peer dependency (types only)

## When to Use

✅ **Use @axion/shared when:**

- You need pure functions without framework dependencies
- Working in non-NestJS contexts (CLI, scripts, Next.js)
- Need helper functions that work everywhere

❌ **Don't use @axion/shared when:**

- You need NestJS-specific components (use `@axion/nestjs-common`)
- You need Protobuf types (use `@axion/contracts`)
- You need response utilities (prefer `@axion/contracts`)
