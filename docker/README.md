# Docker Infrastructure

## Quick Start

Запуск всей инфраструктуры (рекомендуется):

```bash
bun run docker:infra
```

Эта команда:

1. Генерирует конфигурацию Traefik
2. Запускает все инфраструктурные сервисы (postgres, keydb, kafka, traefik)

## Доступные команды

```bash
# Запуск инфраструктуры (postgres, keydb, kafka, traefik)
bun run docker:infra

# Остановка инфраструктуры
bun run docker:infra:down

# Запуск всех сервисов (включая monitoring)
bun run docker:all

# Остановка всех сервисов
bun run docker:down

# Просмотр логов
bun run docker:logs

# Генерация Traefik конфигурации (dev)
bun run docker:generate-traefik-config

# Генерация Traefik конфигурации (prod)
bun run docker:generate-traefik-config:prod
```

## Docker Compose Profiles

Проект использует Docker Compose profiles для управления сервисами:

- `infrastructure` - основная инфраструктура (postgres, keydb, kafka, traefik)
- `monitoring` - мониторинг сервисы (kafka-ui)
- `all` - все сервисы

### Ручное управление с profiles

```bash
# Запуск только инфраструктуры
docker compose --profile infrastructure up -d

# Запуск с мониторингом
docker compose --profile infrastructure --profile monitoring up -d

# Запуск всего
docker compose --profile all up -d

# Остановка
docker compose down
```

## Сервисы

### PostgreSQL

- **Port**: 5432
- **Database**: axion_control_plane
- **User**: axion
- **Password**: axion_password

### KeyDB (Redis-compatible)

- **Port**: 6379
- **Password**: axion_keydb_password

### Kafka (KRaft mode)

- **Port**: 9092 (host access)
- **Internal**: kafka:9092 (docker network)

### Kafka UI

- **Port**: 8081
- **URL**: http://localhost:8081

### Traefik

- **HTTP/Gateway**: 80, 8080
- **HTTPS**: 443
- **Dashboard**: 8082
- **Dashboard URL**: http://localhost:8082/dashboard/

## Traefik Configuration

У вас есть 2 варианта конфигурации Traefik:

### Вариант 1: Автогенерация (рекомендуется для продакшена)

Конфигурация генерируется автоматически из `docker/services.config.ts`:

```bash
# Генерация dev конфигурации
bun run docker:generate-traefik-config

# Генерация prod конфигурации (с TLS)
bun run docker:generate-traefik-config:prod
```

- Static config: `docker/traefik/static/traefik.yml`
- Dynamic config: `docker/traefik/dynamic/routers.yml` (генерируется)

**Режимы:**

- **dev**: используется для локальной разработки (host.docker.internal)
- **prod**: включает TLS и Let's Encrypt (внутренние docker имена)

### Вариант 2: Статический YAML (проще для разработки)

Используйте готовый статический файл:

```bash
# Скопируйте статическую конфигурацию
cp docker/traefik/dynamic/routers.static.yml docker/traefik/dynamic/routers.yml

# Или создайте символическую ссылку
ln -sf routers.static.yml docker/traefik/dynamic/routers.yml
```

Файл: `docker/traefik/dynamic/routers.static.yml`

**Преимущества статического YAML:**

- ✅ Не требует генерации
- ✅ Проще редактировать вручную
- ✅ Нет зависимости от TypeScript
- ⚠️ Нужно обновлять вручную при добавлении сервисов

## Health Checks

Все сервисы имеют health checks:

```bash
# Проверка статуса
docker compose ps

# Проверка логов health check
docker compose logs postgres | grep health
```

## Volumes

Данные сохраняются в named volumes:

- `postgres_data` - данные PostgreSQL
- `keydb_data` - данные KeyDB
- `kafka_data` - данные Kafka
- `traefik_letsencrypt` - сертификаты Let's Encrypt

## Troubleshooting

### Kafka не стартует

```bash
# Проверить логи
docker compose logs kafka

# Пересоздать контейнер
docker compose down
docker volume rm axion-stack_kafka_data
bun run docker:infra
```

### Traefik не видит роутинг

```bash
# Проверить что конфигурация сгенерирована
ls -la docker/traefik/dynamic/routers.yml

# Перегенерировать
bun run docker:generate-traefik-config

# Перезапустить Traefik
docker compose restart traefik
```

### PostgreSQL connection refused

```bash
# Проверить что база запущена
docker compose ps postgres

# Проверить логи
docker compose logs postgres

# Перезапустить
docker compose restart postgres
```
