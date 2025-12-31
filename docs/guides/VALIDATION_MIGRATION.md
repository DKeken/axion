---
title: "Миграция на ProtoValidate"
description: "Руководство по переходу с Typia/Nestia на ProtoValidate и Connect-RPC"
---

# Миграция на ProtoValidate и Connect-RPC

Этот документ описывает переход Axion Stack с Typia/Nestia на **ProtoValidate** и **Connect-RPC** для валидации данных и межсервисного взаимодействия.

## Причины миграции

### Проблемы с Typia/Nestia

1. **Специфичность для TypeScript**: Typia работает только в TypeScript экосистеме
2. **Компиляция**: Требует трансформеров TypeScript, усложняет build процесс
3. **Отсутствие cross-language поддержки**: Невозможно использовать в Rust/Go сервисах
4. **Дублирование валидации**: Правила определяются в коде, а не в контрактах

### Преимущества ProtoValidate

1. **Contract-First**: Валидация определяется в `.proto` файлах
2. **Cross-Language**: Работает в TypeScript, Rust, Go, Python и других языках
3. **Единый источник правил**: Один `.proto` файл для всех сервисов
4. **CEL expressions**: Мощные custom валидации через Common Expression Language
5. **Официальная поддержка Buf**: Стабильный и поддерживаемый инструмент

## Основные изменения

### До (Typia/Nestia)

```typescript
// HTTP контроллер с Nestia
import { TypedRoute, TypedBody } from "@nestia/core";
import typia from "typia";

@Controller("api")
export class GraphHttpController {
  @TypedRoute.Post("projects")
  async createProject(@TypedBody() body: CreateProjectRequest) {
    const validated = typia.assert<CreateProjectRequest>(body);
    return this.service.create(validated);
  }
}

// Kafka контроллер с Typia
@MessagePattern(PATTERNS.CREATE_PROJECT)
async createProject(
  @Payload(createTypiaAssertPipe<CreateProjectRequest>())
  data: CreateProjectRequest
) {
  return this.service.create(data);
}
```

### После (ProtoValidate)

```protobuf
// Определение валидации в .proto
syntax = "proto3";
import "buf/validate/validate.proto";

message CreateProjectRequest {
  RequestMetadata metadata = 1 [(buf.validate.field).required = true];
  
  string name = 2 [
    (buf.validate.field).string.min_len = 1,
    (buf.validate.field).string.max_len = 255
  ];
  
  option (buf.validate.message).cel = {
    id: "name_not_empty"
    message: "name must not be empty"
    expression: "this.name.trim().size() > 0"
  };
}
```

```typescript
// HTTP контроллер с ProtoValidate
import { createValidator } from "@bufbuild/protovalidate";
import { CreateProjectRequestSchema } from "@axion/contracts";

@Controller("api/projects")
export class GraphHttpController {
  private readonly validator = createValidator();

  @Post()
  async createProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<CreateProjectRequest, "metadata">
  ) {
    const request = { metadata, ...body };
    
    const result = this.validator.validate(CreateProjectRequestSchema, request);
    if (result.kind !== "valid") {
      return createErrorResponse(
        createValidationError(
          result.violations[0].message,
          result.violations[0].fieldPath
        )
      );
    }

    return this.service.create(request);
  }
}

// Kafka контроллер с ProtoValidate
@MessagePattern(PATTERNS.CREATE_PROJECT)
async createProject(@Payload() data: CreateProjectRequest) {
  const result = this.validator.validate(CreateProjectRequestSchema, data);
  if (result.kind !== "valid") {
    return createErrorResponse(
      createValidationError(
        result.violations[0].message,
        result.violations[0].fieldPath
      )
    );
  }
  
  return this.service.create(data);
}
```

## План миграции

### Шаг 1: Установка зависимостей

```bash
# Удаление Typia/Nestia
bun remove typia @nestia/core

# Установка ProtoValidate и Connect-RPC
bun add @bufbuild/protobuf @bufbuild/protovalidate
bun add @connectrpc/connect @connectrpc/connect-node
bun add -D @bufbuild/buf @connectrpc/protoc-gen-connect-es
```

### Шаг 2: Обновление buf.gen.yaml

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

### Шаг 3: Добавление buf.validate в proto файлы

```protobuf
syntax = "proto3";
package axion.graph.v1;

import "buf/validate/validate.proto";
import "common/common.proto";

message CreateProjectRequest {
  common.RequestMetadata metadata = 1 [(buf.validate.field).required = true];
  
  string name = 2 [
    (buf.validate.field).string.min_len = 1,
    (buf.validate.field).string.max_len = 255
  ];
  
  string description = 3 [
    (buf.validate.field).string.max_len = 1000
  ];
}
```

### Шаг 4: Генерация типов

```bash
cd packages/contracts
bun run generate
```

### Шаг 5: Обновление контроллеров

Замени:
- `TypedRoute` → стандартные NestJS декораторы
- `TypedBody` → `@Body()`
- `createTypiaAssertPipe` → ручная валидация через `createValidator()`
- `typia.assert` → `validator.validate()`

### Шаг 6: Удаление TypeScript transformers

Удали из `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "typia/lib/transform" },  // Удалить
      { "transform": "@nestia/core/lib/transform" }  // Удалить
    ]
  }
}
```

### Шаг 7: Обновление тестов

