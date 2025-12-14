# Шаблон для создания нового микросервиса

Этот документ содержит основные моменты из `graph-service`, которые нужно использовать при создании следующего микросервиса.

## 📁 Структура проекта

```
apps/{service-name}/
├── src/
│   ├── database/
│   │   ├── schema.ts          # Drizzle schema
│   │   ├── connection.ts       # Database connection
│   │   └── index.ts
│   ├── {module}/
│   │   ├── {module}.module.ts
│   │   ├── {module}.controller.ts  # MessagePattern handlers
│   │   ├── {module}.service.ts     # Main coordinator service
│   │   ├── services/               # Specialized services
│   │   │   ├── {feature}.service.ts
│   │   ├── repositories/           # Repository pattern
│   │   │   ├── {entity}.repository.ts
│   │   ├── helpers/                # Reusable helpers
│   │   │   ├── {helper}.helper.ts
│   │   └── types/                  # Local types (если нужны)
│   │       ├── {type}.ts
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts
│   ├── app.module.ts
│   └── main.ts
├── drizzle/                    # Миграции (генерируются)
├── .env.example
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 📦 package.json

```json
{
  "name": "@axion/{service-name}",
  "version": "1.0.0",
  "description": "{Service Name} - описание сервиса",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch --env-file=.env src/main.ts",
    "start": "node dist/main.js",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "type-check": "tsc --noEmit",
    "migrate:generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "migrate:push": "drizzle-kit push"
  },
  "dependencies": {
    "@axion/better-auth": "workspace:*",
    "@axion/contracts": "workspace:*",
    "@axion/database": "workspace:*",
    "@axion/nestjs-common": "workspace:*",
    "@axion/shared": "workspace:*",
    "@nestjs/common": "catalog:",
    "@nestjs/core": "catalog:",
    "@nestjs/microservices": "catalog:",
    "@nestjs/platform-express": "catalog:",
    "amqp-connection-manager": "catalog:",
    "amqplib": "catalog:",
    "drizzle-orm": "catalog:",
    "kafkajs": "catalog:",
    "postgres": "catalog:",
    "reflect-metadata": "catalog:",
    "rxjs": "catalog:"
  },
  "devDependencies": {
    "@axion-stack/eslint-config": "workspace:*",
    "@axion-stack/typescript-config": "workspace:*",
    "@types/amqplib": "catalog:",
    "@types/node": "catalog:",
    "drizzle-kit": "catalog:",
    "tsx": "^4.19.2",
    "typescript": "catalog:"
  }
}
```

## 🔧 tsconfig.json

```json
{
  "extends": "../../packages/_configs/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"]
    },
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 🗄️ Database Connection

### `src/database/connection.ts`

```typescript
import { createDatabaseConnection } from "@axion/database";
import { Logger } from "@nestjs/common";

import * as schema from "./schema";

const logger = new Logger("DatabaseConnection");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

logger.log("Creating database connection...");
const connectionStartTime = Date.now();

// Create database connection using shared utility
const { client, db } = createDatabaseConnection(connectionString, schema);

const connectionTime = Date.now() - connectionStartTime;
logger.log(
  `Database connection created in ${connectionTime}ms (lazy connection - actual connection will be established on first query)`
);

/**
 * Get database client for health checks
 * Returns client if available, otherwise throws error
 */
export function getClient() {
  return client;
}

export { client, db };
export type Database = typeof db;
```

### `src/database/index.ts`

```typescript
export { db, client, getClient, type Database } from "./connection";
export * from "./schema";
```

## 📊 Database Schema

### `src/database/schema.ts`

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ⚠️ ВАЖНО: Enums в БД должны быть SNAKE_CASE строками, НЕ Protobuf enum значения
// Protobuf enums конвертируются в строки через type-transformers
export const statusEnum = pgEnum("status", [
  "pending", // В БД храним lowercase
  "active",
  "deleted",
]);

// Таблицы
export const {entityName}s = pgTable("{table_name}", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),

  // ⚠️ Enum поля: в БД храним как строки, конвертируем через type-transformers
  status: statusEnum("status").notNull().default("pending"),

  // ⚠️ JSONB поля: для сложных объектов из Protobuf
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  config: jsonb("config").$type<{ key: string; value: string }[]>(),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types для TypeScript
export type {EntityName} = typeof {entityName}s.$inferSelect;
export type Create{EntityName} = typeof {entityName}s.$inferInsert;
export type Update{EntityName} = Partial<
  Omit<Create{EntityName}, "id" | "createdAt"> & {
    updatedAt?: Date;
  }
