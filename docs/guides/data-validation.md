---
title: "Валидация входных данных"
description: "Валидация запросов и данных через ProtoValidate и Connect-RPC."
---

# Валидация входных данных

Axion использует **ProtoValidate** (от Buf) для декларативной валидации данных на уровне Protobuf контрактов. Это обеспечивает единый источник правил валидации для всех сервисов.

## Принципы

1. **Contract-First Validation**: Правила валидации определяются в `.proto` файлах через аннотации `buf.validate`
2. **Runtime Enforcement**: Валидация происходит автоматически через `@bufbuild/protovalidate`
3. **Type Safety**: TypeScript типы и схемы генерируются из proto автоматически
4. **Cross-Language**: Одинаковые правила валидации работают во всех языках (TypeScript, Rust, Go)

## Установка

### Зависимости

```json
{
  "dependencies": {
    "@bufbuild/protobuf": "^1.x",
    "@bufbuild/protovalidate": "^1.x",
    "@connectrpc/connect": "^1.x",
    "@connectrpc/connect-node": "^1.x"
  }
}
```

### Конфигурация buf.gen.yaml

```yaml
version: v2
plugins:
  - remote: buf.build/protocolbuffers/es
    out: generated
    opt:
      - target=ts
  - remote: buf.build/connectrpc/es
    out: generated
    opt:
      - target=ts
```

## Базовые правила валидации

### String validation

```protobuf
message CreateUserRequest {
  // Email валидация
  string email = 1 [
    (buf.validate.field).string.email = true
  ];

  // UUID валидация
  string user_id = 2 [
    (buf.validate.field).string.uuid = true
  ];

  // Длина строки
  string name = 3 [
    (buf.validate.field).string.min_len = 1,
    (buf.validate.field).string.max_len = 100
  ];

  // Regex паттерн (RE2 синтаксис)
  string username = 4 [
    (buf.validate.field).string.pattern = "^[a-z0-9_-]{3,20}$"
  ];
}
```

### Numeric validation

```protobuf
message CreateProductRequest {
  // Больше нуля
  double price = 1 [
    (buf.validate.field).double.gt = 0
  ];

  // Диапазон значений
  uint32 age = 2 [
    (buf.validate.field).uint32.gte = 0,
    (buf.validate.field).uint32.lte = 150
  ];

  // Целое число
  int32 quantity = 3 [
    (buf.validate.field).int32.gte = 1
  ];
}
```

### Repeated/Array validation

```protobuf
message BatchRequest {
  // Минимум и максимум элементов
  repeated string ids = 1 [
    (buf.validate.field).repeated.min_items = 1,
    (buf.validate.field).repeated.max_items = 100
  ];

  // Уникальные значения
  repeated string tags = 2 [
    (buf.validate.field).repeated.unique = true
  ];
}
```

### Required fields

```protobuf
message CreateProjectRequest {
  // Обязательное поле
  common.RequestMetadata metadata = 1 [
    (buf.validate.field).required = true
  ];

  string name = 2 [
    (buf.validate.field).required = true,
    (buf.validate.field).string.min_len = 1
  ];
}
```

## Custom CEL валидация

Для сложной бизнес-логики используй **CEL** (Common Expression Language):

```protobuf
message UpdateProjectRequest {
  string project_id = 1 [(buf.validate.field).string.uuid = true];
  string name = 2;
  ProjectStatus status = 3;
  optional string change_reason = 4;

  // Проверка что имя не пустое (без пробелов)
  option (buf.validate.message).cel = {
    id: "name_not_empty"
    message: "name must not be empty or whitespace only"
    expression: "!has(this.name) || this.name.trim().size() > 0"
  };

  // Условная валидация: если меняется статус, нужна причина
  option (buf.validate.message).cel = {
    id: "status_change_requires_reason"
    message: "status change requires a change_reason"
    expression: "this.status == oldStatus || has(this.change_reason)"
  };

  // Запрет перехода из ARCHIVED в ACTIVE
  option (buf.validate.message).cel = {
    id: "no_archived_to_active"
    message: "Cannot transition from ARCHIVED to ACTIVE directly"
    expression: "!(this.status == ProjectStatus.ACTIVE && oldStatus == ProjectStatus.ARCHIVED)"
  };
}

message User {
  string first_name = 1;
  string last_name = 2;

  // Если есть first_name, должен быть и last_name
  option (buf.validate.message).cel = {
    id: "first_name_requires_last_name"
    message: "last_name must be present if first_name is present"
    expression: "!has(this.first_name) || has(this.last_name)"
  };
}
```

## Валидация в NestJS сервисах

