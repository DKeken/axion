---
title: "Graph Service"
description: "Сервис управления проектами и графами архитектуры"
---

# Graph Service

**Graph Service** является центральным компонентом для управления логической структурой проектов. Он хранит информацию о проектах, их версиях и визуальных графах (ноды и связи), которые описывают архитектуру развертываемого приложения.

## Архитектура

Сервис построен на **NestJS** и следует микросервисной архитектуре Axion Stack.

### Модули

*   **ProjectsService**: CRUD операции для проектов.
*   **GraphOperationsService**: Управление данными графа (узлы, связи, позиции) и версионирование.
*   **GraphServicesService**: Логика извлечения конкретных сервисов из общей структуры графа.
*   **GraphSyncService**: Синхронизация изменений графа с другими компонентами системы.

## Бизнес-логика

### Проекты (Projects)

Проект — это корневая сущность, объединяющая граф архитектуры и настройки инфраструктуры.
*   Каждый проект принадлежит пользователю (`user_id`).
*   Проект содержит ссылку на текущую активную версию графа (`graph_version`).
*   Поддерживает JSONB конфигурацию инфраструктуры.

### Граф (Graph & Versioning)

Граф описывает топологию приложения:
*   **Nodes (Узлы)**: Сервисы, базы данных, очереди сообщений и т.д.
    *   Каждый узел ссылается на `blueprint_id` (шаблон) и содержит конфигурацию.
*   **Edges (Ребра)**: Связи между узлами (сетевые доступы, зависимости).

**Версионирование**:
*   Любое изменение графа создает новую "версию" (snapshot).
*   Поддерживается откат (revert) к любой предыдущей версии.
*   История версий хранится в `graph_versions`.

### Сервисы (Services)

Из графа автоматически извлекаются "Сервисы" — логические единицы развертывания.
Например, если в графе есть нода "PostgreSQL", Graph Service понимает, что это сервис типа `database`.

## Контракты (API)

Контракты определены в пакете `@axion/contracts` (`proto/graph/*.proto`).

### Основные методы (RPC / Kafka)

#### Projects
*   `CreateProject(CreateProjectRequest) -> ProjectResponse`
*   `GetProject(GetProjectRequest) -> ProjectResponse`
*   `UpdateProject(UpdateProjectRequest) -> ProjectResponse`
*   `DeleteProject(DeleteProjectRequest) -> Empty`
*   `ListProjects(ListProjectsRequest) -> ListProjectsResponse`

#### Graph
*   `GetGraph(GetGraphRequest) -> GraphResponse`: Получить текущий граф проекта.
*   `UpdateGraph(UpdateGraphRequest) -> GraphResponse`: Обновить граф (создает новую версию).
*   `ListGraphVersions(ListGraphVersionsRequest) -> ListGraphVersionsResponse`: История изменений.
*   `RevertGraphVersion(RevertGraphVersionRequest) -> GraphResponse`: Откат к версии.

#### Services
*   `ListServices(ListServicesRequest) -> ListServicesResponse`: Список сервисов в проекте (извлеченных из графа).

### Сообщения (Messages)

#### `Project`
```protobuf
message Project {
  string id = 1;
  string user_id = 2;
  string name = 3;
  int32 graph_version = 4;
  map<string, string> infrastructure_config = 5;
  // ... timestamps
}
```

#### `GraphData`
```protobuf
message GraphData {
  repeated Node nodes = 1;
  repeated Edge edges = 2;
}
```

#### `Node`
```protobuf
message Node {
  string id = 1;
  NodeType type = 2; // SERVICE, DATABASE, INGRESS, etc.
  NodeData data = 3;
  Position position = 4; // x, y для UI
}
```

## Хранилище данных (PostgreSQL)

Таблицы (Drizzle Schema):
*   `projects`: Основная таблица проектов.
*   `graph_versions`: Версионированные снимки графов (хранят JSON структуру `nodes` и `edges`).

## Взаимодействия

*   **Auth Service**: Проверка прав доступа к проектам (через токены и ownership).
*   **Deployment Service**: Использует Graph Service для получения топологии, которую нужно развернуть.

## Конфигурация

Переменные окружения (`.env`):

| Переменная | Описание | Обязательно |
| :--- | :--- | :--- |
| `DATABASE_URL` | Строка подключения к PostgreSQL. | Да |
| `KAFKA_BROKERS` | Адреса брокеров Kafka. | Нет (но нужно для событий) |
| `MAX_PROJECTS_PER_USER` | Лимит проектов на одного пользователя. | Нет |
