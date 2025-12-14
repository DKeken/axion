# План рефакторинга типизации Axion Stack

## Цель

Убрать весь хардкод строковых литералов и магических чисел, заменив их на константы и enum'ы из `@axion/contracts` и `@axion/shared`.

---

## Проблемы и решения

### 1. HealthStatus enum не экспортируется из contracts

**Проблема:**

- `HealthStatus` определен в `proto/common/health.proto`
- Генерируется в TypeScript, но не экспортируется через `packages/contracts/src/index.ts`
- В `packages/contracts/src/types/enums.ts` определен только как type alias (не как значение)
- Используется хардкод строк `"HEALTH_STATUS_HEALTHY"` вместо enum

**Файлы для исправления:**

- `packages/contracts/src/index.ts` - добавить экспорт HealthStatus из generated
- Нужно проверить, генерируется ли HealthStatus как enum или только как type

**Использование хардкода найдено в:**

- `apps/graph-service/src/health/health.controller.ts` (строки 64, 71, 80, 89)
- `packages/shared/src/utils/health.ts` (строки 28, 42, 56, 79, 88, 100, 112)

---

### 2. Error codes используют строковые литералы вместо enum

**Проблема:**

- Есть `ErrorCode` enum в `packages/shared/src/errors/error-codes.ts`
- Но в `packages/contracts/src/utils/response.ts` используются строки напрямую: `"VALIDATION_ERROR"`, `"NOT_FOUND"`, `"FORBIDDEN"`
- Также в `packages/shared/src/utils/response-mappers.ts` используются строки: `"NOT_FOUND"`, `"INTERNAL_ERROR"`

**Решение:**

- Создать экспорт ErrorCode в `@axion/contracts` (или реэкспортировать из shared)
- Или создать константы для error codes в contracts
- Заменить все строковые литералы на константы

**Файлы для исправления:**

- `packages/contracts/src/utils/response.ts` (строки 76, 84, 91)
- `packages/shared/src/utils/response-mappers.ts` (строки 57, 93, 118, 149, 189, 229)

---

### 3. Status enum используется как строковые литералы

**Проблема:**

- `Status` enum экспортируется из `@axion/contracts`
- Но в `packages/contracts/src/utils/response.ts` используются строки: `"STATUS_SUCCESS"`, `"STATUS_ERROR"` в дефолтных значениях
- В `packages/shared/src/utils/response-mappers.ts` правильно используется `Status.STATUS_SUCCESS`

**Файлы для исправления:**

- `packages/contracts/src/utils/response.ts` (строки 19, 26, 35, 45)

---

### 4. Sort direction (ASC/DESC) - хардкод строк

**Проблема:**

- В `packages/shared/src/utils/nestjs-paginate-helpers.ts` используются строки `"ASC" | "DESC"` и хардкод `"DESC"`

**Решение:**

- Создать enum или константы для SortOrder
- Использовать константы вместо строк

**Файлы для исправления:**

- `packages/shared/src/utils/nestjs-paginate-helpers.ts` (строки 25, 62, 75)

---

### 5. Pagination defaults - хардкод чисел

**Проблема:**

- Хардкод чисел: `1`, `10`, `100` для page, defaultLimit, maxLimit
- Встречается в нескольких файлах

**Файлы для исправления:**

- `packages/shared/src/utils/pagination.ts` (строка 24: `1`, `10`)
- `packages/shared/src/utils/nestjs-paginate-helpers.ts` (строки 33, 34, 63, 64, 76, 77)
- `packages/database/src/repositories/pagination.helpers.ts` (строки 29, 30)

**Решение:**

- Создать константы: `DEFAULT_PAGE = 1`, `DEFAULT_LIMIT = 10`, `MAX_LIMIT = 100`
- Разместить в `@axion/contracts` или `@axion/shared`

---

### 6. SSE Event Types - использовать enum вместо констант

**Проблема:**

