# Deployment Service

Deployment Service - управление деплоями проектов для Axion Control Plane.

## Описание

Deployment Service предоставляет функциональность для управления деплоями:

- **Deployment Management** - управление деплоями (CRUD операции, статусы)
- **Docker Stack Generation** - генерация docker-compose.yml и Dockerfile
- **BullMQ Integration** - очереди для асинхронных деплоев
- **Rollback Mechanism** - откат деплоев к предыдущим версиям
- **Agent Management** - управление Runner Agent через gRPC/Kafka

## Основные возможности

### Deployment Management

- ✅ Deploy Project - деплой проекта на сервер или кластер
- ✅ Cancel Deployment - отмена деплоя
- ✅ Get Deployment - получение информации о деплое
- ✅ List Deployments - список деплоев проекта (с фильтрацией по статусу)
- ✅ Get Deployment Status - получение статуса деплоя
- ✅ Rollback Deployment - откат деплоя к предыдущей версии

### Docker Stack Generation

- ⏳ Generate Docker Compose - генерация docker-compose.yml из графа проекта (TODO)
- ⏳ Generate Dockerfile - генерация Dockerfile для каждого сервиса (TODO)
- ⏳ Network Configuration - настройка сетей из edges (TODO)
- ⏳ Health Checks - добавление health checks (TODO)
- ⏳ Environment Variables - управление env переменными (TODO)

### BullMQ Integration

- ⏳ Setup BullMQ - настройка очередей (TODO)
- ⏳ Deployment Queue - очередь для деплоев (TODO)
- ⏳ Agent Installation Queue - очередь для установки агентов (TODO)
- ⏳ Job Processor - обработчик задач деплоя (TODO)
- ⏳ Retry Logic - логика повторных попыток (TODO)

### Runner Agent Management

- ⏳ Agent Registration - регистрация агентов (TODO)
- ⏳ Agent Health Check - проверка здоровья агентов (TODO)
- ⏳ Send Deploy Command - отправка команд деплоя (TODO)
- ⏳ Receive Agent Status - получение статусов от агентов (TODO)

### Deployment History & Rollback

- ✅ Deployment History - сохранение истории деплоев для rollback
- ✅ Rollback Mechanism - откат деплоев к предыдущим версиям

## Архитектура

### Структура модуля

```
src/
├── database/
│   ├── schema.ts          # Drizzle schema (deployments, deployment_history)
│   ├── connection.ts      # Database connection
│   └── index.ts
├── deployment/
│   ├── deployment.module.ts
│   ├── deployment.controller.ts  # MessagePattern handlers
│   ├── deployment.service.ts     # Main coordinator
│   ├── services/                    # Specialized services
│   │   ├── deployments.service.ts
│   ├── repositories/                # Repository pattern
│   │   ├── deployment.repository.ts
│   │   └── deployment-history.repository.ts
│   └── helpers/                     # Reusable helpers
│       ├── type-transformers.ts
│       └── deployment-access.helper.ts
├── app.module.ts
└── main.ts
```

### Database Schema

#### Deployments Table

- `id` - UUID (primary key)
- `project_id` - UUID (foreign key to projects)
- `cluster_id` - UUID (optional, foreign key to clusters)
- `server_id` - UUID (optional, foreign key to servers)
- `status` - enum (pending, in_progress, success, failed, rolling_back, rolled_back)
- `service_statuses` - JSONB (массив ServiceDeploymentStatus)
- `env_vars` - JSONB (map<string, string>)
- `config` - JSONB (DeploymentConfig)
- `started_at` - timestamp
- `completed_at` - timestamp
- `created_at` - timestamp
- `updated_at` - timestamp

#### Deployment History Table

- `id` - UUID (primary key)
- `deployment_id` - UUID (foreign key to deployments)
- `deployment_snapshot` - JSONB (полная копия deployment для rollback)
- `version` - string (версия деплоя)
- `rolled_back` - boolean
- `created_at` - timestamp

## API Endpoints (MessagePattern)

- `deployment-service.deployProject` - деплой проекта
- `deployment-service.cancelDeployment` - отмена деплоя
- `deployment-service.getDeployment` - получение деплоя
- `deployment-service.listDeployments` - список деплоев
- `deployment-service.getDeploymentStatus` - статус деплоя
- `deployment-service.rollbackDeployment` - откат деплоя

## Environment Variables

```env
# Database (отдельная БД для deployment-service)
DATABASE_URL=postgresql://axion:axion_password@localhost:5436/axion_deployment

# Redis (для BullMQ очередей)
REDIS_URL=redis://:axion_redis_password@localhost:6379

# Kafka (Event Bus для CQRS и Event Sourcing)
KAFKA_BROKERS=localhost:9092
KAFKAJS_NO_PARTITIONER_WARNING=1

# Service
PORT=3005
NODE_ENV=development
```

## Зависимости

- **Infrastructure Service** - для получения серверов и кластеров
- **Codegen Service** - для получения сгенерированного кода
- **Graph Service** - для получения графа проекта (через Codegen Service)

## Запуск

### Локальная разработка

```bash
# Установка зависимостей
bun install

# Настройка переменных окружения
cp .env.example .env

# Запуск БД (через docker-compose)
docker-compose up -d postgres-deployment

# Генерация миграций
bun run migrate:generate

# Применение миграций
bun run migrate:push  # для dev
# или
bun run migrate       # для production

# Запуск сервиса
bun dev
```

## TODO

### Реализовано ✅

- [x] Database Schema (deployments, deployment_history)
- [x] Deployment Management (CRUD)
- [x] Deployment History (для rollback)
- [x] Repository Pattern
- [x] Type Transformers (DB → Protobuf)
- [x] Access Control Helpers
- [x] MessagePattern Handlers
- [x] ClientsModule для Infrastructure и Codegen сервисов

### Требует реализации ⏳

- [ ] BullMQ Integration (очереди, job processor)
- [ ] Docker Stack Generation (docker-compose.yml, Dockerfile)
- [ ] Runner Agent Management (gRPC/Kafka)
- [ ] Deployment Status Tracking (реальное отслеживание прогресса)
- [ ] Интеграция с Infrastructure Service (получение серверов)
- [ ] Интеграция с Codegen Service (получение сгенерированного кода)
- [ ] Интеграция с Graph Service (получение графа проекта)

## См. также

- [MICROSERVICE_TEMPLATE.md](../../docs/MICROSERVICE_TEMPLATE.md) - шаблон для создания микросервисов
- [ARCHITECTURE.mdx](../../docs/ARCHITECTURE.mdx) - архитектура системы
- [TODO.mdx](../../docs/TODO.mdx) - список задач