>;
```

**Ключевые моменты:**

1. **Enums в БД** - храним как строки (lowercase), НЕ как Protobuf enum значения
2. **JSONB поля** - используем для сложных объектов из Protobuf
3. **Type safety** - используем `$type<>()` для типизации JSONB полей
4. **Timestamps** - всегда добавляй `createdAt` и `updatedAt`
5. **Конвертация** - используй `type-transformers` для преобразования DB → Protobuf

### `drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
```

## 🚀 Main Entry Point

### `src/main.ts`

```typescript
import { bootstrapMicroservice } from "@axion/nestjs-common";
import { {SERVICE_NAME}_CONSTANT } from "@axion/contracts";

import { AppModule } from "@/app.module";

bootstrapMicroservice(AppModule, {
  serviceName: {SERVICE_NAME}_CONSTANT,
  defaultPort: 300X, // Уникальный порт для каждого сервиса
}).catch((error) => {
  console.error("Error starting {Service Name}:", error);
  process.exit(1);
});
```

## 📦 App Module

### `src/app.module.ts`

**Вариант 1: Сервис НЕ вызывает другие сервисы (как graph-service):**

```typescript
import { {SERVICE_NAME}_CONSTANT } from "@axion/contracts";
import { AuthModule, HealthModule } from "@axion/nestjs-common";
import { Module } from "@nestjs/common";

import { db } from "@/database";
import { getClient } from "@/database/connection";
import { {Module}Module } from "@/{module}/{module}.module";

@Module({
  imports: [
    // Better Auth with optional injection for microservice authentication
    AuthModule.forRootAsync({
      useFactory: () => ({
        database: db,
        basePath: "/api/auth",
        trustedOrigins: process.env.TRUSTED_ORIGINS
          ? process.env.TRUSTED_ORIGINS.split(",")
          : [
              "http://localhost:3000",
              "http://localhost:3001",
              "http://traefik.localhost",
              "https://traefik.localhost",
            ],
      }),
    }),
    // Universal Health Module
    HealthModule.forRoot({
      serviceName: {SERVICE_NAME}_CONSTANT,
      getDatabaseClient: () =>
        getClient() as (
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) => Promise<unknown>,
    }),
    {Module}Module,
  ],
})
export class AppModule {}
```

**Вариант 2: Сервис ВЫЗЫВАЕТ другие сервисы (как codegen-service):**

```typescript
import {
  {SERVICE_NAME}_CONSTANT,
  GRAPH_SERVICE_NAME, // Пример: сервис, который вызываем
} from "@axion/contracts";
import { AuthModule, HealthModule } from "@axion/nestjs-common";
import { createKafkaClientOptions } from "@axion/shared";
import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";

import { db } from "@/database";
import { getClient } from "@/database/connection";
import { {Module}Module } from "@/{module}/{module}.module";

@Module({
  imports: [
    // ⚠️ ВАЖНО: ClientsModule ДОЛЖЕН быть ПЕРВЫМ перед другими модулями
    // Это гарантирует, что Kafka клиенты инициализируются до использования
    ClientsModule.registerAsync([
      {
        name: GRAPH_SERVICE_NAME, // Сервис, который вызываем
        useFactory: () =>
          createKafkaClientOptions(
            GRAPH_SERVICE_NAME,
            process.env.KAFKA_BROKERS || "localhost:9092"
          ),
      },
      // Можно добавить несколько клиентов:
      // {
      //   name: OTHER_SERVICE_NAME,
      //   useFactory: () => createKafkaClientOptions(OTHER_SERVICE_NAME, ...),
      // },
    ]),
    // Better Auth with optional injection for microservice authentication
    AuthModule.forRootAsync({
      useFactory: () => ({
        database: db,
        basePath: "/api/auth",
        trustedOrigins: process.env.TRUSTED_ORIGINS
          ? process.env.TRUSTED_ORIGINS.split(",")
          : [
              "http://localhost:3000",
              "http://localhost:3001",
              "http://traefik.localhost",
              "https://traefik.localhost",
            ],
      }),
    }),
    // Universal Health Module
    HealthModule.forRoot({
      serviceName: {SERVICE_NAME}_CONSTANT,
      getDatabaseClient: () =>
        getClient() as (
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) => Promise<unknown>,
    }),
    {Module}Module,
  ],
  // ⚠️ ОБЯЗАТЕЛЬНО экспортируй ClientsModule для использования в дочерних модулях
  exports: [ClientsModule],
})
export class AppModule {}
```

**Ключевые моменты для межсервисного взаимодействия:**

1. `ClientsModule.registerAsync` ДОЛЖЕН быть ПЕРВЫМ в `imports`
2. ОБЯЗАТЕЛЬНО добавь `exports: [ClientsModule]` в AppModule
3. НЕ добавляй `ClientsModule` в дочерние модули (например, в `{Module}Module`)
4. Используй `@Optional()` при инжектировании `ClientProxy` в сервисах

## 🎮 Module Structure

### `src/{module}/{module}.module.ts`

```typescript
import { Module } from "@nestjs/common";

