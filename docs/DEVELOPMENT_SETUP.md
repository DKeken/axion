# Development Setup

## Quick Start

1. **Check environment configuration:**

   ```bash
   bun run check:env
   ```

2. **Copy environment templates (if needed):**

   ```bash
   cp templates/env/.env.example apps/graph-service/.env
   cp templates/env/.env.example apps/codegen-service/.env
   cp templates/env/.env.example apps/infrastructure-service/.env
   cp templates/env/.env.example apps/deployment-service/.env
   ```

3. **Fill in environment variables** in each `.env` file

4. **Start development environment:**
   ```bash
   bun run dev
   ```

This will:

- Kill processes on service ports
- Start Docker infrastructure (Kafka, Redis, PostgreSQL, Traefik)
- Start all services in development mode

## Environment Configuration

## Быстрый старт

Просто запустите:

```bash
bun dev
```

Это автоматически:

1. ✅ Убьет процессы на портах 3000-3004 (если заняты)
2. ✅ Запустит инфраструктуру (postgres, keydb, kafka, traefik)
3. ✅ Сгенерирует Traefik конфигурацию из `docker/services.config.ts`
4. ✅ Запустит все application services локально через Turbo

## Что происходит под капотом

### 1. Kill Processes on Ports

Скрипт `scripts/dev.ts`:

- Освобождает порты 3000-3004 от занятых процессов
- Использует `lsof` для поиска процессов

### 2. Infrastructure Setup

Команда `bun run docker:infra`:

- Генерирует Traefik конфигурацию через `docker/generate-traefik-config.ts`
- Запускает Docker Compose с profile `infrastructure`:
  - PostgreSQL (5432)
  - KeyDB/Redis (6379)
  - Kafka (9092)
  - Traefik (80, 443, 8080)
- Ждет, пока все сервисы станут healthy

### 3. Traefik Configuration Generation

Скрипт `docker/generate-traefik-config.ts`:

- Читает `docker/services.config.ts`
- Генерирует `docker/traefik/dynamic/routers.yml`
- Настраивает routing для всех сервисов
- Использует `host.docker.internal` для локальной разработки

### 4. Services Startup

Запускает `turbo run dev` для всех application services:

- Graph Service (3001)
- Codegen Service (3002)
- И другие сервисы из `apps/`

## Архитектура Development Mode

```
┌─────────────────────────────────────────────────┐
│  Application Services (локально, через turbo)    │
│  - graph-service:3001                          │
│  - codegen-service:3002                         │
│  - deployment-service:3003                       │
│  - ...                                          │
└─────────────────────────────────────────────────┘
                    ▲
                    │ HTTP/WebSocket
                    │ (через host.docker.internal)
┌─────────────────────────────────────────────────┐
│  Traefik (в Docker)                             │
│  - Проксирует на host.docker.internal:PORT      │
│  - Автоматически обнаруживает через labels       │
│  - Доступен на http://traefik.localhost          │
└─────────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────────┐
│  Infrastructure (в Docker)                       │
│  - postgres:5432                                 │
│  - redis:6379                                    │
│  - kafka:9092                                    │
│  - kafka-ui:8080 (http://kafka-ui.localhost)     │
└─────────────────────────────────────────────────┘
```

## Доступные сервисы

После запуска `bun dev` доступны:

- **Traefik Dashboard**: http://traefik.localhost:8080
- **Kafka UI**: http://kafka-ui.localhost:8081 (если включен monitoring profile)
- **Graph Service**: http://graph.localhost (когда запущен)
- **Codegen Service**: http://codegen.localhost (когда запущен)
- И т.д. для всех сервисов из `docker/services.config.ts`

**Прямой доступ к сервисам (без Traefik):**

- Graph Service: http://localhost:3001
- Codegen Service: http://localhost:3002

## Production Deployment

### 1. Генерация конфигурации

```bash
bun run docker:generate-override --env=prod
```

Это создаст `docker/compose.override.yml` с всеми application services.

### 2. Запуск

```bash
docker-compose -f docker-compose.yml -f docker/compose.override.yml up -d
```

### 3. Мониторинг

```bash
# Логи
docker-compose logs -f

# Статус
docker-compose ps

# Health checks
docker inspect axion-graph-service --format='{{.State.Health.Status}}'
```

## Отказоустойчивость

### Health Checks

Все сервисы имеют health checks:

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Restart Policies

- **Development**: `restart: no` (перезапуск вручную)
- **Production**: `restart: unless-stopped` (автоматический перезапуск)

### Dependencies

Все сервисы зависят от инфраструктуры с условием `service_healthy`:

```yaml
depends_on:
  postgres:
    condition: service_healthy
  redis:
    condition: service_healthy
  kafka:
    condition: service_healthy
```

Это гарантирует, что сервисы запустятся только после того, как инфраструктура будет готова.

## Troubleshooting

### Проблема: `bun dev` не запускает инфраструктуру

**Решение**:

```bash
# Запустите вручную
bun run docker:setup
```

### Проблема: Сервис не доступен через Traefik

**Решение**:

1. Проверьте, что сервис запущен локально: `lsof -i :3001`
2. Проверьте labels: `bun run docker:inject-labels`
3. Проверьте Traefik: http://traefik.localhost
4. Проверьте логи: `docker logs axion-traefik`

### Проблема: Labels не обновляются

**Решение**:

```bash
# Принудительное обновление
bun run docker:inject-labels
```

## Полезные команды

```bash
# Запуск инфраструктуры (генерирует Traefik config + запускает Docker)
bun run docker:infra

# Генерация Traefik конфигурации (dev)
bun run docker:generate-traefik-config

# Генерация Traefik конфигурации (prod с TLS)
bun run docker:generate-traefik-config:prod

# Использование статической конфигурации Traefik
bun run docker:infra-static

# Просмотр логов
bun run docker:logs

# Остановка инфраструктуры
bun run docker:infra:down

# Остановка всех сервисов
bun run docker:down
```

## Добавление нового сервиса

1. Добавьте в `docker/services.config.ts`:

```typescript
export const NEW_SERVICE_NAME = "new-service";

export const servicesConfig = {
  // ... существующие сервисы
  [NEW_SERVICE_NAME]: {
    serviceName: NEW_SERVICE_NAME,
    dockerServiceName: "new-service",
    routerName: "new",
    host: "new.localhost",
    port: 3007,
    websocket: false,
    healthCheckPath: "/health",
  },
};
```

2. Запустите `bun dev` - Traefik конфигурация сгенерируется автоматически!

Или вручную:

```bash
# Перегенерировать Traefik config
bun run docker:generate-traefik-config

# Перезапустить Traefik
docker compose restart traefik
```

## Best Practices

1. **Всегда используйте `bun dev`** - это гарантирует правильную настройку
2. **Не редактируйте `docker/traefik/dynamic/routers.yml` вручную** - используйте `docker:generate-traefik-config`
3. **Используйте статический YAML для быстрой разработки** - `bun run docker:infra-static`
4. **Проверяйте health checks** перед деплоем в production
5. **Для production используйте** `docker:generate-traefik-config:prod` (с TLS)

## Переменные окружения

Создайте `.env` файлы для каждого сервиса (см. `.env.example`):

```bash
# apps/graph-service/.env
DATABASE_URL=postgresql://axion:axion_password@localhost:5432/axion_control_plane
KAFKA_BROKERS=localhost:9092
```

См. [docker/README.md](../docker/README.md) для полной информации о Docker инфраструктуре.
