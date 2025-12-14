# Уменьшение бойлерплейта в микросервисах

Документ описывает улучшения для уменьшения бойлерплейта при создании новых микросервисов в Axion Stack.

## Созданные улучшения

### 1. Bootstrap Helper (`@axion/nestjs-common`)

Универсальная функция для инициализации микросервиса с Kafka и HTTP сервером.

**До:**

```typescript
// apps/graph-service/src/main.ts - 44 строки бойлерплейта
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ... много кода для Kafka
  // ... код для HTTP сервера
}
```

**После:**

```typescript
import { bootstrapMicroservice } from "@axion/nestjs-common";
import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { AppModule } from "./app.module";

bootstrapMicroservice(AppModule, {
  serviceName: GRAPH_SERVICE_NAME,
  defaultPort: 3001,
}).catch((error) => {
  console.error("Error starting service:", error);
  process.exit(1);
});
```

**Экономия:** ~30 строк кода в каждом сервисе

---

### 2. Universal Health Module (`@axion/nestjs-common`)

Готовый health модуль, который можно использовать в любом сервисе.

**До:**

```typescript
// Создание отдельного HealthModule для каждого сервиса
// ~100 строк кода
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

**После:**

```typescript
import { HealthModule } from "@axion/nestjs-common";
import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { getClient } from "@/database/connection";

@Module({
  imports: [
    HealthModule.forRoot({
      serviceName: GRAPH_SERVICE_NAME,
      getDatabaseClient: () => getClient(),
    }),
  ],
})
export class AppModule {}
```

**Экономия:** ~100 строк кода в каждом сервисе

---

### 3. Pagination Helpers (`@axion/database`)

Утилиты для упрощения пагинации в репозиториях.

**До:**

```typescript
async findByUserId(userId: string, page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const allProjects = await this.db
    .select()
    .from(this.table)
    .where(eq(this.table.userId, userId))
    .orderBy(desc(this.table.createdAt));

  const total = allProjects.length;
  const paginatedProjects = allProjects.slice(offset, offset + limit);

  return { projects: paginatedProjects, total };
}
```

**После:**

```typescript
import { applyPagination } from "@axion/database";

async findByUserId(userId: string, page: number = 1, limit: number = 10) {
  const allProjects = await this.db
    .select()
    .from(this.table)
    .where(eq(this.table.userId, userId))
    .orderBy(desc(this.table.createdAt));

  return applyPagination(allProjects, { page, limit });
}
```

**Экономия:** ~5 строк на каждый метод пагинации

---

### 4. BaseRepository улучшения (`@axion/database`)

Добавлен метод `findPaginated` для автоматической пагинации с фильтрацией.

**Использование:**

```typescript
async findByProjectId(
  projectId: string,
  page: number = 1,
  limit: number = 10
) {
  return this.findPaginated(
    { projectId },
    { page, limit },
    desc(this.table.createdAt)
  );
}
```

**Экономия:** ~10-15 строк на каждый метод с пагинацией

---

## Что еще можно улучшить

### 1. Автоматическая генерация координатора сервисов

**Проблема:** В GraphService много методов, которые просто делегируют в специализированные сервисы:

```typescript
async createProject(data: CreateProjectRequest) {
  return this.projectsService.create(data);
}
```

**Решение:** Можно создать декоратор или базовый класс, который автоматически делегирует методы:

```typescript
@AutoDelegate({
  projectsService: ["create", "get", "update", "delete", "list"],
  graphOperationsService: ["get", "update", "listVersions", "revertVersion"],
})
export class GraphService {
  // Методы создаются автоматически
}
```

### 2. Универсальный контроллер

**Проблема:** Много повторяющихся методов в контроллерах:

```typescript
@MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
async createProject(@Payload() data: CreateProjectRequest) {
  return this.graphService.createProject(data);
}
```

**Решение:** Можно использовать функцию-хелпер:

```typescript
@Controller()
@UseGuards(MicroserviceAuthGuard)
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  // Автоматическое делегирование
  createProject = delegateTo(this.graphService, "createProject");
  getProject = delegateTo(this.graphService, "getProject");
  // ...
}
```

Или даже лучше - использовать декоратор:

```typescript
@Controller()
@UseGuards(MicroserviceAuthGuard)
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Delegate(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT, "createProject")
  createProject;
}
```

### 3. Автоматическая регистрация провайдеров

**Проблема:** В каждом модуле нужно вручную регистрировать все провайдеры:

```typescript
@Module({
  providers: [
    GraphService,
    ProjectsService,
    GraphOperationsService,
    // ... еще 10 провайдеров
  ],
})
```

**Решение:** Можно использовать конвенции именования и автоматическую регистрацию:

```typescript
@Module({
  imports: [
    AutoRegisterProviders({
      services: './services',
      repositories: './repositories',
    }),
  ],
})
```

### 4. Шаблоны для создания новых сервисов

**Проблема:** При создании нового микросервиса нужно:

- Создать main.ts
- Создать app.module.ts
- Создать health модуль
- Настроить database connection
- И т.д.

**Решение:** CLI команда или шаблоны для генерации:

```bash
bun run create-service my-service
```

Это создаст всю базовую структуру автоматически.

---

## Рекомендации для следующего микросервиса

### 1. Используйте bootstrap helper

```typescript
// main.ts
import { bootstrapMicroservice } from "@axion/nestjs-common";
import { MY_SERVICE_NAME } from "@axion/contracts";
import { AppModule } from "./app.module";

