# Infrastructure Service

**Infrastructure Service** управляет физической инфраструктурой: серверами, агентами и мониторингом состояния.

## Технологии

- **NestJS** - фреймворк для построения микросервисов
- **Connect-RPC** - type-safe RPC коммуникация
- **Drizzle ORM** - работа с PostgreSQL
- **ProtoValidate** - валидация запросов на уровне контрактов
- **Protobuf** - схемы данных и контракты

## Структура

```
src/
├── config/
│   └── env.ts                 # Конфигурация окружения
├── database/
│   ├── schema.ts              # Drizzle schema (servers, agents)
│   ├── connection.ts          # Database connection
│   └── index.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── server.repository.ts    # Server CRUD operations
│   │   └── agent.repository.ts     # Agent CRUD operations
│   ├── infrastructure.controller.ts # Connect-RPC controller
│   ├── infrastructure.service.ts    # Business logic
│   └── infrastructure.module.ts     # NestJS module
├── app.module.ts              # Root module
└── main.ts                    # Application bootstrap
```

## Основные возможности

### 1. Регистрация серверов

```typescript
// RegisterServer - добавление нового сервера
{
  name: "Production Server 1",
  hostname: "prod-server-1.example.com",
  ipAddress: "192.168.1.100",
  metadata: {
    region: "us-east-1",
    environment: "production"
  }
}
```

### 2. Управление серверами

- **GetServer** - получение информации о сервере
- **ListServers** - список серверов пользователя
- **UpdateServerStatus** - обновление статуса (ONLINE, OFFLINE, MAINTENANCE, ERROR)
- **DeleteServer** - удаление сервера

### 3. Агенты

При регистрации сервера автоматически создается запись агента и генерируется токен для аутентификации.

## API Endpoints

### Connect-RPC

```
POST /axion.infrastructure.v1.InfrastructureService/RegisterServer
POST /axion.infrastructure.v1.InfrastructureService/GetServer
POST /axion.infrastructure.v1.InfrastructureService/ListServers
POST /axion.infrastructure.v1.InfrastructureService/UpdateServerStatus
POST /axion.infrastructure.v1.InfrastructureService/DeleteServer
```

### Health Check

```
GET /health
```

## Конфигурация

Создайте `.env` файл на основе `.env.example`:

```bash
cp .env.example .env
```

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `NODE_ENV` | Окружение (development/production) | development |
| `PORT` | Порт HTTP сервера | 3004 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `KAFKA_BROKERS` | Kafka brokers (опционально) | - |
| `MAX_SERVERS_PER_USER` | Лимит серверов на пользователя | 10 |

## Запуск

### Development

```bash
# Установка зависимостей
bun install

# Генерация миграций
bun run db:generate

# Применение миграций
bun run db:migrate

# Запуск в dev режиме
bun run dev
```

### Production

```bash
# Сборка
bun run build

# Запуск
bun run start
```

## База данных

### Миграции

```bash
# Генерация миграций из schema
bun run db:generate

# Применение миграций
bun run db:migrate

# Push schema (только для dev)
bun run db:push

# Drizzle Studio (GUI для БД)
bun run db:studio
```

### Схема

#### Таблица `servers`

- `id` - UUID (primary key)
- `user_id` - ID пользователя
- `name` - Название сервера
- `hostname` - Hostname
- `ip_address` - IP адрес
- `status` - Статус (ONLINE, OFFLINE, MAINTENANCE, ERROR)
- `metadata` - JSON метаданные
- `created_at` - Дата создания
- `updated_at` - Дата обновления
- `last_heartbeat` - Последний heartbeat

#### Таблица `agents`

- `id` - UUID (primary key)
- `server_id` - FK на servers
- `version` - Версия агента
- `status` - Статус (CONNECTED, DISCONNECTED, UPDATING)
- `capabilities` - JSON capabilities
- `token` - Токен для аутентификации
- `created_at` - Дата создания
- `last_heartbeat` - Последний heartbeat

## Валидация

Все запросы валидируются через **ProtoValidate** на уровне Protobuf контрактов:

```protobuf
message RegisterServerRequest {
  RequestMetadata metadata = 1 [(buf.validate.field).required = true];
  
  string name = 2 [
    (buf.validate.field).string.min_len = 1,
    (buf.validate.field).string.max_len = 255
  ];
  
  string hostname = 3 [
    (buf.validate.field).string.hostname = true
  ];
  
  string ip_address = 4 [
    (buf.validate.field).string.ip = true
  ];
}
```

## Обработка ошибок

Используется единая система обработки ошибок из `@axion/shared`:

```typescript
try {
  // operation
} catch (error) {
  return handleServiceError(this.logger, "operation name", error, {
    resourceType: "Server",
    resourceId: serverId,
  });
}
```

## Архитектурные принципы

### 1. Contract-First

Все типы импортируются из `@axion/contracts` (генерируются из Protobuf):

```typescript
import {
  type RegisterServerRequest,
  type RegisterServerResponse,
  ServerSchema,
} from "@axion/contracts";
```

### 2. Repository Pattern

Вся работа с БД через Repository:

```typescript
@Injectable()
export class ServerRepository {
  async create(data: CreateServer): Promise<Server> {
    // ...
  }
}
```

### 3. ProtoValidate

Валидация на уровне контроллера/сервиса:

```typescript
const validationResult = this.validator.validate(
  RegisterServerRequestSchema,
  data
);

if (validationResult.kind !== "valid") {
  // handle error
}
```

### 4. Type Safety

Строгая типизация на всех уровнях - от Protobuf до базы данных.

## Мониторинг

### Health Check

```bash
curl http://localhost:3004/health
```

Ответ:
```json
{
  "status": "ok",
  "service": "infrastructure-service"
}
```

## Разработка

### Линтинг

```bash
# Проверка
bun run lint

# Исправление
bun run lint:fix
```

### Type Checking

```bash
bun run type-check
```

## Связанные сервисы

- **Auth Service** - аутентификация и авторизация
- **Deployment Service** - деплой приложений на серверы
- **Runner Agent** - агент на серверах для выполнения задач

## Документация

- [Общая документация](../../../docs/services/infrastructure-service.md)
- [Protobuf контракты](../../../packages/contracts/proto/infrastructure/)
- [Валидация данных](../../../docs/guides/data-validation.md)

