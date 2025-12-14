# Axion Stack

Meta-framework для визуального проектирования и автоматической генерации микросервисной архитектуры.

## Структура проекта

```
axion-stack/
├── apps/
│   └── fumadocs/              # Fumadocs документация
├── docs/                  # Исходная документация (MD)
└── packages/              # Shared packages
```

## Документация

### Для разработчиков

Исходная документация находится в `docs/`:

- `ARCHITECTURE.md` — полная архитектура системы
- `TECHNICAL_DETAILS.md` — технические детали
- `CONTRACTS_AND_VALIDATION.md` — система контрактов и валидации
- `RUNNER_AGENT.md` — архитектура Runner Agent
- `templates/` — шаблоны для генерации кода

### Для LLM

Нормализованные документы в `docs-llm/`:

- Оптимизированы для использования с LLM
- Убраны лишние форматирования
- Структурированы для поиска

### Для Fumadocs

MDX файлы автоматически генерируются из `docs/`:

```bash
cd apps/docs
bun run convert:md
```

Затем запустите Fumadocs:

```bash
cd apps/docs
bun run dev
```

## Разработка

### Установка зависимостей

```bash
bun install
```

### Запуск документации

```bash
cd apps/docs
bun run dev
```

### Конвертация MD в MDX

```bash
cd apps/docs
bun run convert:md
```

## Turborepo

Проект использует Turborepo для монорепозитория:

- `turbo.json` — конфигурация задач
- Workspaces настроены в `package.json` (Bun workspaces)

### Доступные команды

```bash
# Разработка
bun run dev              # Запуск всех dev серверов
bun run build            # Сборка всех пакетов
bun run start            # Запуск production серверов

# Качество кода
bun run lint             # Проверка линтингом
bun run lint:fix         # Автоисправление линтинга
bun run type-check       # Проверка типов TypeScript
bun run format           # Форматирование кода
bun run format:check     # Проверка форматирования

# Тестирование
bun run test             # Запуск тестов
bun run test:watch       # Тесты в watch режиме
bun run test:coverage    # Покрытие тестами

# Очистка
bun run clean            # Очистка build артефактов
bun run clean:all        # Полная очистка (включая node_modules)
```

## Конфигурации

Проект использует общие конфигурации в `packages/_configs/`:

- `@axion-stack/eslint-config` - ESLint v9 Flat Config
- `@axion-stack/typescript-config` - TypeScript конфигурации

См. [packages/\_configs/README.md](./packages/_configs/README.md) для подробностей.

## Лицензия

ISC
