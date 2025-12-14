# Traefik Service Discovery - Автоматизация

## Обзор

Система автоматической генерации Traefik labels для всех сервисов, основанная на best practices и готовых решениях.

## Как работает Traefik Service Discovery

### Docker Provider

Traefik использует **Docker Provider** для автоматического обнаружения сервисов:

1. **Docker Socket**: Traefik подключается к `/var/run/docker.sock` (read-only)
2. **Real-time мониторинг**: Отслеживает запуск/остановку/обновление контейнеров
3. **Чтение Labels**: Автоматически читает Traefik labels из `docker-compose.yml`
4. **Динамическая маршрутизация**: Создает роутеры и сервисы на основе labels
5. **Без перезапуска**: Обновляет конфигурацию в реальном времени

### Конфигурация

```yaml
traefik:
  command:
    - "--providers.docker=true" # Включить Docker provider
    - "--providers.docker.exposedbydefault=false" # Только сервисы с labels
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro # Доступ к Docker API
```

## Централизованная конфигурация

Все сервисы настраиваются в одном месте: `docker/services.config.ts`

```typescript
export const SERVICES_CONFIG: Record<string, ServiceConfig> = {
  [GRAPH_SERVICE_NAME]: {
    serviceName: GRAPH_SERVICE_NAME, // Константа из @axion/contracts
    dockerServiceName: "graph-service", // Имя в docker-compose.yml
    routerName: "graph", // Короткое имя для Traefik
    host: "graph.localhost", // Hostname для маршрутизации
    port: 3001, // Внутренний порт
    websocket: true, // Поддержка WebSocket
    healthCheckPath: "/health", // Путь для health check
  },
  // ... другие сервисы
};
```

## Использование

### Быстрый старт

```bash
# Просмотр всех сервисов
bun run docker:generate-labels:dry

# Генерация labels для конкретного сервиса
bun run docker:generate-labels GRAPH_SERVICE

# Генерация labels для всех сервисов
bun run docker:generate-labels:all
```

### Пример вывода

```bash
$ bun run docker:generate-labels GRAPH_SERVICE

# GRAPH_SERVICE Traefik Labels

labels:
      - "traefik.enable=true"
      - "traefik.http.routers.graph.rule=Host(`graph.localhost`)"
      - "traefik.http.routers.graph.entrypoints=web"
      - "traefik.http.services.graph-service.loadbalancer.server.port=3001"
      - "traefik.http.routers.graph-ws.rule=Host(`graph.localhost`)"
      - "traefik.http.routers.graph-ws.entrypoints=ws"
      - "traefik.http.routers.graph-ws.service=graph-service"
```

## Добавление нового сервиса

### Шаг 1: Добавить конфигурацию

Отредактируйте `docker/services.config.ts`:

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

### Шаг 2: Сгенерировать labels

```bash
bun run docker:generate-labels NEW_SERVICE_NAME
```

### Шаг 3: Добавить в docker-compose.yml

Скопируйте сгенерированные labels в `docker-compose.yml`:

```yaml
new-service:
  build:
    context: ./apps/new-service
  # ... остальная конфигурация
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.new.rule=Host(`new.localhost`)"
    # ... остальные labels
```

## Best Practices (изученные решения)

### 1. Централизация конфигурации

✅ **Делайте**: Один файл конфигурации для всех сервисов
❌ **Не делайте**: Дублирование labels в каждом сервисе

### 2. Использование констант

✅ **Делайте**: Использовать константы из `@axion/contracts`

```typescript
[GRAPH_SERVICE_NAME]: { ... }  // ✅ Правильно
["GRAPH_SERVICE"]: { ... }      // ❌ Неправильно
```

### 3. Конвенции именования

✅ **Делайте**: Единообразные имена

- `dockerServiceName`: kebab-case (`graph-service`)
- `routerName`: короткое, kebab-case (`graph`)
- `host`: `{routerName}.localhost`

### 4. Автоматизация

✅ **Делайте**: Генерировать labels автоматически
❌ **Не делайте**: Писать labels вручную

## Расширенные возможности

### WebSocket поддержка

```typescript
{
  // ... базовые настройки
  websocket: true,  // Автоматически добавляет WebSocket router
}
```

Автоматически генерирует:

- `traefik.http.routers.{routerName}-ws.rule`
- `traefik.http.routers.{routerName}-ws.entrypoints=ws`

### HTTPS поддержка

```typescript
{
  // ... базовые настройки
  https: true,  // Автоматически добавляет HTTPS router
}
```

Автоматически генерирует:

- `traefik.http.routers.{routerName}-secure.rule`
- `traefik.http.routers.{routerName}-secure.tls.certresolver=letsencrypt`

### Middleware

```typescript
{
  // ... базовые настройки
  middlewares: ["auth", "rate-limit"],
}
```

Автоматически добавляет:

- `traefik.http.routers.{routerName}.middlewares=auth,rate-limit`

## Структура файлов

```
docker/
├── services.config.ts          # Централизованная конфигурация
├── inject-labels.ts            # Инъекция labels в docker-compose.yml
├── generate-override.ts        # Генерация override для production
├── setup-infrastructure.ts     # Запуск инфраструктуры
└── README.md                   # Документация
```

## Интеграция с существующими сервисами

### Пример: graph-service

1. Конфигурация уже есть в `services.config.ts`
2. Сгенерируйте labels:
   ```bash
   bun run docker:generate-labels GRAPH_SERVICE
   ```
3. Добавьте labels в `docker-compose.yml` (когда добавите сервис)

## Troubleshooting

### Проблема: Labels не применяются

**Решение**:

1. Убедитесь, что `traefik.enable=true` присутствует
2. Проверьте, что Traefik запущен: `docker ps | grep traefik`
3. Проверьте логи: `docker logs axion-traefik`

### Проблема: Сервис не доступен через Traefik

**Решение**:

1. Проверьте, что сервис в той же сети: `axion-network`
2. Проверьте, что порт правильный в labels
3. Проверьте Host header: должен совпадать с `host` в конфигурации

### Проблема: WebSocket не работает

**Решение**:

1. Убедитесь, что `websocket: true` в конфигурации
2. Проверьте, что WebSocket router создан: `traefik.http.routers.{routerName}-ws`
3. Проверьте entrypoints: должен быть `ws` entrypoint

## Ссылки

- [Traefik Docker Provider Documentation](https://doc.traefik.io/traefik/providers/docker/)
- [Traefik Labels Reference](https://doc.traefik.io/traefik/routing/providers/docker/#labels)
- [Docker Compose Documentation](../../docker/README.md)
