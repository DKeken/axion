# Infrastructure Service

Infrastructure Service - управление серверами и кластерами для Axion Control Plane.

## Описание

Infrastructure Service предоставляет функциональность для управления инфраструктурой:

- **Server Management** - управление серверами (CRUD операции, SSH ключи, проверка подключений)
- **Cluster Management** - группировка серверов в кластеры
- **Health Monitoring** - проверка доступности серверов и статуса Docker

## Основные возможности

### Server Management

- ✅ Create Server - добавление сервера с SSH ключом или паролем
- ✅ Get Server - получение информации о сервере
- ✅ Update Server - обновление данных сервера
- ✅ Delete Server - удаление сервера
- ✅ List Servers - список серверов пользователя (с фильтрацией по кластеру)
- ⏳ Test Server Connection - проверка SSH подключения (заглушка, требует реализации)

### Cluster Management

- ✅ Create Cluster - создание кластера
- ✅ Get Cluster - получение информации о кластере
- ✅ Update Cluster - обновление данных кластера
- ✅ Delete Cluster - удаление кластера
- ✅ List Clusters - список кластеров пользователя
- ✅ List Cluster Servers - список серверов в кластере

### Health Monitoring

- ⏳ Ping Server - проверка доступности сервера (требует реализации)
- ⏳ Check Docker - проверка наличия Docker (требует реализации)
- ⏳ Check Agent Status - проверка статуса Runner Agent (требует реализации)

## Архитектура

### Структура модуля

```
src/
├── database/
│   ├── schema.ts          # Drizzle schema (servers, clusters)
│   ├── connection.ts      # Database connection
│   └── index.ts
├── infrastructure/
│   ├── infrastructure.module.ts
│   ├── infrastructure.controller.ts  # MessagePattern handlers
│   ├── infrastructure.service.ts     # Main coordinator
│   ├── services/                    # Specialized services
│   │   ├── servers.service.ts
│   │   └── clusters.service.ts
│   ├── repositories/                # Repository pattern
│   │   ├── server.repository.ts
│   │   └── cluster.repository.ts
│   └── helpers/                     # Reusable helpers
│       ├── type-transformers.ts
│       ├── server-access.helper.ts
│       └── cluster-access.helper.ts
├── app.module.ts
└── main.ts
```

### Database Schema

#### Servers Table

- `id` - UUID (primary key)
- `user_id` - UUID (owner)
- `cluster_id` - UUID (optional, foreign key to clusters)
- `host` - string (server hostname/IP)
- `port` - integer (SSH port, default: 22)
- `username` - string (SSH username)
- `encrypted_private_key` - text (encrypted SSH private key)
- `encrypted_password` - text (encrypted password, if used)
- `name` - string (server name)
- `description` - text (optional)
- `status` - enum (pending, connected, disconnected, error, installing)
- `server_info` - JSONB (OS, CPU, RAM, Docker info)
- `agent_id` - UUID (Axion Runner Agent ID, if installed)
- `last_connected_at` - timestamp
- `created_at` - timestamp
- `updated_at` - timestamp

#### Clusters Table

- `id` - UUID (primary key)
- `user_id` - UUID (owner)
- `name` - string (cluster name)
- `description` - text (optional)
- `created_at` - timestamp
- `updated_at` - timestamp

## API Endpoints (MessagePattern)

### Clusters

- `infrastructure-service.createCluster` - создание кластера
- `infrastructure-service.getCluster` - получение кластера
- `infrastructure-service.updateCluster` - обновление кластера
- `infrastructure-service.deleteCluster` - удаление кластера
- `infrastructure-service.listClusters` - список кластеров
- `infrastructure-service.listClusterServers` - список серверов в кластере

### Servers

- `infrastructure-service.createServer` - создание сервера
- `infrastructure-service.getServer` - получение сервера
- `infrastructure-service.updateServer` - обновление сервера
- `infrastructure-service.deleteServer` - удаление сервера
- `infrastructure-service.listServers` - список серверов
- `infrastructure-service.testServerConnection` - проверка подключения

## Environment Variables

```env
# Database (отдельная БД для infrastructure-service)
DATABASE_URL=postgresql://axion:axion_password@localhost:5435/axion_infrastructure

# Kafka (Event Bus для CQRS и Event Sourcing)
KAFKA_BROKERS=localhost:9092
KAFKAJS_NO_PARTITIONER_WARNING=1

# Service
PORT=3003
NODE_ENV=development
```

## Запуск

### Локальная разработка

```bash
# Установка зависимостей
bun install

# Настройка переменных окружения
cp .env.example .env

# Запуск БД (через docker-compose)
docker-compose up -d postgres-infrastructure

# Генерация миграций
bun run migrate:generate

# Применение миграций
bun run migrate:push  # для dev
# или
bun run migrate       # для production

# Запуск сервиса
bun dev
```

### Production

```bash
# Сборка
bun run build

# Запуск
bun start
```

## Миграции

```bash
# Генерация миграций из schema
bun run migrate:generate

# Применение миграций (production)
bun run migrate

# Push schema (dev only)
bun run migrate:push
```

## TODO

### Реализовано ✅

- [x] Database Schema (servers, clusters)
- [x] Server Management (CRUD)
- [x] Cluster Management (CRUD)
- [x] Repository Pattern
- [x] Type Transformers (DB → Protobuf)
- [x] Access Control Helpers
- [x] MessagePattern Handlers

### Требует реализации ⏳

- [ ] SSH Key Encryption/Decryption (сейчас хранятся в plain text)
- [ ] Test Server Connection (реальная проверка SSH подключения)
- [ ] Server Health Monitoring (ping, Docker check)
- [ ] Agent Status Check (проверка статуса Runner Agent)
- [ ] System Requirements Calculation (расчет ресурсов для проекта)

## Зависимости

- **@axion/contracts** - Protobuf контракты и типы
- **@axion/shared** - общие утилиты (error handling, access control)
- **@axion/database** - database utilities (BaseRepository)
- **@axion/nestjs-common** - NestJS компоненты (AuthModule, HealthModule)
- **@axion/better-auth** - аутентификация

## См. также

- [MICROSERVICE_TEMPLATE.md](../../docs/MICROSERVICE_TEMPLATE.md) - шаблон для создания микросервисов
- [ARCHITECTURE.mdx](../../docs/ARCHITECTURE.mdx) - архитектура системы
- [TODO.mdx](../../docs/TODO.mdx) - список задач
