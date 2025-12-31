---
title: "Тестирование"
description: "Стратегия обеспечения качества: контрактные тесты, E2E и валидация генерации."
---

# Стратегия Тестирования

Axion применяет пирамиду тестирования, адаптированную под специфику мета-фреймворка.

## 1. Contract Testing (Контрактные тесты)

Критически важны для предотвращения рассинхронизации между сервисами.

- **Schema Check**: Проверяет валидность `.proto` файлов (синтаксис, линтинг).
- **Compatibility Check**: Утилита `buf breaking` проверяет, что новые изменения не ломают обратную совместимость (например, удаление полей или изменение ID полей).

## 2. End-to-End (E2E) Тесты

Проверяют полные пользовательские сценарии. Тесты запускаются в изолированном Docker-окружении.

**Ключевой сценарий (Happy Path):**

1.  **Init**: Создание нового проекта через API.
2.  **Design**: Добавление сервисов и связей в граф.
3.  **Generate**: Запуск кодогенерации и ожидание завершения.
4.  **Validate**: Проверка статуса валидации (все 6 уровней ✅).
5.  **Deploy**: Эмуляция деплоя на тестовый агент.

```bash
# Запуск E2E тестов локально
bun test:e2e
```

## 3. Валидация генерации (Generated Code Tests)

Специфичный для Axion уровень тестирования. Мы тестируем не только платформу, но и код, который она производит.

- **Compilation Test**: Сгенерированный код должен компилироваться (`tsc`).
- **Dependency Check**: Все импорты должны разрешаться.
- **Linting**: Код должен соответствовать ESLint правилам.

Если Blueprint производит невалидный код, это считается багом платформы, а не пользователя.

## 4. Unit Tests

Покрывают сложную бизнес-логику внутри сервисов Control Plane (например, алгоритмы диффинга графов или расчет биллинга).

- **Инструмент**: `bun test` (совместим с Jest).
- **Моки**: Активное использование моков для Kafka и базы данных.

## 5. Validation Tests (Тесты валидации данных)

Проверяют правила валидации, определенные в Protobuf контрактах через `buf.validate`.

### Тестирование ProtoValidate

```typescript
import { describe, it, expect } from "bun:test";
import { createValidator } from "@bufbuild/protovalidate";
import {
  CreateProjectRequest,
  CreateProjectRequestSchema,
  type RequestMetadata,
} from "@axion/contracts";

describe("CreateProjectRequest validation", () => {
  const validator = createValidator();
  const mockMetadata: RequestMetadata = {
    userId: "123e4567-e89b-12d3-a456-426614174000",
    traceId: "trace-123",
  };

  it("should reject empty name", () => {
    const request: CreateProjectRequest = {
      metadata: mockMetadata,
      name: "",
    };

    const result = validator.validate(CreateProjectRequestSchema, request);

    expect(result.kind).toBe("invalid");
    expect(result.violations[0].fieldPath).toBe("name");
    expect(result.violations[0].message).toContain("min_len");
  });

  it("should reject name longer than 255 chars", () => {
    const request: CreateProjectRequest = {
      metadata: mockMetadata,
      name: "a".repeat(256),
    };

    const result = validator.validate(CreateProjectRequestSchema, request);

    expect(result.kind).toBe("invalid");
    expect(result.violations[0].fieldPath).toBe("name");
  });

  it("should accept valid request", () => {
    const request: CreateProjectRequest = {
      metadata: mockMetadata,
      name: "My Project",
      description: "Test project description",
    };

    const result = validator.validate(CreateProjectRequestSchema, request);

    expect(result.kind).toBe("valid");
  });

  it("should reject whitespace-only name (CEL validation)", () => {
    const request: CreateProjectRequest = {
      metadata: mockMetadata,
      name: "   ",
    };

    const result = validator.validate(CreateProjectRequestSchema, request);

    expect(result.kind).toBe("invalid");
    expect(
      result.violations.some((v) => v.constraintId === "name_not_empty")
    ).toBe(true);
  });
});
```

### Тестирование custom CEL правил

```typescript
describe("UpdateProjectRequest CEL validation", () => {
  const validator = createValidator();

  it("should require change_reason when status changes", () => {
    const request: UpdateProjectRequest = {
      metadata: mockMetadata,
      projectId: "project-123",
      status: ProjectStatus.ARCHIVED,
      // change_reason отсутствует
    };

    const result = validator.validate(UpdateProjectRequestSchema, request);

    expect(result.kind).toBe("invalid");
    expect(
      result.violations.some(
        (v) => v.constraintId === "status_change_requires_reason"
      )
    ).toBe(true);
  });

  it("should prevent direct transition from ARCHIVED to ACTIVE", () => {
    const request: UpdateProjectRequest = {
      metadata: mockMetadata,
      projectId: "project-123",
      status: ProjectStatus.ACTIVE,
      changeReason: "Reactivating project",
      // oldStatus = ARCHIVED (передается из контекста)
    };

    const result = validator.validate(UpdateProjectRequestSchema, request);

    expect(result.kind).toBe("invalid");
    expect(
      result.violations.some((v) => v.constraintId === "no_archived_to_active")
    ).toBe(true);
  });
});
```

### Best Practices для тестов валидации

1. **Тестируй все критические правила**: Каждое `buf.validate` правило должно иметь тест
2. **Проверяй граничные значения**: min/max длины, числовые границы
3. **Тестируй CEL expressions**: Custom валидация требует особого внимания
4. **Проверяй error messages**: Убедись, что сообщения об ошибках понятны пользователю
