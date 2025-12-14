# Contract-specific Helpers

Этот пакет содержит helpers, специфичные для работы с Protobuf контрактами.

**Важно:** Базовые утилиты (error handling, metadata, access control) находятся в `@axion/shared`.

## Доступные Helpers

### `rabbitmq.ts`

Утилиты для работы с RabbitMQ (специфичны для NestJS Microservices):

```typescript
import {
  createRabbitMQClientOptions,
  createRabbitMQServerOptions,
} from "@axion/contracts";

// Server options для NestJS microservice
app.connectMicroservice(
  createRabbitMQServerOptions(GRAPH_SERVICE_NAME, process.env.RABBITMQ_URL!)
);

// Client options для вызова других сервисов
const client = app.connectMicroservice(
  createRabbitMQClientOptions(SERVICE_NAME, process.env.RABBITMQ_URL!)
);
```

## Использование базовых утилит

Для базовых утилит используйте `@axion/shared`:

```typescript
// ✅ Правильно - используй shared для базовых утилит
import { handleServiceError } from "@axion/shared";
import { verifyResourceAccess } from "@axion/shared";
import { getUserIdFromMetadata } from "@axion/shared";

// ✅ Правильно - используй contracts для response utilities
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationError,
} from "@axion/contracts";
```

## Принцип разделения

- **@axion/shared** - базовые pure функции (error handling, metadata, access control, etc.)
- **@axion/contracts** - специфичные для Protobuf контрактов утилиты (response creation, RabbitMQ для NestJS)
- **@axion/nestjs-common** - NestJS-specific компоненты (Guards, Modules, etc.)
