# Axion Client

Next.js 15 + React 19 клиентское приложение для Axion Stack.

## Технологии

- **Next.js 15** - App Router, Server Components
- **React 19** - React Server Components по умолчанию
- **React Flow** - Визуальный редактор графов
- **Better Auth** - Аутентификация
- **Tailwind CSS** - Стилизация
- **TypeScript** - Типобезопасность
- **Axios** - HTTP клиент

## Структура

```
apps/client/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout с навигацией
│   ├── page.tsx           # Главная страница
│   ├── projects/          # Страницы проектов
│   ├── infrastructure/    # Инфраструктура
│   └── deployments/       # Деплои
├── components/            # React компоненты
│   ├── graph-editor/      # React Flow редактор
│   ├── navigation.tsx     # Навигация
│   ├── user-menu.tsx      # Меню пользователя
│   └── code-preview.tsx   # Превью кода
├── lib/                   # Утилиты и клиенты
│   ├── api-client.ts      # Axios клиент
│   ├── auth-client.ts     # Better Auth клиент
│   └── api/               # API клиенты для сервисов
├── config/                # Конфигурация
└── utils/                 # Вспомогательные функции
```

## Установка

```bash
bun install
```

## Разработка

```bash
bun run dev
```

Приложение будет доступно на `http://localhost:3000`

## Переменные окружения

Создайте `.env.local` на основе `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_AUTH_URL=http://localhost:8080/api/auth
```

## Сборка

```bash
bun run build
bun run start
```

## Функционал

### ✅ Реализовано

- [x] Базовая структура Next.js 15 приложения
- [x] Better Auth интеграция
- [x] API клиенты для всех сервисов (Graph, Codegen, Infrastructure, Deployment)
- [x] React Flow Editor для визуального редактирования графов
- [x] Database и Service ноды
- [x] Infrastructure Dashboard
- [x] Deployment Dashboard
- [x] Code Preview компонент
- [x] Навигация и layout

### ⏳ В разработке

- [ ] Полная интеграция с SSE для real-time обновлений
- [ ] Создание/редактирование проектов через UI
- [ ] Полная интеграция генерации кода
- [ ] Деплой через UI
- [ ] Валидация графов в реальном времени

## API Endpoints

Клиент использует следующие API endpoints через Traefik:

- **Graph Service**: `/api/v1/graph/*`
- **Codegen Service**: `/api/v1/codegen/*`
- **Infrastructure Service**: `/api/v1/infrastructure/*`
- **Deployment Service**: `/api/v1/deployment/*`

## Типы

Все типы импортируются из `@axion/contracts` для типобезопасности между фронтендом и бэкендом.