import { {Module}Controller } from "@/{module}/{module}.controller";
import { {Module}Service } from "@/{module}/{module}.service";
import { {Entity}Repository } from "@/{module}/repositories/{entity}.repository";
import { {Feature}Service } from "@/{module}/services/{feature}.service";

@Module({
  controllers: [{Module}Controller],
  providers: [
    {Module}Service,
    {Feature}Service,
    {Entity}Repository,
  ],
})
export class {Module}Module {}
```

## 🎯 Controller

### `src/{module}/{module}.controller.ts`

```typescript
import {
  {SERVICE}_PATTERNS,
  type {Action}Request,
} from "@axion/contracts";
import {
  MessagePatternWithLog,
  MicroserviceAuthGuard,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { {Module}Service } from "@/{module}/{module}.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class {Module}Controller {
  constructor(private readonly {module}Service: {Module}Service) {}

  @MessagePatternWithLog({SERVICE}_PATTERNS.{ACTION})
  async {action}(@Payload() data: {Action}Request) {
    return this.{module}Service.{action}(data);
  }
}
```

## 🔄 Main Service (Coordinator)

### `src/{module}/{module}.service.ts`

```typescript
import {
  type {Action}Request,
} from "@axion/contracts";
import { Injectable } from "@nestjs/common";

import { {Feature}Service } from "@/{module}/services/{feature}.service";

/**
 * Main {Module}Service - координатор, делегирует вызовы специализированным сервисам
 */
@Injectable()
export class {Module}Service {
  constructor(
    private readonly {feature}Service: {Feature}Service,
  ) {}

  async {action}(data: {Action}Request) {
    return this.{feature}Service.{action}(data);
  }
}
```

## 🛠️ Specialized Service

### `src/{module}/services/{feature}.service.ts`

**Вариант 1: Сервис БЕЗ межсервисного взаимодействия:**

```typescript
import {
  create{Entity}Response,
  createList{Entity}sResponse,
  type {Action}Request,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { transform{Entity}ToContract } from "@/{module}/helpers/type-transformers";
import { verify{Entity}Access } from "@/{module}/helpers/{entity}-access.helper";
import { type {Entity}Repository } from "@/{module}/repositories/{entity}.repository";

@Injectable()
export class {Feature}Service extends BaseService {
  constructor(private readonly {entity}Repository: {Entity}Repository) {
    super({Feature}Service.name);
  }

  @CatchError({ operation: "{action} {entity}" })
  async {action}(data: {Action}Request) {
    // 1. Валидация metadata
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    // 2. Проверка доступа (если нужно)
    const access = await verify{Entity}Access(
      this.{entity}Repository,
      data.{entity}Id,
      data.metadata
    );
    if (!access.success) return access.response;

    // 3. Бизнес-логика
    const {entity} = await this.{entity}Repository.findById(data.{entity}Id);
    if (!{entity}) {
      return this.createNotFoundResponse("{Entity}", data.{entity}Id);
    }

    // 4. Возврат результата (используем type transformer)
    return create{Entity}Response(transform{Entity}ToContract({entity}));
  }
}
```

**Вариант 2: Сервис С межсервисным взаимодействием:**

```typescript
import {
  GRAPH_SERVICE_NAME,
  GRAPH_SERVICE_PATTERNS,
  create{Entity}Response,
  createErrorResponse,
  createNotFoundError,
  createValidationError,
  type {Action}Request,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, handleServiceError } from "@axion/shared";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

import { transform{Entity}ToContract } from "@/{module}/helpers/type-transformers";
import { type {Entity}Repository } from "@/{module}/repositories/{entity}.repository";

@Injectable()
export class {Feature}Service extends BaseService {
  constructor(
    private readonly {entity}Repository: {Entity}Repository,
    // ⚠️ ВАЖНО: используй @Optional() для ClientProxy
    // Это позволяет сервису стартовать даже если клиент не готов
    @Optional()
    @Inject(GRAPH_SERVICE_NAME)
    private readonly graphClient: ClientProxy | null
  ) {
    super({Feature}Service.name);
  }

  @CatchError({ operation: "{action} {entity}" })
  async {action}(data: {Action}Request) {
    // 1. Валидация metadata
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    // 2. Проверка доступности клиента
    if (!this.graphClient) {
      return createErrorResponse(
        createValidationError("Graph service client not available")
      );
    }

    // 3. Вызов другого сервиса через Kafka
    let graphResponse;
    try {
      graphResponse = await firstValueFrom(
        this.graphClient.send(GRAPH_SERVICE_PATTERNS.GET_GRAPH, {
          metadata: data.metadata,
          projectId: data.projectId,
        })
      );
    } catch (error) {
      // Kafka communication error - возвращаем internal error
      return handleServiceError(
        this.logger,
        "getting graph from graph-service",
        error
      );
    }

    // 4. Обработка ответа от другого сервиса
    if (graphResponse.error) {
      return createErrorResponse(graphResponse.error);
    }

    if (!graphResponse.graph) {
      return createErrorResponse(createNotFoundError("Graph", data.projectId));
    }

    // 5. Бизнес-логика с данными из другого сервиса
    const graph = graphResponse.graph;

    // ... обработка graph данных ...

    // 6. Возврат результата
    return create{Entity}Response(result);
  }
}
```

**Ключевые моменты для межсервисного взаимодействия:**

1. Используй `@Optional()` + `@Inject(SERVICE_NAME)` для ClientProxy
2. Проверяй `if (!this.graphClient)` перед использованием
3. Оборачивай `firstValueFrom` в `try-catch` блок
4. Используй `handleServiceError` для обработки Kafka ошибок
5. Проверяй `response.error` перед использованием данных

## 💾 Repository

### `src/{module}/repositories/{entity}.repository.ts`

```typescript
import { PAGINATION_DEFAULTS } from "@axion/contracts";
import { BaseRepository, applyPagination } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, sql } from "drizzle-orm";

