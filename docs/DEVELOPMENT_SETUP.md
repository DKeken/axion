# Development Setup - Автоматизация

## Быстрый старт

Просто запустите:

```bash
bun dev
```

Это автоматически:

1. ✅ Запустит инфраструктуру (postgres, redis, kafka, traefik)
2. ✅ Добавит Traefik labels в docker-compose.yml (если нужно)
3. ✅ Запустит все application services локально

## Что происходит под капотом

### 1. Infrastructure Setup

Скрипт `docker/setup-infrastructure.ts`:

- Проверяет, что Docker запущен
- Проверяет, что инфраструктура уже запущена
- Если нет - запускает `docker-compose up -d postgres redis kafka traefik`
- Ждет, пока все сервисы станут healthy

### 2. Labels Injection

Скрипт `docker/inject-labels.ts`:

- Читает `docker/services.config.ts`
- Генерирует Traefik labels для всех сервисов
- Добавляет/обновляет labels в `docker-compose.yml`

### 3. Services Startup

Запускает `turbo run dev` для всех application services.

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

- **Traefik Dashboard**: http://traefik.localhost
- **Kafka UI**: http://kafka-ui.localhost
- **Graph Service**: http://graph.localhost (когда запущен)
- **Codegen Service**: http://codegen.localhost (когда запущен)
- И т.д. для всех сервисов из `services.config.ts`

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
# Запуск инфраструктуры
bun run docker:setup

# Обновление labels
bun run docker:inject-labels

# Просмотр логов
bun run docker:logs

# Остановка
bun run docker:down

# Production: генерация override
bun run docker:generate-override --env=prod
```

## Добавление нового сервиса

1. Добавьте в `docker/services.config.ts`:

```typescript
[NEW_SERVICE_NAME]: {
  serviceName: NEW_SERVICE_NAME,
  dockerServiceName: "new-service",
  routerName: "new",
  host: "new.localhost",
  port: 3007,
  websocket: false,
  healthCheckPath: "/health",
},
```

2. Запустите `bun dev` - все настроится автоматически!

Или вручную:

```bash
bun run docker:inject-labels
```

## Best Practices

1. **Всегда используйте `bun dev`** - это гарантирует правильную настройку
2. **Не редактируйте docker-compose.yml вручную** - используйте `docker:inject-labels`
3. **Проверяйте health checks** перед деплоем в production
4. **Используйте override файлы** для production окружения
