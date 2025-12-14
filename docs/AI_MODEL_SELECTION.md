# Выбор AI модели в Codegen Service

Гайд по выбору оптимальной модели OpenRouter для генерации кода.

## Быстрый старт

### Использование модели по умолчанию

Просто не указывайте `aiModel` в запросе:

```typescript
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  forceRegenerate: false,
  // aiModel не указан - используется OPENROUTER_DEFAULT_MODEL
});
```

### Выбор конкретной модели

Укажите `aiModel` для переопределения:

```typescript
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  aiModel: "openai/gpt-4o", // ✅ Любая модель из openrouter.ai/models
  forceRegenerate: false,
});
```

## Матрица выбора модели

### По сложности проекта

| Сложность        | Рекомендуемая модель          | Альтернативы                                         |
| ---------------- | ----------------------------- | ---------------------------------------------------- |
| **Простой CRUD** | `google/gemini-pro-1.5`       | `anthropic/claude-3-haiku`, `deepseek/deepseek-chat` |
| **Средний**      | `anthropic/claude-3.5-sonnet` | `openai/gpt-4o`, `openai/gpt-4-turbo`                |
| **Сложный**      | `anthropic/claude-3-opus`     | `openai/o1-preview`, `anthropic/claude-3.5-sonnet`   |

### По бюджету

| Бюджет          | Модель                        | Стоимость (1M tokens in/out) |
| --------------- | ----------------------------- | ---------------------------- |
| **Минимальный** | `deepseek/deepseek-chat`      | $0.14 / $0.28                |
| **Низкий**      | `google/gemini-pro-1.5`       | $0.35 / $1.05                |
| **Средний**     | `anthropic/claude-3.5-sonnet` | $3 / $15                     |
| **Высокий**     | `anthropic/claude-3-opus`     | $15 / $75                    |

### По скорости

| Приоритет                 | Модель                        | Характеристика         |
| ------------------------- | ----------------------------- | ---------------------- |
| **Максимальная скорость** | `anthropic/claude-3-haiku`    | Самая быстрая          |
| **Быстрая**               | `openai/gpt-4o`               | Быстрая и качественная |
| **Баланс**                | `anthropic/claude-3.5-sonnet` | Оптимальный баланс     |
| **Качество важнее**       | `anthropic/claude-3-opus`     | Медленнее, но лучше    |

## Примеры использования

### Простой CRUD сервис

```typescript
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_SERVICE, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  nodeId: "users-service",
  aiModel: "google/gemini-pro-1.5", // Быстро и дешево
  forceRegenerate: false,
});
```

### Сложный бизнес-сервис

```typescript
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_SERVICE, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  nodeId: "payment-gateway",
  aiModel: "anthropic/claude-3-opus", // Максимальное качество
  forceRegenerate: false,
});
```

### Быстрая валидация

```typescript
await client.send(CODEGEN_SERVICE_PATTERNS.VALIDATE_PROJECT, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  aiModel: "anthropic/claude-3-haiku", // Быстрая проверка
});
```

### Разные модели для разных сервисов

```typescript
// Генерация всего проекта с дефолтной моделью
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  aiModel: "anthropic/claude-3.5-sonnet",
  forceRegenerate: false,
});

// Потом перегенерировать критичный сервис с лучшей моделью
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_SERVICE, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  nodeId: "auth-service",
  aiModel: "anthropic/claude-3-opus", // Upgrade для критичного сервиса
  forceRegenerate: true,
});
```

## Детальное сравнение топ-10 моделей

### 1. anthropic/claude-3.5-sonnet (Рекомендуется)

**Когда использовать:**

- ✅ Универсальная генерация любой сложности
- ✅ Production-ready код
- ✅ Баланс качества/скорости/стоимости

**Характеристики:**

- Context: 200K tokens
- Cost: $3/$15 per 1M tokens
- Speed: Средняя
- Quality: Отличное

**Не использовать когда:**

- ❌ Нужна максимальная скорость
- ❌ Очень ограниченный бюджет
- ❌ Очень простой CRUD

