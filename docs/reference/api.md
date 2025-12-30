---
title: "API Reference"
description: "Справочник по HTTP API сервисов Control Plane."
---

# API Reference

Все микросервисы Axion доступны через единый API Gateway (Traefik).

## Базовые параметры

*   **Gateway URL**: `http://traefik.localhost:8080`
*   **Auth Header**: `Authorization: Bearer <token>`
*   **Response Format**: JSON Envelope

```json
{
  "result": {
    "success": { "data": { ... } },
    "error": null
  }
}
```

---

## Сервисы

### Graph Service (`/api/v1/graph`)

Управление проектами и версиями графов.

| Метод | Путь | Описание |
| :--- | :--- | :--- |
| `GET` | `/projects` | Получить список проектов текущего пользователя. |
| `POST` | `/projects` | Создать новый проект. |
| `GET` | `/projects/:id` | Получить метаданные проекта. |
| `GET` | `/projects/:id/graph` | Получить текущую (HEAD) версию графа. |
| `PUT` | `/projects/:id/graph` | Сохранить новую версию графа (создает коммит). |

### Codegen Service (`/api/v1/codegen`)

Генерация кода и валидация.

| Метод | Путь | Описание |
| :--- | :--- | :--- |
| `POST` | `/projects/:id/generate` | Запустить процесс генерации кода (асинхронно). |
| `POST` | `/projects/:id/validate` | Запустить валидацию текущего графа. |
| `GET` | `/blueprints` | Получить список доступных архитектурных шаблонов. |

### Infrastructure Service (`/api/v1/infrastructure`)

Управление серверами и агентами.

| Метод | Путь | Описание |
| :--- | :--- | :--- |
| `POST` | `/servers` | Зарегистрировать новый SSH-сервер. |
| `GET` | `/servers` | Список серверов и их статус (Health). |
| `POST` | `/servers/:id/bootstrap` | Запустить установку Runner Agent на сервере. |
| `GET` | `/clusters` | Список кластеров Docker Swarm. |

---

## Swagger UI

Для интерактивного взаимодействия используйте Swagger интерфейсы сервисов (доступны в Dev-режиме):

*   **Graph Service**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
*   **Codegen Service**: [http://localhost:3002/api-docs](http://localhost:3002/api-docs)
*   **Infrastructure**: [http://localhost:3004/api-docs](http://localhost:3004/api-docs)
*   **Deployment**: [http://localhost:3005/api-docs](http://localhost:3005/api-docs)
