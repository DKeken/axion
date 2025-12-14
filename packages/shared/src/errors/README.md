# Unified Error Handling System

Минималистичная, переиспользуемая система обработки ошибок для Axion Stack.

## Принципы

- **Минимализм** - только необходимые компоненты
- **Автоматическая классификация** - ошибки автоматически классифицируются по типу
- **Переиспользуемость** - одна функция для всех случаев
- **Типобезопасность** - полная поддержка TypeScript

## Использование

### Базовое использование

```typescript
import { handleServiceError } from "@axion/shared";

try {
  // ваша операция
  const project = await this.repository.create(data);
  return createSuccessResponse(project);
} catch (error) {
  return handleServiceError(this.logger, "creating project", error);
}
```

### С контекстом

```typescript
try {
  const project = await this.repository.findById(id);
  if (!project) {
    return createErrorResponse(createNotFoundError("Project", id));
  }
  // ...
} catch (error) {
  return handleServiceError(this.logger, "getting project", error, {
    resourceType: "Project",
    resourceId: id,
    userId: context.userId,
  });
}
```

## Что делает `handleServiceError`

1. **Классифицирует ошибку** - автоматически определяет тип ошибки
   - Database errors (PostgreSQL/Drizzle) → `DatabaseError` или `ValidationError`
   - Validation patterns → `ValidationError`
   - Not found patterns → `NotFoundError`
   - Forbidden patterns → `ForbiddenError`
   - Остальное → `InternalError`

2. **Логирует ошибку** - с правильным уровнем логирования
   - Validation/NotFound → warn/debug
   - Internal/Database → error

3. **Конвертирует в contract response** - преобразует в Protobuf-compatible формат

## Error Codes

Минимальный набор кодов ошибок:

- `VALIDATION_ERROR` - ошибки валидации
- `UNAUTHORIZED` - не авторизован
- `FORBIDDEN` - нет доступа
- `NOT_FOUND` - ресурс не найден
- `CONFLICT` - конфликт
- `DATABASE_ERROR` - ошибка БД
- `INTERNAL_ERROR` - внутренняя ошибка
- `EXTERNAL_SERVICE_ERROR` - ошибка внешнего сервиса
- `RATE_LIMIT_EXCEEDED` - превышен лимит запросов

## Error Classes

Используйте напрямую только если нужно:

```typescript
import { ValidationError, NotFoundError } from "@axion/shared";

if (!data) {
  throw new ValidationError("Data is required", "data");
}

if (!project) {
  throw new NotFoundError("Project", projectId);
}
```

Но обычно достаточно `handleServiceError` - он сам классифицирует ошибки.

## Database Error Handling

Database errors автоматически классифицируются:
- Unique violation → `ValidationError`
- Foreign key violation → `ValidationError`
- Not null violation → `ValidationError`
- Connection errors → `DatabaseError`

## Best Practices

1. **Всегда используйте `handleServiceError` в catch блоках**
2. **Передавайте контекст для лучшего логирования**
3. **Не обрабатывайте ошибки вручную** - пусть система их классифицирует
4. **Не делайте маппинг данных** - отправляйте данные из repository напрямую

