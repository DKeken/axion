# @axion/contracts

Protobuf contracts for Axion Control Plane services.

## Structure

```
packages/contracts/
├── proto/
│   ├── common/
│   │   ├── common.proto        # Общие типы (Error, Pagination, Metadata)
│   │   └── health.proto        # Health Check типы
│   ├── graph-service.proto     # Graph Service контракты
│   ├── codegen-service.proto   # Codegen Service контракты
│   ├── deployment-service.proto # Deployment Service контракты
│   ├── infrastructure-service.proto # Infrastructure Service контракты
│   ├── gateway-service.proto   # Gateway Service контракты
│   ├── billing-service.proto   # Billing Service контракты
│   └── runner-agent-service.proto # Runner Agent Service контракты (gRPC)
├── generated/                  # Сгенерированные TypeScript типы
│   ├── common/
│   │   └── common.pb.ts
│   ├── graph-service.pb.ts
│   ├── codegen-service.pb.ts
│   ├── deployment-service.pb.ts
│   ├── infrastructure-service.pb.ts
│   ├── gateway-service.pb.ts
│   ├── billing-service.pb.ts
│   └── runner-agent-service.pb.ts
└── package.json
```

## Usage

### Generate TypeScript types

```bash
cd packages/contracts
bun install
bun run generate
```

**How it works:**

The generation uses a wrapper script `scripts/protoc-gen-ts_proto.mjs` that:

1. Dynamically finds the `ts-proto` plugin in `node_modules`
2. Falls back to `bunx` if the plugin is not found locally
3. Properly forwards stdin/stdout to protoc

This approach avoids hardcoding paths in `node_modules` and works reliably across different environments.

### In NestJS Microservice

#### Client Configuration

```typescript
import { ClientsModule } from "@nestjs/microservices";
import {
  GRAPH_SERVICE_NAME,
  createRabbitMQClientOptions,
} from "@axion/contracts";

@Module({
  imports: [
    ClientsModule.register([
      createRabbitMQClientOptions(
        GRAPH_SERVICE_NAME,
        process.env.RABBITMQ_URL!
      ),
    ]),
  ],
})
export class AppModule {}
```

#### Server Configuration

```typescript
import { NestFactory } from "@nestjs/core";
import { createRabbitMQServerOptions } from "@axion/contracts";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice(
    createRabbitMQServerOptions("graph-service", process.env.RABBITMQ_URL!)
  );

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
```

#### Using MessagePattern Constants

```typescript
import { MessagePattern } from "@nestjs/microservices";
import { GRAPH_SERVICE_PATTERNS } from "@axion/contracts";

@Controller()
export class GraphController {
  @MessagePattern(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
  async createProject(data: CreateProjectRequest) {
    // Implementation
  }
}
```

#### Working with Request Metadata

```typescript
import {
  createRequestMetadata,
  getUserIdFromMetadata,
  getProjectIdFromMetadata
} from "@axion/contracts";

// Creating metadata
const metadata = createRequestMetadata(
  "user-123",
  "project-456",
  "request-789"
);

// Extracting from context
@MessagePattern(GRAPH_SERVICE_PATTERNS.GET_PROJECT)
async getProject(data: GetProjectRequest, context: RmqContext) {
  const metadata = context.getData().metadata;
  const userId = getUserIdFromMetadata(metadata);
  const projectId = getProjectIdFromMetadata(metadata);
  // ...
}
```

## Shared Utilities

### Access Control

Generic helper for checking user access to resources:

```typescript
import { verifyResourceAccess } from "@axion/contracts";

const access = await verifyResourceAccess(
  {
    findById: (id) => repository.findById(id),
    getOwnerId: (resource) => resource.userId,
    resourceName: "Project",
  },
  projectId,
  metadata
);

if (!access.success) return access.response;
// access.userId is available here
```

### Status Mapping

Convert database enum values to Protobuf enums:

```typescript
import { mapServiceStatus } from "@axion/contracts";

const protobufStatus = mapServiceStatus("pending");
// Returns: ServiceStatus.SERVICE_STATUS_PENDING
```

### Error Handling

Consistent error handling across microservices:

```typescript
import { handleServiceError } from "@axion/contracts";

try {
  // ... operation
} catch (error) {
  return handleServiceError(this.logger, "creating project", error);
}
```

## Contracts

### Graph Service

- CRUD операции для проектов и графов
- Версионирование графов
- Real-time синхронизация

### Codegen Service

- Генерация кода из графа
- LLM интеграция
- Валидация сгенерированного кода

### Deployment Service

- Деплой проектов
- Управление деплоями
- Статусы деплоев

## Response Utilities

Утилиты для работы с Response обертками (паттерн oneof):

```typescript
import {
  createSuccessResponse,
  createErrorResponse,
  isSuccessResponse,
  extractData,
  createError,
  createNotFoundError,
} from "@axion/contracts";

// Создание успешного ответа
const response = createSuccessResponse({ id: "123", name: "Project" });

// Создание ответа с ошибкой
const errorResponse = createErrorResponse(
  createNotFoundError("Project", "123")
);

// Проверка и извлечение данных
if (isSuccessResponse(response)) {
  const data = extractData(response);
}
```

## Pagination Utilities

Утилиты для работы с пагинацией:

```typescript
import {
  createPagination,
  createFullPagination,
  createPaginatedResult,
  calculateOffset,
  validatePaginationParams,
} from "@axion/contracts";

// Создание пагинации
const pagination = createFullPagination({ page: 1, limit: 10 }, 100);

// Вычисление offset для SQL
const offset = calculateOffset(2, 10); // Returns: 10
```
