# Traefik Configuration

Конфигурация Traefik через файлы.

## Структура

- `static/traefik.yml` - статическая конфигурация
- `dynamic/routers.yml` - динамическая конфигурация (генерируется)

## Генерация

```bash
# Dev (сервисы локально)
bun run docker:generate-traefik-config

# Prod (сервисы в Docker)
bun run docker:generate-traefik-config:prod
```

## Добавление сервиса

Добавьте в `docker/services.config.ts`, затем сгенерируйте конфиги.
