# OpenRouter Integration - Codegen Service

Документация по интеграции OpenRouter AI для генерации кода в Codegen Service.

## Обзор

Codegen Service использует OpenRouter для AI-powered генерации кода микросервисов на основе графов из Graph Service.

## Компоненты

### 1. OpenRouterService (`openrouter.service.ts`)

Основной сервис для взаимодействия с OpenRouter API.

**Возможности:**

- Инициализация OpenRouter SDK клиента
- Non-streaming completions (полный ответ)
- Streaming completions (потоковая передача)
- Тестирование подключения

**Методы:**

- `complete(prompt, options)` - получить полный ответ от AI
- `completeStreaming(prompt, onChunk, options)` - потоковая генерация
- `testConnection()` - проверка работоспособности

**Конфигурация:**

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

### 2. PromptBuilderService (`prompt-builder.service.ts`)

Сервис для построения промптов из данных графа.

**Методы:**

- `buildSystemPrompt()` - системный промпт с правилами генерации
- `buildServiceGenerationPrompt(node, graph, projectName)` - промпт для генерации сервиса
- `buildValidationPrompt(serviceName, files)` - промпт для валидации кода
- `buildContractDiscoveryPrompt(serviceName, files)` - промпт для извлечения контрактов

**Особенности:**

- Извлекает зависимости из графа
- Форматирует данные ноды для AI
- Создает структурированные промпты

### 3. GenerationService (обновлен)

Основной сервис генерации с интеграцией OpenRouter.

**Workflow:**

1. Получает граф из Graph Service через Kafka
2. Для каждого service node строит промпт
3. Вызывает OpenRouter для генерации кода
4. Парсит JSON ответ с файлами
5. Сохраняет результат в generation_history
6. Возвращает статус генерации

**Обработка ошибок:**

- Ловит ошибки парсинга JSON
- Сохраняет ошибки в generation_history
- Логирует все этапы процесса

### 4. ValidationService (обновлен)

Сервис валидации с AI-powered проверкой.

**Workflow:**

1. Получает сгенерированный код (в production - читает файлы)
2. Строит промпт для валидации
3. Вызывает OpenRouter для проверки
4. Парсит результаты валидации
5. Обновляет validation_results с детальными результатами

**Уровни валидации:**

- Structural - структура файлов
- Contract - соответствие контрактам
- TypeScript - корректность типов
- Build - возможность сборки
- Health Check - наличие health endpoint
- Contract Discovery - правильные MessagePatterns

### 5. ContractDiscoveryService (обновлен)

Сервис для обнаружения и валидации контрактов.

**Методы:**

- `discover(request)` - извлечение контрактов из кода
- `validate(request)` - проверка корректности контрактов

## Модели OpenRouter

