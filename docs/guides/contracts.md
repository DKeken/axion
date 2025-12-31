---
title: "Контракты и Схемы"
description: "Стандарты проектирования Protobuf-контрактов и автоматическая генерация схем."
---

# Контракты и Схемы

В Axion **Protobuf** является единственным источником истины для межсервисного взаимодействия. Мы не пишем DTO вручную — они генерируются из графа.

## Принципы

1.  **Contract First**: Сначала определяется контракт в `.proto`, затем генерируется код.
2.  **Single Source of Truth**: Граф архитектуры определяет, какие методы доступны.
3.  **Strict Typing**: Все типы строго типизированы и валидируются в рантайме.

## Структура файлов

```
proto/
├── common/
│   └── common.proto           # Общие типы (Pagination, Errors, Metadata)
├── services/
│   └── {service-name}.proto   # Контракт конкретного сервиса
```

## Формат контракта

Каждый сервис должен следовать стандарту `CRUD + Custom Actions`.

```protobuf
syntax = "proto3";
package axion.product_service;

import "common/common.proto";

service ProductService {
  // Стандартные CRUD операции
  rpc CreateProduct(CreateProductRequest) returns (ProductResponse);
  rpc GetProduct(GetProductRequest) returns (ProductResponse);

  // Кастомные действия
  rpc UpdateStock(UpdateStockRequest) returns (common.Empty);
}

message CreateProductRequest {
  common.RequestMetadata metadata = 1;
  string name = 2;
  double price = 3;
}

message ProductResponse {
  oneof result {
    Product success = 1;
    common.Error error = 2;
  }
}
```

## Интеграция с HTTP RPC

Axion использует HTTP/1.1 для транспорта Protobuf сообщений (вместо gRPC для простоты в браузере и легких сервисах).

**Маппинг:**

- **Service**: Имя сервиса в kebab-case (`product-service`).
- **Method**: Имя метода в camelCase (`createProduct`).
- **Pattern**: `{service}.{method}` (например, `product-service.createProduct`).

```typescript
// Пример реализации хендлера
httpRpcServer.registerHandler(
  "product-service.createProduct",
  async (data: CreateProductRequest): Promise<ProductResponse> => {
    // Автоматическая десериализация и валидация
    return await productService.create(data);
  }
);
```

## Правила генерации

1.  **Package Name**: `axion.{service_name_snake_case}`.
2.  **Metadata**: Каждое Request-сообщение **обязано** иметь поле `common.RequestMetadata metadata = 1`.
3.  **OneOf Result**: Все Response-сообщения должны использовать `oneof` для возврата либо успешного результата, либо структурированной ошибки.

## Валидация данных (buf.validate)

Все Protobuf-сообщения **должны** включать аннотации валидации через `buf.validate`. Это обеспечивает проверку данных на уровне контракта.

```protobuf
syntax = "proto3";
package axion.product_service;

import "buf/validate/validate.proto";
import "common/common.proto";

message CreateProductRequest {
  common.RequestMetadata metadata = 1 [(buf.validate.field).required = true];

  string name = 2 [
    (buf.validate.field).string.min_len = 1,
    (buf.validate.field).string.max_len = 255
  ];

  double price = 3 [
    (buf.validate.field).double.gt = 0
  ];

  string sku = 4 [
    (buf.validate.field).string.pattern = "^[A-Z0-9-]+$"
  ];

  // Custom CEL validation
  option (buf.validate.message).cel = {
    id: "name_not_empty"
    message: "name must not be empty or whitespace only"
    expression: "this.name.trim().size() > 0"
  };
}
```

**Стандартные правила валидации:**

- **String**: `min_len`, `max_len`, `pattern` (RE2), `email`, `uuid`
- **Numeric**: `gt`, `gte`, `lt`, `lte`
- **Repeated**: `min_items`, `max_items`, `unique`
- **Required**: `required = true`
- **Custom**: CEL expressions для сложной логики

## Connect-RPC интеграция

Axion использует **Connect-RPC** для type-safe взаимодействия между сервисами. Connect-RPC работает поверх HTTP/1.1 и совместим с браузерами.

```typescript
// Генерация типов через buf.gen.yaml
// plugins:
//   - remote: buf.build/protocolbuffers/es
//   - remote: buf.build/connectrpc/es

import { ConnectRouter } from "@connectrpc/connect";
import { createValidator } from "@bufbuild/protovalidate";
import { ProductService } from "@axion/contracts";
import type { CreateProductRequest } from "@axion/contracts";

// Настройка роутера
export function productServiceRouter(router: ConnectRouter) {
  const validator = createValidator();

  router.rpc(
    ProductService,
    "createProduct",
    async (req: CreateProductRequest) => {
      // Автоматическая валидация через buf.validate
      const result = validator.validate(CreateProductRequestSchema, req);
      if (result.kind !== "valid") {
        throw new ConnectError(
          result.violations[0].message,
          Code.InvalidArgument
        );
      }

      return await productService.create(req);
    }
  );
}
```

## Версионирование

При изменении графа (добавление поля, изменение метода) создается новая версия контрактов. Axion поддерживает **Backward Compatibility Check**: если удаляется используемое поле, система выдаст предупреждение.

**Правила совместимости:**

1. **Добавление полей**: Безопасно (backward compatible)
2. **Удаление полей**: Требует major version bump
3. **Изменение типов**: Запрещено (breaking change)
4. **Переименование**: Используй `[deprecated = true]` и добавляй новое поле