### В сервисах

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { createValidator } from "@bufbuild/protovalidate";
import {
  CreateProjectRequest,
  CreateProjectRequestSchema,
  type CreateProjectResponse,
} from "@axion/contracts";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationError,
} from "@axion/contracts";

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly validator = createValidator();

  async create(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    // Валидация через protovalidate
    const validationResult = this.validator.validate(
      CreateProjectRequestSchema,
      data
    );

    if (validationResult.kind !== "valid") {
      this.logger.warn("Validation failed", {
        violations: validationResult.violations,
      });

      const firstViolation = validationResult.violations[0];
      return createErrorResponse(
        createValidationError(firstViolation.message, firstViolation.fieldPath)
      );
    }

    // Бизнес-логика после успешной валидации
    try {
      const project = await this.projectRepository.create({
        name: data.name,
        description: data.description,
        userId: data.userId,
      });

      return createSuccessResponse(project);
    } catch (error) {
      return handleServiceError(this.logger, "creating project", error);
    }
  }
}
```

### В Kafka контроллерах

```typescript
import { Controller, UseGuards, Logger } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { createValidator } from "@bufbuild/protovalidate";
import {
  GRAPH_SERVICE_PATTERNS,
  CreateProjectRequest,
  CreateProjectRequestSchema,
  type CreateProjectResponse,
} from "@axion/contracts";
import { MicroserviceAuthGuard } from "@axion/nestjs-common";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class GraphController {
  private readonly logger = new Logger(GraphController.name);
  private readonly validator = createValidator();

  constructor(private readonly graphService: GraphService) {}

  @MessagePattern(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
  async createProject(
    @Payload() data: CreateProjectRequest
  ): Promise<CreateProjectResponse> {
    // Валидация на уровне контроллера
    const validationResult = this.validator.validate(
      CreateProjectRequestSchema,
      data
    );

    if (validationResult.kind !== "valid") {
      this.logger.warn("Invalid request received", {
        pattern: GRAPH_SERVICE_PATTERNS.CREATE_PROJECT,
        violations: validationResult.violations,
      });

      return createErrorResponse(
        createValidationError(
          validationResult.violations[0].message,
          validationResult.violations[0].fieldPath
        )
      );
    }

    return this.graphService.createProject(data);
  }
}
```

### В HTTP контроллерах

```typescript
import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { createValidator } from "@bufbuild/protovalidate";
import {
  CreateProjectRequest,
  CreateProjectRequestSchema,
  type CreateProjectResponse,
  type RequestMetadata,
} from "@axion/contracts";
import { AxionRequestMetadata, HttpAuthGuard } from "@axion/nestjs-common";

@Controller("api/projects")
@UseGuards(HttpAuthGuard)
export class GraphHttpController {
  private readonly validator = createValidator();

  constructor(private readonly graphService: GraphService) {}

  @Post()
  async createProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<CreateProjectRequest, "metadata">
  ): Promise<CreateProjectResponse> {
    const request: CreateProjectRequest = { metadata, ...body };

    // Валидация перед передачей в сервис
    const validationResult = this.validator.validate(
      CreateProjectRequestSchema,
      request
    );

    if (validationResult.kind !== "valid") {
      return createErrorResponse(
        createValidationError(
          validationResult.violations[0].message,
          validationResult.violations[0].fieldPath
        )
      );
    }

    return this.graphService.createProject(request);
  }
}
```

## Переиспользуемые валидаторы

Создай helper для переиспользования валидации:

```typescript
// packages/shared/src/validation/protovalidate.helper.ts
import { createValidator } from "@bufbuild/protovalidate";
import type { Logger } from "@nestjs/common";
import {
  createErrorResponse,
  createValidationError,
  type ServiceResponse,
} from "@axion/contracts";

export class ProtoValidator {
  private readonly validator = createValidator();

  /**
   * Валидирует данные и возвращает ошибку если валидация не прошла
   * @returns null если валидация успешна, ServiceResponse с ошибкой если нет
   */
  validateOrError<T>(
    schema: any,
    data: T,
    logger?: Logger
  ): ServiceResponse | null {
    const result = this.validator.validate(schema, data);

    if (result.kind === "valid") {
      return null; // No error
    }

    if (logger) {
      logger.warn("Validation failed", {
        violations: result.violations.map((v) => ({
          field: v.fieldPath,
          message: v.message,
        })),
      });
    }

    const firstViolation = result.violations[0];
    return createErrorResponse(
      createValidationError(firstViolation.message, firstViolation.fieldPath)
    );
  }