import { db } from "@/database";
import {
  {entityName}s,
  type {EntityName},
  type Create{EntityName},
  type Update{EntityName},
} from "@/database/schema";

@Injectable()
export class {Entity}Repository extends BaseRepository<
  typeof {entityName}s,
  {EntityName},
  Create{EntityName},
  Update{EntityName}
> {
  constructor() {
    super(db, {entityName}s);
  }

  /**
   * Find {entity}s by user ID with pagination
   */
  async findByUserId(
    userId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT
  ): Promise<{ {entity}s: {EntityName}[]; total: number }> {
    const all{Entity}s = await this.db
      .select()
      .from(this.table)
      .where(eq({entityName}s.userId, userId))
      .orderBy(desc({entityName}s.createdAt));

    const { items, total } = applyPagination(all{Entity}s, { page, limit });
    return { {entity}s: items, total };
  }

  /**
   * Custom methods if needed
   */
  async customMethod(id: string): Promise<{EntityName} | null> {
    const [{entity}] = await this.db
      .select()
      .from(this.table)
      .where(eq({entityName}s.id, id))
      .limit(1);
    return {entity} || null;
  }
}
```

## 🔄 Type Transformers

### `src/{module}/helpers/type-transformers.ts`

**⚠️ КРИТИЧЕСКИ ВАЖНО:** Используй type transformers для преобразования типов из БД в Protobuf типы.

```typescript
import {
  BlueprintCategory,
  InfrastructureType,
  ValidationStatus,
  ServiceStatus,
  type Blueprint,
  type GenerationHistory,
} from "@axion/contracts";

/**
 * Transform database Blueprint to Protobuf Blueprint
 * Конвертирует строки из БД в Protobuf enum типы
 */
export function transformBlueprintToContract(dbBlueprint: {
  id: string;
  name: string;
  category: string; // В БД строка
  infrastructure: string; // В БД строка
  structure: Record<string, unknown> | null;
  contracts: { service: string; patterns: string[] }[] | null;
}): Blueprint {
  return {
    id: dbBlueprint.id,
    name: dbBlueprint.name,
    // ✅ Конвертируем строку из БД в Protobuf enum
    category: transformCategory(dbBlueprint.category),
    infrastructure: transformInfrastructure(dbBlueprint.infrastructure),
    // ✅ Обрабатываем опциональные JSONB поля с default значениями
    structure: dbBlueprint.structure || {},
    contracts: dbBlueprint.contracts || [],
  };
}

/**
 * Transform database category string to Protobuf enum
 */
export function transformCategory(category: string): BlueprintCategory {
  const categoryMap: Record<string, BlueprintCategory> = {
    microservice: BlueprintCategory.BLUEPRINT_CATEGORY_MICROSERVICE,
    frontend: BlueprintCategory.BLUEPRINT_CATEGORY_FRONTEND,
    library: BlueprintCategory.BLUEPRINT_CATEGORY_LIBRARY,
  };
  return (
    categoryMap[category] || BlueprintCategory.BLUEPRINT_CATEGORY_UNSPECIFIED
  );
}

/**
 * Transform database infrastructure string to Protobuf enum
 */
export function transformInfrastructure(infra: string): InfrastructureType {
  const infraMap: Record<string, InfrastructureType> = {
    nestjs: InfrastructureType.INFRASTRUCTURE_TYPE_NESTJS,
    nextjs: InfrastructureType.INFRASTRUCTURE_TYPE_NEXTJS,
    react: InfrastructureType.INFRASTRUCTURE_TYPE_REACT,
  };
  return infraMap[infra] || InfrastructureType.INFRASTRUCTURE_TYPE_UNSPECIFIED;
}

