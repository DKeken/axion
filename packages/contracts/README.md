# @axion/contracts

Protobuf контракты и TypeScript типы для Axion Stack. Единственный источник истины для всех типов, контрактов и валидаций в monorepo.

## Установка

```bash
bun add @axion/contracts
```

## Генерация типов

После изменения proto файлов:

```bash
cd packages/contracts
bun run generate
```

Это выполнит:

1. Генерацию TypeScript типов из proto файлов через Buf CLI
2. Создание Connect-RPC service definitions
3. Генерацию схем валидации для ProtoValidate

## Использование

### Импорт типов

```typescript
import {
  type CreateProjectRequest,
  type Project,
  NodeType,
  EdgeType,
} from "@axion/contracts";
```

### Валидация с ProtoValidate

```typescript
import { createValidator } from "@bufbuild/protovalidate";
import { CreateProjectRequestSchema } from "@axion/contracts";

const validator = createValidator();

const result = validator.validate(CreateProjectRequestSchema, data);

if (result.kind !== "valid") {
  console.error("Validation failed:", result.violations);
}
```

### Connect-RPC Services

```typescript
import { GraphService } from "@axion/contracts";
import { ConnectRouter } from "@connectrpc/connect";

export function graphServiceRouter(router: ConnectRouter) {
  router.service(GraphService, {
    async createProject(req) {
      // Implementation
      return { project: { ... } };
    }
  });
}
```

### Kafka MessagePattern константы

```typescript
import { GRAPH_SERVICE_PATTERNS } from "@axion/contracts";

@MessagePattern(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
async createProject(@Payload() data: CreateProjectRequest) {
  // Handler implementation
}
```

### Utility функции

```typescript
import {
  getUserIdFromMetadata,
  createSuccessResponse,
  createErrorResponse,
  createValidationError,
  createNotFoundError,
} from "@axion/contracts";

// Извлечение user_id из metadata
const userId = getUserIdFromMetadata(request.metadata);

// Создание успешного ответа
return createSuccessResponse(project);

// Создание ошибки
return createErrorResponse(createNotFoundError("Project", projectId));
```

## Структура

```
packages/contracts/
├── proto/                    # Protobuf определения
│   ├── common/              # Общие типы
│   │   ├── common.proto     # RequestMetadata, Pagination
│   │   ├── errors.proto     # Error, ErrorCode
│   │   └── responses.proto  # ServiceResponse
│   ├── graph/               # Graph Service
│   ├── auth/                # Auth Service
│   ├── deployment/          # Deployment Service
│   ├── infrastructure/      # Infrastructure Service
│   ├── codegen/             # Codegen Service
│   └── billing/             # Billing Service
├── generated/               # Сгенерированный TypeScript код
├── src/                     # Source code
│   ├── index.ts            # Главный экспорт
│   ├── utils/              # Utility функции
│   │   ├── metadata.ts     # Работа с RequestMetadata
│   │   └── responses.ts    # Создание ответов и ошибок
│   └── constants/          # Константы
│       └── patterns.ts     # Kafka MessagePattern константы
└── buf.yaml                # Buf конфигурация
```

## Сервисы

### Graph Service

- Управление проектами (CRUD)
- Управление графами архитектуры
- Версионирование графов

### Auth Service

- Валидация сессий
- Создание/отзыв сессий
- Управление пользователями

### Deployment Service

- Создание деплоев
- Отслеживание статуса
- Отмена деплоев

### Infrastructure Service

- Регистрация серверов
- Управление агентами
- Мониторинг статуса

### Codegen Service

- Получение blueprints
- Генерация кода из графов

### Billing Service

- Управление подписками
- Управление планами
- Биллинг операции

## Валидация

Все proto файлы содержат buf.validate аннотации:

```protobuf
message CreateProjectRequest {
  RequestMetadata metadata = 1 [(buf.validate.field).required = true];

  string name = 2 [
    (buf.validate.field).string.min_len = 1,
    (buf.validate.field).string.max_len = 255
  ];

  option (buf.validate.message).cel = {
    id: "name_not_empty"
    message: "name must not be empty or whitespace only"
    expression: "this.name.trim().size() > 0"
  };
}
```

## Разработка

### Добавление нового контракта

1. Создай `.proto` файл в соответствующей директории
2. Добавь `buf.validate` аннотации для валидации
3. Запусти генерацию: `bun run generate`
4. Экспортируй типы в `src/index.ts`
5. Добавь MessagePattern константы в `src/constants/patterns.ts`

### Проверка

```bash
# Type check
bun type-check

# Buf lint
bun run lint

# Buf breaking changes
bun run breaking
```

## License

ISC