bootstrapMicroservice(AppModule, {
  serviceName: MY_SERVICE_NAME,
  defaultPort: 3002,
}).catch((error) => {
  console.error("Error starting service:", error);
  process.exit(1);
});
```

### 2. Используйте Universal Health Module

```typescript
// app.module.ts
import { HealthModule } from "@axion/nestjs-common";
import { getClient } from "@/database/connection";

@Module({
  imports: [
    HealthModule.forRoot({
      serviceName: MY_SERVICE_NAME,
      getDatabaseClient: () => getClient(),
    }),
  ],
})
export class AppModule {}
```

### 3. Используйте BaseRepository с пагинацией

```typescript
// repositories/my.repository.ts
import { BaseRepository } from "@axion/database";
import { applyPagination } from "@axion/database";

export class MyRepository extends BaseRepository<...> {
  async findByUserId(userId: string, page: number = 1, limit: number = 10) {
    const all = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.userId, userId));

    return applyPagination(all, { page, limit });
  }
}
```

### 4. Структура модуля

```
src/
├── main.ts                    # Использует bootstrapMicroservice
├── app.module.ts              # Импортирует HealthModule
├── database/
│   ├── connection.ts
│   ├── schema.ts
│   └── index.ts
├── {feature}/
│   ├── {feature}.module.ts
│   ├── {feature}.controller.ts
│   ├── {feature}.service.ts   # Main coordinator (если нужен)
│   ├── services/              # Специализированные сервисы
│   │   └── *.service.ts
│   └── repositories/
│       └── *.repository.ts
└── health/                    # Больше не нужен! Используйте HealthModule
```

---

## Метрики

### До улучшений:

- **main.ts:** ~44 строки
- **health модуль:** ~100 строк
- **репозиторий с пагинацией:** ~20 строк на метод
- **Итого на сервис:** ~250+ строк бойлерплейта

### После улучшений:

- **main.ts:** ~10 строк (-34)
- **health модуль:** 4 строки в app.module.ts (-96)
- **репозиторий с пагинацией:** ~10 строк на метод (-10)
- **Итого на сервис:** ~100 строк бойлерплейта

**Экономия: ~150+ строк кода на каждый микросервис**

---

## Следующие шаги

1. ✅ Bootstrap helper - создан
2. ✅ Universal Health Module - создан
3. ✅ Pagination helpers - созданы
4. ⏳ Автоматическое делегирование в контроллерах - в планах
5. ⏳ Автоматическая регистрация провайдеров - в планах
6. ⏳ CLI для генерации сервисов - в планах