```typescript
// До
import typia from "typia";
const validated = typia.assert<CreateProjectRequest>(data);

// После
import { createValidator } from "@bufbuild/protovalidate";
import { CreateProjectRequestSchema } from "@axion/contracts";

const validator = createValidator();
const result = validator.validate(CreateProjectRequestSchema, data);
expect(result.kind).toBe("valid");
```

## Сравнение синтаксиса

### Валидация строк

```typescript
// Typia
type User = {
  /** @minLength 1 @maxLength 100 */
  name: string;
  /** @format email */
  email: string;
};

// ProtoValidate
message User {
  string name = 1 [
    (buf.validate.field).string.min_len = 1,
    (buf.validate.field).string.max_len = 100
  ];
  
  string email = 2 [
    (buf.validate.field).string.email = true
  ];
}
```

### Валидация чисел

```typescript
// Typia
type Product = {
  /** @minimum 0 */
  price: number;
  /** @minimum 1 @maximum 100 */
  quantity: number;
};

// ProtoValidate
message Product {
  double price = 1 [
    (buf.validate.field).double.gte = 0
  ];
  
  uint32 quantity = 2 [
    (buf.validate.field).uint32.gte = 1,
    (buf.validate.field).uint32.lte = 100
  ];
}
```

### Custom валидация

```typescript
// Typia - невозможно определить в типах
// Требует runtime функций

// ProtoValidate - CEL expressions
message UpdateProjectRequest {
  string name = 1;
  ProjectStatus status = 2;
  
  option (buf.validate.message).cel = {
    id: "name_not_empty"
    message: "name must not be empty or whitespace only"
    expression: "this.name.trim().size() > 0"
  };
}
```

## Рекомендации

### ✅ DO (Делай)

1. **Определяй все правила валидации в `.proto` файлах**
   - Используй `buf.validate` аннотации
   - Добавляй CEL expressions для сложной логики

2. **Используй createValidator() на уровне класса**
   ```typescript
   @Injectable()
   export class MyService {
     private readonly validator = createValidator();
   }
   ```

3. **Валидируй данные перед бизнес-логикой**
   - В контроллерах для ранней валидации
   - В сервисах для дополнительной защиты

4. **Логируй все violations для отладки**
   ```typescript
   if (result.kind !== "valid") {
     logger.warn("Validation failed", { violations: result.violations });
   }
   ```

### ❌ DON'T (Не делай)

1. **Не используй TypeScript JSDoc комментарии для валидации**
   - Не работают в runtime без Typia

2. **Не дублируй валидацию в коде и proto**
   - Единственный источник правил - `.proto` файлы

3. **Не игнорируй все violations**
   - Логируй все, возвращай первую

4. **Не миксуй разные системы валидации**
   - Не используй class-validator, Joi, Zod вместе с ProtoValidate

## Тестирование миграции

### Контрольный список

- [ ] Все `.proto` файлы содержат `buf.validate` аннотации
- [ ] Контракты успешно генерируются (`bun run generate`)
- [ ] Все контроллеры используют `createValidator()`
- [ ] Нет импортов `typia` или `@nestia/core`
- [ ] Удалены TypeScript transformers из `tsconfig.json`
- [ ] Unit тесты валидации обновлены
- [ ] E2E тесты проходят успешно
- [ ] `bun type-check` проходит без ошибок
- [ ] `bun lint` проходит без ошибок

### Тестовые сценарии

1. **Позитивный тест**: Валидные данные проходят валидацию
2. **Негативный тест**: Невалидные данные отклоняются
3. **Граничные значения**: min/max длины, числовые границы
4. **CEL валидация**: Custom правила работают корректно
5. **Error messages**: Понятные сообщения об ошибках

## Дополнительные ресурсы

- [ProtoValidate Documentation](https://github.com/bufbuild/protovalidate)
- [CEL Language Guide](https://github.com/google/cel-spec/blob/master/doc/langdef.md)
- [Connect-RPC Documentation](https://connectrpc.com/)
- [Buf CLI Documentation](https://buf.build/docs/cli)
- [Валидация входных данных](./data-validation.md)
- [Контракты и Protobuf](./contracts.md)

## FAQ

### Q: Почему не использовать class-validator?

**A:** class-validator требует DTO классы и не интегрируется с Protobuf контрактами. ProtoValidate позволяет определить валидацию один раз в `.proto` и использовать во всех языках.

### Q: Как тестировать CEL expressions?

**A:** Используй unit тесты с `createValidator()` и проверяй `violations`:

```typescript
const result = validator.validate(Schema, data);
expect(result.violations.some(v => v.constraintId === "my_cel_rule")).toBe(true);
```

### Q: Можно ли использовать ProtoValidate с gRPC?

**A:** Да, ProtoValidate работает с любым Protobuf транспортом (gRPC, Connect-RPC, HTTP/JSON).

### Q: Как валидировать вложенные сообщения?

**A:** ProtoValidate автоматически валидирует вложенные сообщения. Определи правила для каждого message типа.

### Q: Производительность ProtoValidate vs Typia?

**A:** ProtoValidate немного медленнее Typia (который компилирует валидацию в compile-time), но разница незначительна для большинства случаев. Преимущества cross-language поддержки перевешивают небольшую потерю производительности.

---

_Документ обновлен: 2025-01-01_