/**
 * Transform database validation status string to Protobuf enum
 */
export function transformValidationStatus(status: string): ValidationStatus {
  const statusMap: Record<string, ValidationStatus> = {
    pending: ValidationStatus.VALIDATION_STATUS_PENDING,
    valid: ValidationStatus.VALIDATION_STATUS_VALID,
    invalid: ValidationStatus.VALIDATION_STATUS_INVALID,
  };
  return statusMap[status] || ValidationStatus.VALIDATION_STATUS_UNSPECIFIED;
}

/**
 * Transform database service status string to Protobuf enum
 */
export function transformServiceStatus(status: string): ServiceStatus {
  const statusMap: Record<string, ServiceStatus> = {
    pending: ServiceStatus.SERVICE_STATUS_PENDING,
    generating: ServiceStatus.SERVICE_STATUS_GENERATING,
    generated: ServiceStatus.SERVICE_STATUS_GENERATED,
    validated: ServiceStatus.SERVICE_STATUS_VALIDATED,
    error: ServiceStatus.SERVICE_STATUS_ERROR,
  };
  return statusMap[status] || ServiceStatus.SERVICE_STATUS_UNSPECIFIED;
}
```

**Ключевые моменты:**

1. **Всегда создавай type-transformers** для конвертации DB типов → Protobuf типы
2. **Enum mapping** - используй Record<string, ProtobufEnum> для маппинга
3. **Default значения** - всегда обрабатывай `null` из JSONB полей
4. **UNSPECIFIED** - используй для неизвестных значений из БД
5. **НЕ используй `as any`** - всегда типобезопасная конвертация

## 🔐 Access Helper

### `src/{module}/helpers/{entity}-access.helper.ts`

```typescript
import {
  verifyResourceAccess,
  type AccessVerificationResult,
} from "@axion/shared";

import { type {Entity}Repository } from "@/{module}/repositories/{entity}.repository";

/**
 * Helper для проверки доступа к {entity}
 * Использует общий паттерн из @axion/shared
 */
export async function verify{Entity}Access(
  {entity}Repository: {Entity}Repository,
  {entity}Id: string,
  metadata: unknown
): Promise<AccessVerificationResult> {
  return verifyResourceAccess(
    {
      findById: (id) => {entity}Repository.findById(id),
      getOwnerId: ({entity}) => {entity}.userId,
      resourceName: "{Entity}",
    },
    {entity}Id,
    metadata
  );
}
```

## 🏥 Health Module

### `src/health/health.module.ts`

```typescript
import { Module } from "@nestjs/common";

import { HealthController } from "@/health/health.controller";

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

### `src/health/health.controller.ts`

```typescript
// HealthController автоматически предоставляется HealthModule из @axion/nestjs-common
// Если нужна кастомная логика, можно создать свой контроллер
```

## 🌍 Environment Variables

### `.env.example`

```env
# Database (отдельная БД для микросервиса)
# Замени {service_name} на имя сервиса (например, graph, user, etc.)
# Замени 543{X} на уникальный порт (например, 5433, 5434, etc.)
DATABASE_URL=postgresql://axion:axion_password@localhost:543{X}/axion_{service_name}

# Redis (Service Discovery)
REDIS_URL=redis://:axion_redis_password@localhost:6379

# Kafka (Event Bus для CQRS и Event Sourcing)
KAFKA_BROKERS=localhost:9092
# Suppress KafkaJS partitioner warning (using default partitioner)
KAFKAJS_NO_PARTITIONER_WARNING=1

# Service
PORT=300X
NODE_ENV=development
```

**Важно:** Каждый микросервис должен иметь свою отдельную БД. Не используй общую БД `axion_control_plane`.

## 🐳 Docker Compose - Настройка базы данных

**Важно:** Каждый микросервис должен иметь свою отдельную базу данных. Общей БД нет.

### Добавление БД для микросервиса

**Добавь в `docker-compose.yml` (после существующих postgres сервисов):**

```yaml
services:
  # ... существующие сервисы ...

  # PostgreSQL для {service-name}
  postgres-{service-name}:
    image: postgres:16-alpine
    container_name: axion-postgres-{service-name}
    profiles: ["infrastructure", "all"]
    environment:
      POSTGRES_USER: axion
      POSTGRES_PASSWORD: axion_password
      POSTGRES_DB: axion_{service_name} # Отдельная БД для микросервиса
      POSTGRES_INITDB_ARGS: "-U axion"
    ports:
      - "543{X}:5432" # Уникальный порт (например, 5433, 5434 и т.д.)
    volumes:
      - postgres_{service_name}_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres || pg_isready -U axion"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - axion-network

volumes:
  # ... существующие volumes ...
  postgres_{service_name}_data:
    driver: local
```

