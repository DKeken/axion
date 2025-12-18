# Graph Service

NestJS микросервис для управления проектами и графами в Axion Control Plane.

## Описание

Graph Service предоставляет CRUD операции для:

- **Projects** - управление проектами пользователей
- **Graphs** - версионирование и управление графами (React Flow)
- **Services** - синхронизация сервисов из графа
- **Database Nodes** - управление database nodes

## Структура

```
apps/graph-service/
├── src/
│   ├── database/
│   │   ├── schema.ts          # Drizzle schema (projects, project_graph_versions, project_services, database_nodes)
│   │   ├── connection.ts       # Database connection
│   │   └── index.ts
│   ├── graph/
│   │   ├── graph.module.ts
│   │   ├── graph.controller.ts # MessagePattern handlers
│   │   ├── graph.service.ts     # Бизнес-логика
│   │   ├── services/            # Business logic services
│   │   │   ├── graph-sync.service.ts
│   │   │   └── ...
│   │   └── repositories/       # Repository pattern для работы с БД
│   │       ├── project.repository.ts
│   │       ├── graph.repository.ts
│   │       ├── service.repository.ts
│   │       └── database-node.repository.ts
│   ├── health/
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   └── health.service.ts
│   ├── app.module.ts
│   └── main.ts                  # Main entry point (API server + workers)
├── drizzle/                    # Миграции (генерируются)
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

## Установка

```bash
cd apps/graph-service
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

- **PostgreSQL** - `localhost:5432` (БД: `axion_control_plane`, User: `axion`, Password: `axion_password`)
- **Redis/KeyDB** - `localhost:6379` (Password: `axion_redis_password`) - кэш/временные данные/очереди (BullMQ)
- **Kafka** - `localhost:9092` - Event Bus для CQRS и Event Sourcing
- **Zookeeper** - `localhost:2181` - координация для Kafka
- **Traefik** - `localhost:80` - edge routing (HTTP/WebSocket)
  - Dashboard: http://localhost:8080

**Примечание:** RabbitMQ используется только в генерируемых сервисах клиентов (легковесный вариант). SaaS платформа использует Kafka для Event Bus.

### Переменные окружения

Создайте `.env` файл на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните переменные:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis/KeyDB connection string (кэш/очереди/временные данные)
- `KAFKA_BROKERS` - Kafka brokers (для Event Bus, CQRS и Event Sourcing)

## Миграции

Генерация миграций:

```bash
bun run migrate:generate
```

Применение миграций:

```bash
bun run migrate
```

Push схемы в БД (для разработки):

```bash
bun run migrate:push
```

## Запуск

### Development

```bash
bun run dev
```

При запуске автоматически стартует:

- API Server (обрабатывает MessagePattern запросы через Kafka)

### Production

```bash
bun run build
bun run start
```

**Примечание:** Для горизонтального масштабирования можно запустить несколько экземпляров приложения.

## API

### MessagePattern (Kafka)

Все методы используют Kafka MessagePattern формат: `graph-service.{action}`

**Примечание:** В Control Plane все межсервисные вызовы идут через Kafka.

### Server-Sent Events (SSE)

Сервис предоставляет SSE endpoint для real-time обновлений графа:

- **GET `/graph/sse/events?projectId={projectId}`** - Подписка на события проекта
  - Аутентификация через Bearer token в заголовке `Authorization` или cookie
  - События: `graph_updated`, `service_changed`
  - Автоматический reconnection через EventSource API

**Пример использования:**

```javascript
const eventSource = new EventSource("/graph/sse/events?projectId=xxx", {
  headers: {
    Authorization: "Bearer <session_token>",
  },
});

eventSource.addEventListener("graph_updated", (event) => {
  const data = JSON.parse(event.data);
  console.log("Graph updated:", data);
});
```

### Projects

- `graph-service.createProject` - Создать проект
- `graph-service.getProject` - Получить проект
- `graph-service.updateProject` - Обновить проект
- `graph-service.deleteProject` - Удалить проект
- `graph-service.listProjects` - Список проектов

### Graph

- `graph-service.getGraph` - Получить текущий граф проекта
- `graph-service.updateGraph` - Обновить граф (создает новую версию)
- `graph-service.listGraphVersions` - Список версий графа
- `graph-service.revertGraphVersion` - Откатить к версии

### Services

- `graph-service.listServices` - Список сервисов проекта
- `graph-service.getService` - Получить сервис по node_id

### Sync & Validation

- `graph-service.syncGraphWithServices` - Синхронизировать граф с сервисами
- `graph-service.validateGraph` - Валидация структуры графа

### Health Check

- `graph-service.healthCheck` - Проверка здоровья сервиса и зависимостей

## Database Schema

### projects

Хранит проекты пользователей:

- `id` (UUID) - Primary key
- `user_id` (UUID) - Владелец проекта
- `name` (VARCHAR) - Имя проекта
- `graph_version` (INTEGER) - Текущая версия графа
- `infrastructure_config` (JSONB) - Конфигурация инфраструктуры

### project_graph_versions

Версионирование графов:

- `id` (UUID) - Primary key
- `project_id` (UUID) - Связь с проектом
- `version` (INTEGER) - Версия графа
- `graph_data` (JSONB) - Данные графа (nodes, edges)

### project_services

Сервисы из графа:

- `id` (UUID) - Primary key
- `project_id` (UUID) - Связь с проектом
- `node_id` (VARCHAR) - = node.id в графе (критично!)
- `service_name` (VARCHAR) - Имя сервиса
- `blueprint_id` (VARCHAR) - ID blueprint
- `config` (JSONB) - Конфигурация
- `status` (ENUM) - Статус сервиса
- `code_version` (INTEGER) - Версия кода
- `generated_code_path` (TEXT) - Путь к сгенерированному коду

### database_nodes

Database nodes из графа:

- `id` (UUID) - Primary key
- `project_id` (UUID) - Связь с проектом
- `node_id` (VARCHAR) - = node.id в графе
- `database_type` (VARCHAR) - Тип БД (postgresql, mysql)
- `orm` (VARCHAR) - ORM (drizzle, typeorm, etc)
- `connection_name` (VARCHAR) - Имя подключения
- `config` (JSONB) - Конфигурация подключения

## Интеграция с контрактами

Сервис использует `@axion/contracts` для:

- MessagePattern константы (`GRAPH_SERVICE_PATTERNS`)
- Response utilities (`createSuccessResponse`, `createErrorResponse`)
- Metadata helpers (`getUserIdFromMetadata`)

## Разработка

### Добавление нового метода

1. Добавьте MessagePattern в `graph.controller.ts`
2. Реализуйте метод в `graph.service.ts`
3. При необходимости добавьте методы в repositories
4. Обновите контракты (proto файлы) если нужно

### Тестирование

```bash
# Type check
bun run type-check

# Lint
bun run lint

# Lint fix
bun run lint:fix
```

## Зависимости

- **@axion/contracts** - Protobuf контракты и утилиты
- **@axion/nestjs-common** - Общие NestJS утилиты
- **@nestjs/core** - NestJS framework
- **@nestjs/microservices** - Микросервисы (Kafka для SaaS платформы)
- **drizzle-orm** - ORM для работы с БД
- **postgres** - PostgreSQL клиент

## Архитектура коммуникации

**SaaS платформа (Control Plane):**

- Использует **Kafka** для Event Bus (CQRS, Event Sourcing)
- Все микросервисы общаются через Kafka

**Генерируемые сервисы клиентов:**

- Используют **RabbitMQ** (легковесный вариант)
- Не требуют Service Discovery
- Простая архитектура для быстрого деплоя