  /**
   * Собирает все ошибки валидации
   */
  validate<T>(
    schema: any,
    data: T
  ):
    | {
        success: true;
      }
    | {
        success: false;
        errors: Array<{ field: string; message: string }>;
      } {
    const result = this.validator.validate(schema, data);

    if (result.kind === "valid") {
      return { success: true };
    }

    const errors = result.violations.map((v) => ({
      field: v.fieldPath,
      message: v.message,
    }));

    return { success: false, errors };
  }
}
```

**Использование:**

```typescript
import { ProtoValidator } from "@axion/shared";
import { CreateProjectRequestSchema } from "@axion/contracts";

@Injectable()
export class ProjectsService {
  private readonly protoValidator = new ProtoValidator();

  async create(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    // Переиспользуемый валидатор
    const error = this.protoValidator.validateOrError(
      CreateProjectRequestSchema,
      data,
      this.logger
    );
    if (error) return error as CreateProjectResponse;

    // Бизнес-логика...
  }
}
```

## Connect-RPC сервисы

Для type-safe RPC используй Connect-RPC:

```typescript
import { ConnectRouter, Code, ConnectError } from "@connectrpc/connect";
import { createValidator } from "@bufbuild/protovalidate";
import {
  GraphService,
  type CreateProjectRequest,
  CreateProjectRequestSchema,
} from "@axion/contracts";

export function graphServiceRouter(router: ConnectRouter) {
  const validator = createValidator();

  router.rpc(
    GraphService,
    "createProject",
    async (req: CreateProjectRequest) => {
      // Автоматическая валидация через protovalidate
      const validationResult = validator.validate(
        CreateProjectRequestSchema,
        req
      );

      if (validationResult.kind !== "valid") {
        throw new ConnectError(
          validationResult.violations[0].message,
          Code.InvalidArgument,
          undefined,
          validationResult.violations // Все ошибки в details
        );
      }

      // Бизнес-логика
      return await projectService.create(req);
    }
  );
}
```

## Best Practices

### 1. Всегда определяй валидацию в proto

❌ **НЕ ДЕЛАЙ:**

```typescript
// Валидация в коде
if (!data.name || data.name.length < 1) {
  throw new Error("Name is required");
}
```

✅ **ДЕЛАЙ:**

```protobuf
message CreateProjectRequest {
  string name = 1 [
    (buf.validate.field).string.min_len = 1,
    (buf.validate.field).string.max_len = 255
  ];
}
```

### 2. Используй CEL для сложной логики

```protobuf
option (buf.validate.message).cel = {
  id: "price_discount_logic"
  message: "discount cannot exceed price"
  expression: "this.discount <= this.price"
};
```

### 3. Обрабатывай все violations

```typescript
if (validationResult.kind !== "valid") {
  // Логируй все ошибки для дебага
  this.logger.warn("Validation failed", {
    violations: validationResult.violations.map((v) => ({
      field: v.fieldPath,
      message: v.message,
      constraint: v.constraintId,
    })),
  });

  // Возвращай первую ошибку пользователю
  const firstViolation = validationResult.violations[0];
  return createErrorResponse(
    createValidationError(firstViolation.message, firstViolation.fieldPath)
  );
}
```

### 4. Тестируй валидацию

```typescript
describe("CreateProjectRequest validation", () => {
  const validator = createValidator();

  it("should reject empty name", () => {
    const request: CreateProjectRequest = {
      metadata: mockMetadata,
      name: "",
    };

    const result = validator.validate(CreateProjectRequestSchema, request);

    expect(result.kind).toBe("invalid");
    expect(result.violations[0].fieldPath).toBe("name");
  });

  it("should accept valid request", () => {
    const request: CreateProjectRequest = {
      metadata: mockMetadata,
      name: "My Project",
    };

    const result = validator.validate(CreateProjectRequestSchema, request);

    expect(result.kind).toBe("valid");
  });
});
```

## Справочник buf.validate

### String Rules

- `min_len` / `max_len` - минимальная/максимальная длина
- `pattern` - regex паттерн (RE2)
- `prefix` / `suffix` / `contains` - начинается/заканчивается/содержит
- `email` - валидация email
- `hostname` - валидация hostname
- `ip` / `ipv4` / `ipv6` - валидация IP адреса
- `uri` / `uri_ref` - валидация URI
- `uuid` - валидация UUID

### Numeric Rules

- `const` - точное значение
- `lt` / `lte` / `gt` / `gte` - сравнения
- `in` / `not_in` - значение в списке

### Repeated Rules

- `min_items` / `max_items` - размер массива
- `unique` - уникальные элементы

### Message Rules

- `required` - обязательное поле
- `cel` - custom CEL expressions

## Ссылки

- [ProtoValidate Documentation](https://github.com/bufbuild/protovalidate)
- [CEL Language Guide](https://github.com/google/cel-spec/blob/master/doc/langdef.md)
- [Connect-RPC Documentation](https://connectrpc.com/)
- [Buf Documentation](https://buf.build/docs)