- В `apps/graph-service/src/graph/types/sse-events.ts` используются константы `as const`
- Хотя это не критично, лучше использовать enum для консистентности

**Файлы для проверки:**

- `apps/graph-service/src/graph/types/sse-events.ts`

### 7. ContractErrorType - хардкод строк

**Проблема:**

- В `packages/contracts/src/validation/validation.ts` используются строковые литералы:
  - `"CONTRACT_ERROR_TYPE_MISSING_CONTRACT"`
  - `"CONTRACT_ERROR_TYPE_TYPE_MISMATCH"`
  - `"CONTRACT_ERROR_TYPE_MISSING_IMPLEMENTATION"`

**Файлы для исправления:**

- `packages/contracts/src/validation/validation.ts` (строки 20, 31, 53, 62)

**Решение:**

- Проверить, генерируется ли ContractErrorType как enum из proto
- Если да - использовать enum, если нет - создать константы

---

### 8. Health check message pattern - хардкод строки

**Проблема:**

- В `apps/graph-service/src/health/health.controller.ts` используется `"graph-service.healthCheck"`

**Файлы для исправления:**

- `apps/graph-service/src/health/health.controller.ts` (строка 52)

**Решение:**

- Проверить, есть ли константы для health check patterns в contracts
- Если нет - можно оставить как есть (это message pattern, не enum значение)

---

## Детальный план исправлений

### Этап 1: Добавить недостающие экспорты и константы

#### 1.1. Экспортировать HealthStatus из contracts

**Файл:** `packages/contracts/src/index.ts`

- Добавить экспорт: `export { HealthStatus } from "../generated/common/health";`

#### 1.2. Создать константы для error codes

**Файл:** `packages/contracts/src/constants/error-codes.ts` (новый)

- Экспортировать ErrorCode из shared или создать константы
- Или создать `ERROR_CODES` объект с константами

#### 1.3. Создать константы для сортировки

**Файл:** `packages/contracts/src/constants/sorting.ts` (новый)

```typescript
export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}
```

#### 1.4. Создать константы для пагинации

**Файл:** `packages/contracts/src/constants/pagination.ts` (новый)

```typescript
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
```

### Этап 2: Исправить использование HealthStatus

#### 2.1. Health controller

**Файл:** `apps/graph-service/src/health/health.controller.ts`

- Импортировать `HealthStatus` из `@axion/contracts`
- Заменить строки на `HealthStatus.HEALTH_STATUS_HEALTHY` и т.д.

#### 2.2. Health utils

**Файл:** `packages/shared/src/utils/health.ts`

- Заменить все строковые литералы на `HealthStatus` enum
- Использовать `HealthStatus.HEALTH_STATUS_HEALTHY` вместо `"HEALTH_STATUS_HEALTHY"`

### Этап 3: Исправить использование Error codes

#### 3.1. Response utils в contracts

**Файл:** `packages/contracts/src/utils/response.ts`

- Импортировать ErrorCode (или константы)
- Заменить строки на константы

#### 3.2. Response mappers в shared

**Файл:** `packages/shared/src/utils/response-mappers.ts`

- Заменить все хардкод строк error codes на ErrorCode enum

### Этап 4: Исправить использование Status enum

#### 4.1. Response utils

**Файл:** `packages/contracts/src/utils/response.ts`

- Использовать `Status.STATUS_SUCCESS` вместо `"STATUS_SUCCESS"`
- Использовать `Status.STATUS_ERROR` вместо `"STATUS_ERROR"`

### Этап 5: Исправить сортировку

#### 5.1. NestJS paginate helpers

**Файл:** `packages/shared/src/utils/nestjs-paginate-helpers.ts`

- Импортировать `SortOrder` enum
- Использовать `SortOrder.DESC` вместо `"DESC"`

### Этап 6: Исправить пагинацию

#### 6.1. Pagination utils

**Файл:** `packages/shared/src/utils/pagination.ts`