### Настройка переменных окружения

**В `.env.example` микросервиса:**

```env
# Отдельная БД для микросервиса (для локальной разработки)
DATABASE_URL=postgresql://axion:axion_password@localhost:543{X}/axion_{service_name}
```

**Для подключения из других Docker контейнеров используй Docker network hostname:**

```env
# Для подключения из других Docker контейнеров
DATABASE_URL=postgresql://axion:axion_password@postgres-{service-name}:5432/axion_{service_name}
```

### Выбор портов

Каждый микросервис должен иметь уникальный порт для доступа с хоста:

- `5432` - зарезервирован (если есть основной postgres)
- `5433` - первый микросервис (например, graph-service)
- `5434` - второй микросервис
- `5435` - третий микросервис
- и т.д.

**Пример для graph-service:**

```yaml
ports:
  - "5433:5432" # graph-service использует порт 5433 на хосте
```

**Пример для следующего микросервиса:**

```yaml
ports:
  - "5434:5432" # следующий сервис использует порт 5434 на хосте
```

### Преимущества отдельной БД

- ✅ Полная изоляция данных между микросервисами
- ✅ Независимое масштабирование
- ✅ Безопасность (каждый сервис имеет доступ только к своей БД)
- ✅ Упрощенное резервное копирование и восстановление
- ✅ Независимые миграции

### Проверка подключения

После настройки проверь подключение:

```bash
# Подключение к БД микросервиса
psql postgresql://axion:axion_password@localhost:543{X}/axion_{service_name}

# Или через Docker network (из другого контейнера)
psql postgresql://axion:axion_password@postgres-{service-name}:5432/axion_{service_name}
```

### Health Check

HealthModule автоматически проверяет подключение к БД через `getDatabaseClient()`. Убедись, что в `app.module.ts` правильно настроен `HealthModule`:

```typescript
HealthModule.forRoot({
  serviceName: {SERVICE_NAME}_CONSTANT,
  getDatabaseClient: () =>
    getClient() as (
      strings: TemplateStringsArray,
      ...values: unknown[]
    ) => Promise<unknown>,
}),
```

## 📝 Контракты (Protobuf)

### Важные моменты:

1. **MessagePattern константы** - должны быть определены в `packages/contracts`
2. **Request/Response типы** - генерируются из proto файлов
3. **Использование типов** - всегда импортируй из `@axion/contracts`

```typescript
import {
  {SERVICE}_PATTERNS,
  type {Action}Request,
  type {Action}Response,
  create{Entity}Response,
  createErrorResponse,
  createNotFoundError,
} from "@axion/contracts";
```

## ✅ Чеклист при создании нового микросервиса

### Инфраструктура

- [ ] Создать структуру папок согласно шаблону
- [ ] Настроить `package.json` с правильными зависимостями
- [ ] Настроить `tsconfig.json` с path aliases (`@/*`)
- [ ] **Настроить отдельную БД в `docker-compose.yml`** (каждый микросервис имеет свою БД)
- [ ] Создать `.env.example` с правильными переменными окружения
- [ ] Создать `drizzle.config.ts`

### Database Layer

- [ ] Создать database schema в `src/database/schema.ts`
  - [ ] Использовать `pgEnum` для enums (lowercase строки)
  - [ ] Типизировать JSONB поля через `.$type<>()`
  - [ ] Добавить timestamps (`createdAt`, `updatedAt`)
- [ ] Настроить database connection (`src/database/connection.ts`)
- [ ] Создать type transformers (`src/{module}/helpers/type-transformers.ts`)
  - [ ] Функции для конвертации DB типов → Protobuf enum
  - [ ] Обработка null/undefined для JSONB полей
  - [ ] Default значения для enum

### Application Layer

- [ ] Создать `main.ts` с `bootstrapMicroservice`
- [ ] Создать `app.module.ts`
  - [ ] Если вызываешь другие сервисы: добавить `ClientsModule.registerAsync` ПЕРВЫМ
  - [ ] Добавить `AuthModule.forRootAsync`
  - [ ] Добавить `HealthModule.forRoot`
  - [ ] Если есть ClientsModule: добавить `exports: [ClientsModule]`
- [ ] Создать основной модуль (`{module}.module.ts`)
  - [ ] НЕ добавлять `ClientsModule` здесь (только в AppModule)
- [ ] Создать контроллер с `@MessagePatternWithLog` handlers
- [ ] Создать main service (координатор)

### Business Logic