OpenRouter предоставляет доступ к **300+ моделям** от разных провайдеров. Вы можете использовать любую модель из [каталога](https://openrouter.ai/models).

### Топ моделей для генерации кода

#### 🌟 Production-ready (рекомендуемые)

1. **anthropic/claude-3.5-sonnet** (по умолчанию)
   - ✅ Баланс качества и скорости
   - ✅ Отличное понимание TypeScript и NestJS
   - 💰 $3/$15 per 1M tokens
   - 📝 Context: 200K tokens
   - 🎯 Use case: Универсальная генерация

2. **openai/gpt-4o**
   - ✅ Новейшая мультимодальная модель
   - ✅ Быстрая и качественная
   - 💰 $5/$15 per 1M tokens
   - 📝 Context: 128K tokens
   - 🎯 Use case: Современные сервисы

3. **openai/gpt-4-turbo**
   - ✅ Проверенное качество
   - ✅ Быстрая генерация
   - 💰 $10/$30 per 1M tokens
   - 📝 Context: 128K tokens
   - 🎯 Use case: Универсальная генерация

#### 🔥 Максимальное качество

4. **anthropic/claude-3-opus**
   - 🏆 Лучшая модель для сложных задач
   - 🧠 Глубокое понимание архитектуры
   - 💰 $15/$75 per 1M tokens
   - 📝 Context: 200K tokens
   - 🎯 Use case: Сложные сервисы с бизнес-логикой

5. **openai/o1-preview**
   - 🧠 Продвинутое reasoning
   - 🔍 Глубокий анализ требований
   - 💰 $15/$60 per 1M tokens
   - 📝 Context: 128K tokens
   - 🎯 Use case: Архитектурно сложные системы

#### 💰 Бюджетные варианты

6. **google/gemini-pro-1.5**
   - 💵 Очень дешевая
   - ⚡ Быстрая генерация
   - 💰 $0.35/$1.05 per 1M tokens
   - 📝 Context: 1M tokens (!огромный context!)
   - 🎯 Use case: Простые CRUD сервисы

7. **anthropic/claude-3-haiku**
   - 💸 Дешевая от Anthropic
   - ⚡ Быстрая
   - 💰 $0.25/$1.25 per 1M tokens
   - 📝 Context: 200K tokens
   - 🎯 Use case: Простые сервисы

8. **deepseek/deepseek-chat**
   - 💸 Максимально дешевая
   - 🌐 Альтернатива западным моделям
   - 💰 $0.14/$0.28 per 1M tokens
   - 📝 Context: 64K tokens
   - 🎯 Use case: Базовая генерация

#### 🌐 Open Source

9. **meta-llama/llama-3.3-70b-instruct**
   - 🆓 Open source от Meta
   - 🤝 Поддержка сообщества
   - 💰 $0.55/$0.80 per 1M tokens
   - 📝 Context: 131K tokens
   - 🎯 Use case: Open source альтернатива

10. **mistralai/mistral-large**
    - 🇪🇺 Европейская модель
    - 🔒 GDPR compliant
    - 💰 $2/$6 per 1M tokens
    - 📝 Context: 128K tokens
    - 🎯 Use case: Европейский compliance

### Как выбрать модель

**Сложность проекта:**

- Простой CRUD → `gemini-pro-1.5`, `claude-3-haiku`
- Средней сложности → `claude-3.5-sonnet`, `gpt-4o`
- Сложный с бизнес-логикой → `claude-3-opus`, `o1-preview`

**Бюджет:**

- Тестирование/разработка → `deepseek-chat`, `gemini-pro-1.5`
- Production → `claude-3.5-sonnet`, `gpt-4o`
- Критичные сервисы → `claude-3-opus`

**Скорость:**

- Быстрая генерация → `gpt-4o`, `claude-3-haiku`, `gemini-pro-1.5`
- Баланс → `claude-3.5-sonnet`, `gpt-4-turbo`
- Качество важнее → `claude-3-opus`, `o1-preview`

### Полный список

Все доступные модели: [openrouter.ai/models](https://openrouter.ai/models)

Модели постоянно добавляются - проверяйте актуальный список на сайте OpenRouter.

### Параметры генерации

```typescript
{
  temperature: 0.2,    // Низкая для детерминистичности
  maxTokens: 16000,    // Достаточно для полного сервиса
  model: "anthropic/claude-3.5-sonnet"
}
```

## Структура AI ответа

### Code Generation

AI должен возвращать JSON:

```json
{
  "files": [
    {
      "path": "src/service/service.service.ts",
      "content": "// TypeScript code here"
    },
    {
      "path": "src/service/service.controller.ts",
      "content": "// TypeScript code here"
    }
  ]
}
```

### Code Validation

AI должен возвращать JSON:

```json
{
  "structuralPassed": true,
  "contractPassed": true,
  "typescriptPassed": true,
  "buildPassed": true,
  "healthCheckPassed": true,
  "contractDiscoveryPassed": true,
  "errors": [
    {
      "level": "structural",
      "message": "Missing main.ts file",
      "file": "src/main.ts",
      "line": 0
    }
  ],
  "warnings": []
}
```

### Contract Discovery

AI должен возвращать JSON:

```json
{
  "contracts": [
    {
      "pattern": "service-name.create",
      "type": "request",
      "requestType": "CreateRequest",
      "responseType": "CreateResponse",
      "description": "Creates a new entity"
    }
  ]
}
```

## Настройка

### 1. Получение API ключа

1. Зарегистрируйтесь на [openrouter.ai](https://openrouter.ai)
2. Перейдите в [Keys](https://openrouter.ai/keys)
3. Создайте новый ключ
4. Скопируйте ключ

### 2. Настройка .env

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Optional (defaults)
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

### 3. Тестирование

```bash
# Запустить сервис
cd apps/codegen-service
bun run dev

# Проверить логи на наличие:
# "OpenRouter service initialized with model: anthropic/claude-3.5-sonnet"
```

## Использование

### Выбор модели AI

Вы можете выбрать **любую модель** из [OpenRouter](https://openrouter.ai/models) для каждого запроса:

```typescript
// Generate project с выбором модели
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  aiModel: "openai/gpt-4o", // ✅ Любая модель из OpenRouter
  forceRegenerate: false,
});

// Generate service с другой моделью
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_SERVICE, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  nodeId: "node-id",
  aiModel: "anthropic/claude-3-opus", // ✅ Выбор модели
  forceRegenerate: true,
});

// Validation с бюджетной моделью
await client.send(CODEGEN_SERVICE_PATTERNS.VALIDATE_PROJECT, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  aiModel: "google/gemini-pro-1.5", // ✅ Быстрая и дешевая
});

// Или используйте модель по умолчанию (не указывая aiModel)
await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT, {
  metadata: { user_id: "user-id" },
  projectId: "project-id",
  // aiModel не указан - будет использована OPENROUTER_DEFAULT_MODEL
  forceRegenerate: false,
});
```

### Популярные модели для разных задач

**Генерация сложных сервисов:**

- `anthropic/claude-3-opus` - максимальное качество
- `openai/o1-preview` - продвинутое reasoning
- `anthropic/claude-3.5-sonnet` - баланс качества/скорости

**Быстрая генерация CRUD:**

- `openai/gpt-4o` - быстрая и качественная
- `anthropic/claude-3-haiku` - простая и дешевая
- `google/gemini-pro-1.5` - бюджетный вариант

**Валидация кода:**

- `anthropic/claude-3.5-sonnet` - точная проверка
- `openai/gpt-4-turbo` - быстрая валидация
- `google/gemini-pro-1.5` - бюджетная проверка

**Полный список моделей:** [openrouter.ai/models](https://openrouter.ai/models)

## Логирование

Все этапы AI генерации логируются:

```
[OpenRouterService] OpenRouter service initialized with model: anthropic/claude-3.5-sonnet
[GenerationService] Generating code for service: my-service
[OpenRouterService] Sending completion request to model: anthropic/claude-3.5-sonnet
[OpenRouterService] Received completion response (12345 characters)
[GenerationService] Code generation successful for my-service (15 files)
```

## Стоимость

Примерная стоимость на OpenRouter (может меняться):

| Модель            | Input (1M tokens) | Output (1M tokens) |
| ----------------- | ----------------- | ------------------ |
| Claude 3.5 Sonnet | $3                | $15                |
| Claude 3 Opus     | $15               | $75                |
| GPT-4 Turbo       | $10               | $30                |
| Gemini Pro 1.5    | $0.35             | $1.05              |

**Средняя генерация сервиса:**

- Input: ~2000 tokens (граф + промпт)
- Output: ~8000 tokens (полный код сервиса)
- Стоимость с Claude 3.5 Sonnet: ~$0.12

## Ограничения и будущие улучшения

### Текущие ограничения

1. Mock-данные для файлов в валидации (нужна интеграция с file storage)
2. Нет сохранения сгенерированных файлов на диск/S3
3. Нет кеширования промптов и ответов
4. Нет retry механизма при сбоях API

### Планируемые улучшения

- [ ] Интеграция с S3/MinIO для хранения файлов
- [ ] Redis кеширование для повторных запросов
- [ ] Retry механизм с exponential backoff
- [ ] Streaming генерация для realtime feedback
- [ ] Multi-step генерация (сначала структура, потом код)
- [ ] Fine-tuning промптов на основе feedback
- [ ] Cost tracking и лимиты

## Troubleshooting

### Error: OPENROUTER_API_KEY is not configured

**Решение:** Добавьте ключ в `.env` файл:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Error: Failed to parse AI response format

**Причины:**

- AI вернул не JSON
- JSON невалидный
- Неправильная структура ответа

**Решение:** Проверьте логи, скорректируйте промпт

### Error: No content in OpenRouter response

**Причины:**

- API ограничения (rate limit)
- Недостаточно токенов в аккаунте
- Модель недоступна

**Решение:** Проверьте баланс на openrouter.ai

## См. также

- [AI Model Selection Guide](./AI_MODEL_SELECTION.md) - Гайд по выбору модели
- [OpenRouter Documentation](https://openrouter.ai/docs) - Официальная документация
- [OpenRouter Models](https://openrouter.ai/models) - Каталог всех моделей
- [Codegen Service README](../apps/codegen-service/README.md) - Общая документация
- [Microservice Template](./MICROSERVICE_TEMPLATE.md) - Шаблон микросервиса
