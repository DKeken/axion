# Проверка соответствия контрактам Protobuf

## Критические проверки

### 1. Структура ответов

**Контракт ожидает:**
- `ProjectResponse`: `{ status, error?, project? }` (oneof)
- `ListProjectsResponse`: `{ status, error?, data?: { projects, pagination } }`
- `GraphResponse`: `{ status, error?, graph? }`
- `ListGraphVersionsResponse`: `{ status, error?, data?: { versions, pagination } }`
- `ServiceResponse`: `{ status, error?, service? }`
- `ListServicesResponse`: `{ status, error?, data?: { services, pagination } }`

**Текущая реализация:**
- `createSuccessResponse()` возвращает: `{ status, result: { data } }`

**Проблема:** Структура не соответствует контрактам!

**Решение:** NestJS Kafka microservices может автоматически преобразовывать структуру при сериализации в Protobuf. Нужно проверить реальное поведение или использовать правильные helper функции.

### 2. Преобразование типов

**Проблемы:**
1. `Date` -> `number` (timestamp) - нужно преобразование
2. `status: string` (DB) -> `status: ServiceStatus` (enum number) - нужно преобразование
3. Поля уже в camelCase благодаря ts-proto - это ОК

**Решение:** Использовать маппинг функции из `entity-to-contract.ts`

### 3. Пагинация

**Контракт:** `Pagination { page, limit, total, total_pages }`

**Проверка:** ✅ Используется `createFullPagination()` - корректно

## Чеклист проверки

### ProjectsService
- [ ] `create()` - возвращает `ProjectResponse` с правильной структурой
- [ ] `get()` - возвращает `ProjectResponse` с правильной структурой
- [ ] `update()` - возвращает `ProjectResponse` с правильной структурой
- [ ] `delete()` - возвращает `Empty` или правильный формат
- [ ] `list()` - возвращает `ListProjectsResponse` с `{ projects, pagination }`
- [ ] Все `Date` поля преобразованы в `number` (timestamp)
- [ ] Все поля соответствуют контракту

### GraphOperationsService
- [ ] `get()` - возвращает `GraphResponse` с `graph` полем
- [ ] `update()` - возвращает `GraphResponse` с `graph` полем
- [ ] `listVersions()` - возвращает `ListGraphVersionsResponse` с `{ versions, pagination }`
- [ ] `revertVersion()` - возвращает `GraphResponse` с `graph` полем
- [ ] `Date` поля преобразованы в `number`

### GraphServicesService
- [ ] `list()` - возвращает `ListServicesResponse` с `{ services, pagination }`
- [ ] `get()` - возвращает `ServiceResponse` с `service` полем
- [ ] `status` преобразован из string в ServiceStatus enum
- [ ] `Date` поля преобразованы в `number`