- [ ] Создать specialized services для бизнес-логики
  - [ ] Наследовать от `BaseService`
  - [ ] Использовать `@CatchError` декоратор
  - [ ] Если вызываешь другие сервисы: использовать `@Optional()` + `@Inject()` для ClientProxy
  - [ ] Проверять `if (!this.client)` перед использованием
  - [ ] Оборачивать `firstValueFrom` в try-catch с `handleServiceError`
- [ ] Создать repositories для работы с БД
  - [ ] Наследовать от `BaseRepository`
  - [ ] Кастомные методы с пагинацией
- [ ] Создать helpers для переиспользуемой логики
  - [ ] Type transformers (обязательно!)
  - [ ] Access helpers (если нужна проверка доступа)

### Contracts

- [ ] Добавить proto файлы в `packages/contracts/proto/`
- [ ] Добавить service patterns константы в `packages/contracts/src/constants/`
- [ ] Сгенерировать типы: `cd packages/contracts && bun run generate`
- [ ] Экспортировать типы и константы в `packages/contracts/src/index.ts`

### Database Migrations

- [ ] Сгенерировать миграции: `bun run migrate:generate`
- [ ] Проверить сгенерированный SQL
- [ ] Применить миграции: `bun run migrate` (или `migrate:push` для dev)

### Quality Assurance

- [ ] Проверить типы: `bun run type-check`
  - [ ] Убедиться, что нет использования `any`
  - [ ] Все типы импортируются из `@axion/contracts`
- [ ] Проверить линтер: `bun run lint`
- [ ] Проверить запуск сервиса: `bun dev`
  - [ ] Должны быть логи "Connecting to Kafka..."
  - [ ] Должен быть лог "Kafka microservice started"
  - [ ] Должен быть лог "HTTP server listening on port..."

### Documentation

- [ ] Создать `README.md` с документацией
  - [ ] Описание сервиса
  - [ ] Основные возможности
  - [ ] API endpoints
  - [ ] Environment variables
  - [ ] Примеры использования

### Важные проверки перед коммитом

- [ ] ✅ Все enum значения используются из Protobuf (НЕ строковые литералы)
- [ ] ✅ Все типы импортируются из `@axion/contracts`
- [ ] ✅ Используются type transformers для DB → Protobuf конвертации
- [ ] ✅ ClientsModule только в AppModule (если нужен)
- [ ] ✅ `@Optional()` используется для всех ClientProxy
- [ ] ✅ Используется path alias `@/` вместо относительных путов
- [ ] ✅ Нет использования `any` в коде
- [ ] ✅ `bun run type-check` проходит успешно
- [ ] ✅ `bun run lint` проходит успешно

## 🔑 Ключевые паттерны

### 1. Разделение ответственности

- **Controller** - только MessagePattern handlers, делегирует в Service
- **Main Service** - координатор, делегирует в специализированные сервисы
- **Specialized Services** - бизнес-логика
- **Repository** - только работа с БД
- **Helpers** - переиспользуемая логика

### 2. Обработка ошибок

```typescript
import { handleServiceError } from "@axion/shared";
import { CatchError } from "@axion/nestjs-common";

// Вариант 1: Использование @CatchError декоратора
@CatchError({ operation: "creating {entity}" })
async create(data: CreateRequest) {
  // Бизнес-логика
  // Ошибки автоматически обрабатываются через декоратор
  const entity = await this.repository.create(data);
  return createSuccessResponse(entity);
}

// Вариант 2: Ручная обработка с handleServiceError (для сложных случаев)
async complexOperation(data: Request) {
  try {
    // Попытка выполнить операцию
    const result = await this.repository.complexQuery(data);
    return createSuccessResponse(result);
  } catch (error) {
    // handleServiceError автоматически:
    // - Классифицирует ошибку (Database, Validation, NotFound, etc.)
    // - Логирует с правильным уровнем (warn для validation, error для internal)
    // - Конвертирует в Protobuf-compatible формат
    return handleServiceError(
      this.logger,
      "performing complex operation",
      error,
      {
        // Опциональный контекст для лучшего логирования
        resourceType: "Entity",
        resourceId: data.entityId,
        userId: data.userId,
      }
    );
  }
}

// Вариант 3: Межсервисное взаимодействие
async callOtherService(data: Request) {
  try {
    const response = await firstValueFrom(
      this.client.send(PATTERN, data)
    );

    // Проверяем error в ответе
    if (response.error) {
      return createErrorResponse(response.error);
    }

    return createSuccessResponse(response.result);
  } catch (error) {
    // Kafka communication error
    return handleServiceError(
      this.logger,
      "calling other service",
      error
    );
  }
}
```

**Ключевые моменты:**

1. **@CatchError декоратор** - для простых случаев
2. **handleServiceError** - для сложных случаев с контекстом
3. **НЕ обрабатывай ошибки вручную** - пусть система их классифицирует
4. **Проверяй response.error** при вызовах других сервисов
5. **НЕ используй try-catch без handleServiceError**

