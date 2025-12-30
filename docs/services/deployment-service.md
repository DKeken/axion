---
title: "Deployment Service"
description: "Сервис оркестрации развертываний"
---

# Deployment Service

**Deployment Service** отвечает за процесс развертывания приложений (проектов) на инфраструктуру. Он координирует действия между генерацией кода, инфраструктурой и агентами исполнения.

## Архитектура

Сервис построен на **NestJS** и использует **BullMQ (Redis)** для управления очередями задач развертывания.

### Модули

*   **DeploymentModule**: Основная логика управления жизненным циклом деплоя.
*   **BullMQ**: Обработка фоновых задач (длительные процессы деплоя).
*   **ClientsModule**: Kafka клиенты для связи с другими сервисами.

## Бизнес-логика

### Процесс развертывания (Deployment Flow)

1.  **Initiation**: Пользователь инициирует деплой (`DeployProject`).
2.  **Validation**: Сервис проверяет состояние проекта через `GraphService` и доступность ресурсов через `InfrastructureService`.
3.  **Codegen**: Отправляет запрос в `CodegenService` (если есть) для генерации конфигураций (Docker Compose, K8s manifests).
4.  **Infrastructure Prep**: Запрашивает подготовку серверов у `InfrastructureService`.
5.  **Execution**: Отправляет команды в `RunnerAgent` (на целевые серверы) для применения конфигураций (например, `docker stack deploy`).
6.  **Monitoring**: Отслеживает статус выполнения и обновляет статус деплоя в БД.

### Статусы деплоя

*   `PENDING`: В очереди.
*   `BUILDING`: Сборка артефактов / генерация конфигов.
*   `DEPLOYING`: Применение на серверах.
*   `SUCCESS`: Успешно завершен.
*   `FAILED`: Произошла ошибка.
*   `CANCELLED`: Отменен пользователем.

### Rollback (Откат)

Поддерживается откат к предыдущему успешному деплою. Это инициирует новый процесс деплоя, используя конфигурацию и версию графа из выбранного исторического деплоя.

## Контракты (API)

Контракты определены в пакете `@axion/contracts` (`proto/deployment/*.proto`).

### Основные методы

#### Deploy
*   `DeployProject(DeployProjectRequest) -> DeployProjectResponse`: Запуск нового деплоя.
*   `CancelDeployment(CancelDeploymentRequest) -> Empty`: Отмена активного деплоя.

#### Management
*   `GetDeployment(GetDeploymentRequest) -> DeploymentResponse`: Детали конкретного деплоя.
*   `ListDeployments(ListDeploymentsRequest) -> ListDeploymentsResponse`: История деплоев проекта.
*   `GetDeploymentStatus(GetDeploymentStatusRequest) -> DeploymentStatusResponse`: Текущий статус (для поллинга).

#### Rollback
*   `RollbackDeployment(RollbackDeploymentRequest) -> RollbackDeploymentResponse`.

### Сообщения

#### `DeployProjectRequest`
```protobuf
message DeployProjectRequest {
  string project_id = 1;
  string commit_hash = 2; // Опционально, если привязано к Git
  string environment = 3; // "production", "staging"
}
```

## Зависимости

*   **Graph Service**: Получение конфигурации проекта.
*   **Infrastructure Service**: Инфо о серверах.
*   **Runner Agent**: Исполнение команд на серверах.
*   **Redis**: Очереди задач.
*   **PostgreSQL**: История деплоев и логи.

## Конфигурация

Переменные окружения (`.env`):

| Переменная | Описание | Обязательно |
| :--- | :--- | :--- |
| `DATABASE_URL` | Строка подключения к PostgreSQL. | Да |
| `REDIS_URL` | Строка подключения к Redis (для BullMQ). | Нет (использует дефолт localhost:6379) |
| `KAFKA_BROKERS` | Адреса брокеров Kafka. | Нет |
| `MAX_DEPLOYMENTS_PER_PROJECT` | Лимит истории деплоев (ротация). | Нет |
