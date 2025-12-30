---
title: "Настройка окружения"
description: "Инструкция по развертыванию локального окружения для разработки Axion."
---

# Настройка окружения

Для разработки платформы Axion требуется следующий набор инструментов:

- **Runtime**: Bun v1.1+
- **Containerization**: Docker & Docker Compose
- **Systems Language**: Rust (для агента и Tauri)

## Быстрый старт

Запуск полного стека платформы одной командой:

```bash
bun dev
```

### Этапы запуска (`bun dev`)

1.  **Cleanup**: Принудительное завершение процессов на портах 3000-3010.
2.  **Infrastructure**: Поднятие зависимостей через Docker Compose (PostgreSQL, Redis, Kafka, Traefik).
3.  **Routing**: Генерация конфигурации Traefik на основе `docker/services.config.ts`.
4.  **Microservices**: Параллельный запуск всех сервисов из `apps/*` в режиме watch.

## Доступные интерфейсы

После успешного старта доступны следующие точки входа:

| Сервис                | URL                     | Назначение                                   |
| :-------------------- | :---------------------- | :------------------------------------------- |
| **API Gateway**       | `http://localhost:8080` | Основная точка входа API.                    |
| **Traefik Dashboard** | `http://localhost:8082` | Отладка маршрутизации.                       |
| **Kafka UI**          | `http://localhost:8081` | Просмотр топиков и сообщений.                |
| **Prisma Studio**     | `npx prisma studio`     | Просмотр базы данных (запускается отдельно). |

## Конфигурация (.env)

Переменные окружения должны быть скопированы из шаблонов перед первым запуском.

```bash
# Пример для Graph Service
cp apps/graph-service/.env.example apps/graph-service/.env
```

**Ключевые параметры:**

- `DATABASE_URL`: Строка подключения к PostgreSQL (`postgres://axion:axion@localhost:5432/axion`).
- `KAFKA_BROKERS`: Адрес брокеров (`localhost:9092`).
- `OPENROUTER_API_KEY`: Токен для доступа к LLM (требуется для Codegen).

## Устранение неполадок (Troubleshooting)

### EADDRINUSE (Порт занят)

Если скрипт не смог освободить порты автоматически:

```bash
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Kafka Connection Refused

Если сервисы падают с ошибкой подключения к Kafka:

1.  Проверьте статус контейнера: `docker ps | grep kafka`.
2.  Убедитесь, что используете правильный хост:
    - С хост-машины: `localhost:9092`
    - Изнутри Docker-сети: `kafka:9092`

### Ошибки миграций БД

Если схема БД рассинхронизирована:

```bash
# Сброс и применение миграций
bun run db:push
```