### 3. Валидация и доступ

```typescript
// Валидация metadata
const metadataCheck = this.validateMetadata(data.metadata);
if (!metadataCheck.success) return metadataCheck.response;

// Проверка доступа
const access = await verify{Entity}Access(
  this.{entity}Repository,
  data.{entity}Id,
  data.metadata
);
if (!access.success) return access.response;
```

### 4. Пагинация

```typescript
const { page, limit } = this.extractPagination(data.pagination);
const { {entity}s, total } = await this.{entity}Repository.findByUserId(
  userId,
  page,
  limit
);
return createList{Entity}sResponse(
  {entity}s.map(transform{Entity}ToContract),
  createFullPagination({ page, limit }, total)
);
```

### 5. Типы из контрактов

```typescript
// ✅ ПРАВИЛЬНО - типы из контрактов
import { type Blueprint, type GenerationHistory } from "@axion/contracts";

// ✅ ПРАВИЛЬНО - enums из контрактов (используй enum значения, НЕ строки)
import { ServiceStatus, ValidationStatus } from "@axion/contracts";

// Использование enum значений
const status = ServiceStatus.SERVICE_STATUS_PENDING; // ✅ Правильно
const status2 = "SERVICE_STATUS_PENDING"; // ❌ НЕПРАВИЛЬНО - не используй строки!

// ✅ ПРАВИЛЬНО - type transformers для конвертации
import { transformBlueprintToContract } from "@/{module}/helpers/type-transformers";

const contractBlueprint = transformBlueprintToContract(dbBlueprint);

// ❌ НЕПРАВИЛЬНО - хардкод типов
type Blueprint = { id: string; name: string }; // НЕТ!

// ❌ НЕПРАВИЛЬНО - использование as any
const blueprint = dbBlueprint as any; // НЕТ!

// ❌ НЕПРАВИЛЬНО - прямая отправка без трансформации
return createSuccessResponse(dbBlueprint); // НЕТ! Используй transformer
```

### 6. Работа с enum значениями

```typescript
import { ServiceStatus, ValidationStatus } from "@axion/contracts";

// ✅ ПРАВИЛЬНО - используй enum члены
const history = await this.repository.create({
  serviceId: data.serviceId,
  status: ServiceStatus.SERVICE_STATUS_PENDING, // ✅
  codeVersion: 1,
});

// Сравнение enum значений
if (history.status === ServiceStatus.SERVICE_STATUS_VALIDATED) {
  // ✅
  successful++;
}

// ❌ НЕПРАВИЛЬНО - строковые литералы
const history2 = await this.repository.create({
  status: "SERVICE_STATUS_PENDING", // ❌ НЕТ!
});

if (history.status === "SERVICE_STATUS_VALIDATED") {
  // ❌ НЕТ!
  successful++;
}
```

### 7. Работа с ClientsModule для межсервисного взаимодействия

```typescript
// ✅ ПРАВИЛЬНО - структура модуля

// AppModule - ClientsModule регистрируется ЗДЕСЬ
@Module({
  imports: [
    ClientsModule.registerAsync([...]), // Первым!
    AuthModule.forRootAsync({...}),
    HealthModule.forRoot({...}),
    FeatureModule,
  ],
  exports: [ClientsModule], // ОБЯЗАТЕЛЬНО экспортируй
})
export class AppModule {}

// FeatureModule - НЕ регистрируй ClientsModule повторно
@Module({
  // НЕТ ClientsModule здесь!
  controllers: [FeatureController],
  providers: [FeatureService], // ClientProxy будет доступен через DI
})
export class FeatureModule {}

// FeatureService - используй @Optional() для ClientProxy
@Injectable()
export class FeatureService {
  constructor(
    @Optional() // ✅ ОБЯЗАТЕЛЬНО @Optional()
    @Inject(GRAPH_SERVICE_NAME)
    private readonly graphClient: ClientProxy | null // ✅ | null
  ) {}

  async method() {
    // ✅ Проверяй доступность клиента
    if (!this.graphClient) {
      return createErrorResponse(
        createValidationError("Service client not available")
      );
    }

    try {
      const response = await firstValueFrom(
        this.graphClient.send(PATTERN, data)
      );
    } catch (error) {
      return handleServiceError(this.logger, "calling service", error);
    }
  }
}
```

## 📚 Дополнительные ресурсы

- `.cursorrules` - правила работы с типами и архитектурой
- `apps/graph-service/README.md` - пример документации
- `packages/contracts/` - Protobuf контракты
- `packages/nestjs-common/` - общие NestJS утилиты
- `packages/shared/` - общая логика
- `packages/database/` - database utilities