### 2. openai/gpt-4o

**Когда использовать:**

- ✅ Новейшие best practices
- ✅ Мультимодальные задачи
- ✅ Быстрая генерация

**Характеристики:**

- Context: 128K tokens
- Cost: $5/$15 per 1M tokens
- Speed: Быстрая
- Quality: Отличное

### 3. anthropic/claude-3-opus

**Когда использовать:**

- ✅ Сложная бизнес-логика
- ✅ Критичные сервисы
- ✅ Максимальное качество важнее стоимости

**Характеристики:**

- Context: 200K tokens
- Cost: $15/$75 per 1M tokens
- Speed: Медленная
- Quality: Лучшее

### 4. google/gemini-pro-1.5

**Когда использовать:**

- ✅ Простые CRUD сервисы
- ✅ Ограниченный бюджет
- ✅ Нужен огромный context (1M tokens!)

**Характеристики:**

- Context: 1M tokens (!)
- Cost: $0.35/$1.05 per 1M tokens
- Speed: Быстрая
- Quality: Хорошее

### 5. openai/o1-preview

**Когда использовать:**

- ✅ Архитектурно сложные системы
- ✅ Требуется глубокий анализ
- ✅ Продвинутое reasoning

**Характеристики:**

- Context: 128K tokens
- Cost: $15/$60 per 1M tokens
- Speed: Медленная
- Quality: Отличное для сложных задач

### 6-10. Другие модели

См. полную документацию: [OPENROUTER_INTEGRATION.md](./OPENROUTER_INTEGRATION.md)

## Практические советы

### 1. Начните с дефолта

Используйте `anthropic/claude-3.5-sonnet` для большинства задач:

```bash
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

### 2. Оптимизируйте по мере необходимости

- Простые сервисы → переключите на `gemini-pro-1.5`
- Критичные → переключите на `claude-3-opus`
- Быстрая итерация → используйте `gpt-4o`

### 3. Мониторьте стоимость

Средняя стоимость генерации одного сервиса:

| Модель              | Примерная стоимость |
| ------------------- | ------------------- |
| `deepseek-chat`     | ~$0.03              |
| `gemini-pro-1.5`    | ~$0.08              |
| `claude-3.5-sonnet` | ~$0.12              |
| `gpt-4o`            | ~$0.14              |
| `claude-3-opus`     | ~$0.60              |

### 4. Используйте разные модели для разных операций

```typescript
// Генерация - качество важно
aiModel: "anthropic/claude-3.5-sonnet";

// Валидация - можно дешевле
aiModel: "google/gemini-pro-1.5";

// Contract discovery - быстрая модель
aiModel: "anthropic/claude-3-haiku";
```

## Troubleshooting

### Модель не доступна

```
Error: Model not available
```

**Решение:** Проверьте список доступных моделей на [openrouter.ai/models](https://openrouter.ai/models)

### Качество генерации низкое

**Решение:** Попробуйте более мощную модель:

- `gemini-pro-1.5` → `claude-3.5-sonnet`
- `claude-3.5-sonnet` → `claude-3-opus`

### Слишком дорого

**Решение:** Используйте бюджетные модели:

- `claude-3-opus` → `claude-3.5-sonnet` (-80%)
- `claude-3.5-sonnet` → `gemini-pro-1.5` (-90%)
- `gemini-pro-1.5` → `deepseek-chat` (-60%)

### Слишком медленно

**Решение:** Используйте быстрые модели:

- `claude-3-opus` → `gpt-4o`
- `claude-3.5-sonnet` → `claude-3-haiku`
- Любая → `gemini-pro-1.5`

## Полный список моделей

Все 300+ моделей: [openrouter.ai/models](https://openrouter.ai/models)

## См. также

- [OpenRouter Integration](./OPENROUTER_INTEGRATION.md) - Полная документация
- [Codegen Service README](../apps/codegen-service/README.md) - Общая документация
- [OpenRouter Models](https://openrouter.ai/models) - Актуальный список моделей
