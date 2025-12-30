---
title: "Codegen Service"
description: "Сервис генерации кода и конфигураций (Interface)"
---

# Codegen Service

**Codegen Service** отвечает за генерацию артефактов развертывания (Docker Compose, Kubernetes manifests, Terraform) на основе графа архитектуры (`Blueprint System`).

> **Note**: В текущей версии репозитория реализация сервиса может отсутствовать или находиться в разработке. Данный документ описывает контракт взаимодействия.

## Контракты (API)

Контракты определены в пакете `@axion/contracts` (`proto/codegen/*.proto`).

### Основные методы

#### Generation
*   `GenerateProject(GenerateProjectRequest) -> GenerateProjectResponse`: Генерация кода для всего проекта.
*   `GenerateService(GenerateServiceRequest) -> GenerateServiceResponse`: Генерация для отдельного сервиса.

#### Validation
*   `ValidateProject(ValidateProjectRequest) -> ValidateProjectResponse`: Проверка валидности конфигурации проекта перед генерацией.
*   `ValidateService(ValidateServiceRequest) -> ValidateServiceResponse`.

#### Blueprints
*   `ListBlueprints`: Получение доступных шаблонов (Blueprints).
*   `GetBlueprint`: Детальная схема шаблона.

#### Contracts Discovery
*   `DiscoverContracts`: Анализ сгенерированного кода на наличие контрактов.

## Логика работы (Design)

1.  **Input**: Получает `GraphData` (узлы и связи) и конфигурацию проекта.
2.  **Processing**:
    *   Сопоставляет узлы графа с `Blueprints`.
    *   Генерирует файлы конфигурации (например, `docker-compose.yml`, `nginx.conf`).
    *   Применяет правила валидации.
3.  **Output**: Возвращает набор сгенерированных файлов или архив.

## Взаимодействия

*   **Deployment Service**: Вызывает Codegen для получения конфигураций перед деплоем.
*   **Graph Service**: Предоставляет данные графа.

