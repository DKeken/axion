---
title: "Client Application"
description: "Next.js 16 клиентское приложение"
---

# Client Application

**Client Application** — это основной пользовательский интерфейс платформы Axion, реализованный на **Next.js 16** (App Router).

## Технологический стек

- **Framework**: Next.js 15 (App Router).
- **Rendering**: React Server Components (RSC) по умолчанию.
- **State Management**: Zustand (для клиентского стейта, например Graph Store).
- **Data Fetching**: TanStack Query + Ky (типизированный HTTP клиент).
- **UI Components**: Shadcn UI + Tailwind CSS.
- **Graph Editor**: React Flow.
- **Auth**: Better Auth (Client + Server Integration).

## Архитектура

Приложение следует архитектуре Next.js App Router.

### Структура директорий

- `app/(dashboard)/`: Основной интерфейс панели управления.
  - `projects/`: Управление проектами и граф-редактор.
  - `infrastructure/`: Дашборд серверов.
  - `deployments/`: История деплоев.
- `app/(landing)/`: Публичные страницы (лендинг).
- `app/(auth)/`: Страницы входа/регистрации.
- `lib/api/`: Типизированные клиенты для бэкенд-сервисов (генерируются из контрактов).
- `components/graph-editor/`: Логика визуального редактора архитектуры.

## Взаимодействие с Бэкендом

Клиент взаимодействует с микросервисами через HTTP API Gateway (Traefik).

### Frontend API Package

Используется пакет `@axion/frontend-api` (внутри monorepo), который предоставляет:

1.  **Typed Client**: Обертка над Ky с типами из `@axion/contracts`.
2.  **React Query Hooks**: Готовые хуки для всех запросов.

Пример использования:

```typescript
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// В React компоненте
const { data } = useQuery({
  queryKey: ["projects"],
  queryFn: () => api.graph.listProjects(),
});
```

### Аутентификация

- Использует **Better Auth** для управления сессиями.
- Токен сессии передается в заголовке `Authorization: Bearer ...` при каждом запросе к API.
- Middleware Next.js защищает приватные роуты.

## Конфигурация

Основные переменные окружения (`.env`):

| Переменная             | Описание                                                      |
| :--------------------- | :------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | URL API Gateway (например, `http://localhost:8080`).          |
| `NEXT_PUBLIC_AUTH_URL` | URL Auth Service (обычно то же, что и API URL).               |
| `BETTER_AUTH_SECRET`   | Секрет для подписи токенов (должен совпадать с Auth Service). |
| `BETTER_AUTH_URL`      | Публичный URL для Auth (Next.js).                             |

## Особенности реализации

### Graph Editor

Редактор графов (`/projects/[id]/editor`) использует **React Flow**.

- **Custom Nodes**: Специальные компоненты для сервисов, баз данных и очередей.
- **State**: Состояние графа управляется через Zustand (`stores/graph-store.ts`) для производительности, синхронизируется с сервером при сохранении.

### Server Components

Тяжелые данные загружаются на сервере (RSC) и передаются в клиентские компоненты как пропсы или через HydrationBoundary для React Query.