- Импортировать `PAGINATION_DEFAULTS`
- Использовать константы вместо чисел

#### 6.2. NestJS paginate helpers

**Файл:** `packages/shared/src/utils/nestjs-paginate-helpers.ts`

- Использовать `PAGINATION_DEFAULTS` константы

#### 6.3. Repository pagination helpers

**Файл:** `packages/database/src/repositories/pagination.helpers.ts`

- Использовать `PAGINATION_DEFAULTS` константы

---

## Проверка всех файлов

После исправлений нужно проверить все файлы на наличие хардкода:

```bash
# Поиск строковых литералов для статусов
grep -r "STATUS_" apps/ packages/ --include="*.ts" | grep -v "Status\."

# Поиск строковых литералов для error codes
grep -r "\"(VALIDATION_ERROR|NOT_FOUND|FORBIDDEN|INTERNAL_ERROR)\"" apps/ packages/ --include="*.ts"

# Поиск хардкод ASC/DESC
grep -r "\"(ASC|DESC)\"" apps/ packages/ --include="*.ts"

# Поиск магических чисел для пагинации
grep -r "page.*=.*1\|limit.*=.*10\|maxLimit.*=.*100" apps/ packages/ --include="*.ts"
```

---

## Порядок выполнения

1. ✅ Создать константы и enum'ы (Этап 1)
2. ✅ Исправить HealthStatus (Этап 2)
3. ✅ Исправить Error codes (Этап 3)
4. ✅ Исправить Status enum (Этап 4)
5. ✅ Исправить сортировку (Этап 5)
6. ✅ Исправить пагинацию (Этап 6)
7. ✅ Провести финальную проверку всех файлов
8. ✅ Обновить документацию

---

## Чеклист после завершения

- [x] Все HealthStatus значения используют enum
- [x] Все error codes используют константы/enum
- [x] Все Status значения используют enum
- [x] Все сортировки используют SortOrder enum
- [x] Все пагинационные дефолты используют константы
- [x] `bun type-check` проходит успешно
- [ ] `bun lint` проходит успешно (требуется проверка)
- [x] Нет хардкод строковых литералов для enum значений
- [x] Нет магических чисел для пагинации

## Выполненные изменения

### 1. Созданы новые константы и экспорты

- ✅ Добавлен экспорт `HealthStatus` из `@axion/contracts`
- ✅ Создан `packages/contracts/src/constants/error-codes.ts` - реэкспорт ErrorCode из shared
- ✅ Создан `packages/contracts/src/constants/sorting.ts` - SortOrder enum
- ✅ Создан `packages/contracts/src/constants/pagination.ts` - PAGINATION_DEFAULTS
- ✅ Добавлен экспорт `ContractErrorType` из `@axion/contracts`

### 2. Исправлены файлы с использованием новых констант

- ✅ `packages/contracts/src/utils/response.ts` - использует Status enum и ErrorCode
- ✅ `packages/shared/src/utils/health.ts` - использует HealthStatus enum
- ✅ `apps/graph-service/src/health/health.controller.ts` - использует HealthStatus enum
- ✅ `packages/shared/src/utils/response-mappers.ts` - использует ErrorCode
- ✅ `packages/shared/src/utils/nestjs-paginate-helpers.ts` - использует SortOrder и PAGINATION_DEFAULTS
- ✅ `packages/shared/src/utils/pagination.ts` - использует PAGINATION_DEFAULTS
- ✅ `packages/database/src/repositories/pagination.helpers.ts` - использует PAGINATION_DEFAULTS
- ✅ `packages/database/src/repositories/base.repository.ts` - использует PAGINATION_DEFAULTS
- ✅ `packages/contracts/src/validation/validation.ts` - использует ContractErrorType enum

### 3. Зависимости

- ✅ Добавлена зависимость `@axion/database` в `@axion/shared`
- ✅ Добавлена зависимость `@axion/shared` в `@axion/database` (для разрешения циклической зависимости)
