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
*   **Service**: Имя сервиса в kebab-case (`product-service`).
*   **Method**: Имя метода в camelCase (`createProduct`).
*   **Pattern**: `{service}.{method}` (например, `product-service.createProduct`).

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

## Версионирование

При изменении графа (добавление поля, изменение метода) создается новая версия контрактов. Axion поддерживает **Backward Compatibility Check**: если удаляется используемое поле, система выдаст предупреждение.
