---
title: "Infrastructure Service"
description: "Сервис управления физической инфраструктурой"
---

# Infrastructure Service

**Infrastructure Service** управляет инвентарем серверов, кластеров и агентов. Он отвечает за регистрацию новых серверов, установку агентов (`axion-agent`) и мониторинг состояния "железа".

## Архитектура

Сервис построен на **NestJS**. Критическая особенность — работа с **SSH** для начальной настройки серверов.

### Модули

*   **InfrastructureModule**: Управление CRUD сущностей (Server, Cluster).
*   **BullMQ**: Очереди для SSH задач (подключение, установка агента).
*   **ClientsModule**: Kafka клиенты.

## Бизнес-логика

### Иерархия
*   **Cluster**: Логическая группа серверов (например, "Prod Cluster", "Dev Cluster").
*   **Server**: Физический или виртуальный сервер (VPS/VM/Bare Metal).
    *   Привязан к одному кластеру.
    *   Имеет IP, SSH credentials (хранятся безопасно/зашифровано).

### Установка Агента (Agent Installation)

Процесс "Bootstrap" нового сервера:
1.  Пользователь добавляет сервер (IP, User, SSH Key/Password).
2.  Сервис создает задачу в BullMQ.
3.  Воркер подключается по SSH.
4.  Проверяет системные требования (Docker, OS version).
5.  Скачивает и устанавливает `axion-agent` (binary).
6.  Настраивает systemd service.
7.  Агент запускается и регистрируется обратно в системе.

### Мониторинг

*   Принимает Heartbeats от агентов.
*   Отслеживает статус `ONLINE` / `OFFLINE`.
*   Собирает базовые метрики (CPU/RAM/Disk) через агентов.

## Контракты (API)

Контракты определены в пакете `@axion/contracts` (`proto/infrastructure/*.proto`).

### Основные методы

#### Clusters
*   `CreateCluster` / `UpdateCluster` / `DeleteCluster` / `GetCluster` / `ListClusters`.
*   `ListClusterServers`: Получить все серверы в кластере.

#### Servers
*   `CreateServer`: Добавить сервер в инвентарь.
*   `TestServerConnection`: Проверить SSH доступ.
*   `ConfigureServer`: Запустить настройку.

#### Agents
*   `InstallAgent`: Принудительная установка агента.
*   `GetAgentStatus`.

#### System Requirements
*   `CalculateSystemRequirements`: Расчет необходимых ресурсов для графа (примерная оценка).

## Безопасность

*   **SSH Keys**: Приватные ключи для доступа к серверам должны храниться в зашифрованном виде (в текущей реализации стоит проверить механизм шифрования в `infrastructure-service`).
*   **Agent Tokens**: При установке агенту выдается токен для авторизации в `RunnerAgentService` (или напрямую через Kafka).

## Хранилище

*   `clusters`: Таблица кластеров.
*   `servers`: Таблица серверов (IP, credentials, status).

## Конфигурация

Переменные окружения (`.env`):

| Переменная | Описание | Обязательно |
| :--- | :--- | :--- |
| `DATABASE_URL` | Строка подключения к PostgreSQL. | Да |
| `REDIS_URL` | Строка подключения к Redis. | Нет |
| `KAFKA_BROKERS` | Адреса брокеров Kafka. | Нет |
| `MAX_SERVERS_PER_USER` | Лимит серверов на пользователя. | Нет |
