# Codegen Service

NestJS микросервис для генерации кода из графов в Axion Control Plane.

## Описание

Codegen Service предоставляет функциональность для:

- **Code Generation** - генерация кода из графов проектов
- **Validation** - валидация сгенерированного кода (structural, contract, TypeScript, build, health check, contract discovery)
- **Blueprints** - управление шаблонами для генерации кода
- **Contract Discovery** - обнаружение и валидация Protobuf контрактов

## Структура

```
apps/codegen-service/
├── src/
│   ├── database/
│   │   ├── schema.ts          # Drizzle schema (blueprints, generation_history, validation_results)
│   │   ├── connection.ts       # Database connection
│   │   └── index.ts
│   ├── codegen/
│   │   ├── codegen.module.ts
│   │   ├── codegen.controller.ts # MessagePattern handlers
│   │   ├── codegen.service.ts     # Main coordinator service
│   │   ├── services/               # Specialized services
│   │   │   ├── blueprints.service.ts
│   │   │   ├── generation.service.ts
│   │   │   ├── validation.service.ts
│   │   │   └── contract-discovery.service.ts
│   │   └── repositories/           # Repository pattern для работы с БД
│   │       ├── blueprint.repository.ts
│   │       ├── generation-history.repository.ts
│   │       └── validation-result.repository.ts
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts
│   ├── app.module.ts
│   └── main.ts                  # Main entry point
├── drizzle/                    # Миграции (генерируются)
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

## Установка

```bash
cd apps/codegen-service
bun install
```

## Настройка

### Запуск инфраструктуры (Docker Compose)

Для локальной разработки используйте docker-compose для запуска всей необходимой инфраструктуры:

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes (очистка данных)
docker-compose down -v
```

**Доступные сервисы:**

- **PostgreSQL** - `localhost:5434` (БД: `axion_codegen`, User: `axion`, Password: `axion_password`)
- **KeyDB** - `localhost:6379` (Password: `axion_keydb_password`) - кэш/временные данные/очереди (BullMQ)
- **Kafka** - `localhost:9092` - Event Bus для CQRS и Event Sourcing
- **Traefik** - `localhost:80` - edge routing (HTTP/WebSocket)
  - Dashboard: http://localhost:8080

**Примечание:** Все микросервисы общаются через Kafka. Генерируемые сервисы клиентов используют HTTP RPC через внутренний IP Docker Swarm.

### Переменные окружения

Создайте `.env` файл на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните переменные:

- `DATABASE_URL` - PostgreSQL connection string (отдельная БД для codegen-service)
- `REDIS_URL` - KeyDB connection string (кэш/очереди/временные данные)
- `KAFKA_BROKERS` - Kafka brokers (для Event Bus, CQRS и Event Sourcing)
- `PORT` - HTTP server port (по умолчанию: 3002)
- `OPENROUTER_API_KEY` - OpenRouter API key для AI генерации кода (получить на https://openrouter.ai/keys)
- `OPENROUTER_DEFAULT_MODEL` - Модель для генерации (по умолчанию: `anthropic/claude-3.5-sonnet`)

## Миграции

### Генерация миграций

```bash
bun run migrate:generate
```

### Применение миграций

```bash
# Применить миграции
bun run migrate

# Push schema (только для разработки)
bun run migrate:push
```

## Разработка

### Запуск в режиме разработки

```bash
bun run dev
```

Сервис будет автоматически перезапускаться при изменении файлов.

### Сборка

```bash
bun run build
```

### Проверка типов

```bash
bun run type-check
```

### Линтинг

```bash
bun run lint
bun run lint:fix
```

## API

### MessagePattern (Kafka)

Все методы используют Kafka MessagePattern формат: `codegen-service.{action}`

#### Generation

- `codegen-service.generateProject` - генерация кода для всего проекта
- `codegen-service.generateService` - генерация кода для конкретного сервиса

#### Validation

- `codegen-service.validateProject` - валидация всех сервисов проекта
- `codegen-service.validateService` - валидация конкретного сервиса

#### Blueprints

- `codegen-service.listBlueprints` - список всех blueprints
- `codegen-service.getBlueprint` - получение blueprint по ID

#### Contract Discovery

- `codegen-service.discoverContracts` - обнаружение контрактов в проекте
- `codegen-service.validateContracts` - валидация контрактов

## Архитектура

### Слои

1. **Controller** - обработка MessagePattern запросов из Kafka
2. **Service** - бизнес-логика (координатор + специализированные сервисы)
3. **Repository** - работа с базой данных
4. **Database** - Drizzle ORM schema

### Интеграция с другими сервисами

Codegen Service взаимодействует с:

- **Graph Service** - получение графов проектов через Kafka
- **Deployment Service** (планируется) - деплой сгенерированного кода

### Валидация

Валидация выполняется на 6 уровнях:

1. **Structural** - проверка структуры файлов
2. **Contract** - проверка Protobuf контрактов
3. **TypeScript** - `tsc --noEmit`
4. **Build** - `bun run build`
5. **Health Check** - проверка health endpoint
6. **Contract Discovery** - валидация при запуске

## База данных

### Таблицы

- `blueprints` - шаблоны для генерации кода
- `generation_history` - история генераций
- `validation_results` - результаты валидации

### Схема

См. `src/database/schema.ts` для полной схемы базы данных.

## Зависимости

- **@axion/contracts** - Protobuf контракты и типы
- **@axion/shared** - общие утилиты (BaseService, error handling)
- **@axion/database** - database utilities (BaseRepository)
- **@axion/nestjs-common** - NestJS утилиты (AuthModule, HealthModule, bootstrap)
- **@nestjs/microservices** - Kafka microservices
- **drizzle-orm** - ORM для работы с PostgreSQL

## OpenRouter Integration

Codegen Service использует OpenRouter для AI-powered генерации кода.

### Настройка

1. Создайте аккаунт на [OpenRouter](https://openrouter.ai/)
2. Сгенерируйте API ключ на [странице ключей](https://openrouter.ai/keys)
3. Добавьте ключ в `.env`:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### Выбор модели AI

Вы можете выбрать **любую модель** из [OpenRouter](https://openrouter.ai/models) для каждого запроса:

```typescript
// Через Kafka MessagePattern
import { type GenerateProjectRequest } from "@axion/contracts";

const requestWithModel: GenerateProjectRequest = {
  metadata: { userId: "user-id" },
  projectId: "project-id",
  aiModel: "openai/gpt-4o", // ✅ Любая модель из OpenRouter
  forceRegenerate: false,
};

await client.send(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT, requestWithModel);

// Или используйте модель по умолчанию (не указывая aiModel)
const requestDefaultModel: GenerateProjectRequest = {
  metadata: { userId: "user-id" },
  projectId: "project-id",
  // aiModel не указан - будет использована OPENROUTER_DEFAULT_MODEL
  forceRegenerate: false,
};

await client.send(
  CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT,
  requestDefaultModel
);
```

### Рекомендуемые модели

**🌟 Для production:**

- `anthropic/claude-3.5-sonnet` (по умолчанию) - баланс качества/скорости
- `openai/gpt-4o` - новейшая мультимодальная модель
- `openai/gpt-4-turbo` - быстрая и качественная

**🔥 Максимальное качество:**

- `anthropic/claude-3-opus` - для сложных сервисов
- `openai/o1-preview` - продвинутое reasoning

**💰 Бюджетные:**

- `google/gemini-pro-1.5` - быстрый и дешевый
- `anthropic/claude-3-haiku` - простые CRUD сервисы
- `deepseek/deepseek-chat` - максимально дешевая

**🌐 Open Source:**

- `meta-llama/llama-3.3-70b-instruct` - от Meta
- `mistralai/mistral-large` - европейская модель

**Полный список:** [openrouter.ai/models](https://openrouter.ai/models)

### Функциональность

- **Code Generation**: AI генерирует полный код микросервиса на основе графа
- **Code Validation**: AI проверяет сгенерированный код на соответствие стандартам
- **Contract Discovery**: AI извлекает MessagePattern контракты из кода
- **Contract Validation**: AI проверяет корректность контрактов

## Completed Features

- ✅ Базовая структура сервиса с NestJS
- ✅ Интеграция с Kafka через @nestjs/microservices
- ✅ Drizzle ORM с PostgreSQL
- ✅ Repository Pattern для работы с БД
- ✅ Интеграция с OpenRouter для AI-генерации
- ✅ AI-powered code generation
- ✅ AI-powered code validation
- ✅ AI-powered contract discovery
- ✅ Blueprint management
- ✅ Generation history tracking

## TODO

- [ ] Сохранение сгенерированных файлов на диск/S3
- [ ] Интеграция с Template Engine для кастомизации
- [ ] Реальная валидация TypeScript (запуск tsc)
- [ ] Реальная валидация Build (запуск bun build)
- [ ] Health Check тестирование сгенерированных сервисов
- [ ] Интеграция с Deployment Service

## См. также

- [OpenRouter Integration](../../docs/OPENROUTER_INTEGRATION.md) - Полная документация по AI интеграции
- [AI Model Selection](../../docs/AI_MODEL_SELECTION.md) - Гайд по выбору модели
- [OpenRouter Models](https://openrouter.ai/models) - Каталог всех моделей
- [Graph Service](../graph-service/README.md) - управление графами
- [Microservice Template](../../docs/MICROSERVICE_TEMPLATE.md) - шаблон для создания микросервисов
- [Architecture](../../docs/ARCHITECTURE.md) - общая архитектура системы
