---
title: "Runner Agent"
description: "Агент исполнения на целевых серверах"
---

# Runner Agent

**Runner Agent** — это легковесный, высокопроизводительный демон, написанный на **Rust**, который работает непосредственно на серверах пользователя. Он выполняет команды, полученные от Control Plane, и управляет Docker Swarm / контейнерами.

## Технологический стек

- **Язык**: Rust.
- **Сборка**: Статический бинарный файл (musl), без внешних зависимостей.
- **Коммуникация**: gRPC (Control Channel) и Kafka (Data Channel).
- **Runtime**: Docker Engine (через Docker Socket).

## Архитектура и Компоненты

### 1. gRPC Client (Command Channel)

Поддерживает постоянное соединение с Control Plane.

- **Heartbeats**: Каждые 5 секунд отправляет сигнал "Alive".
- **Immediate Actions**: Получение быстрых команд (Stop, Restart, Logs).

### 2. Kafka Consumer (Deployment Channel)

Подписка на топик `runner.commands.{agent_id}`.

- Получает "тяжелые" команды, например, манифесты развертывания (Docker Compose файлы).
- Гарантирует доставку и последовательность выполнения.

### 3. Swarm Manager

Модуль взаимодействия с Docker Engine через библиотеку `bollard`.

- Управляет Docker Swarm (init, join, leave).
- Развертывает стеки (`docker stack deploy` эквивалент).
- Масштабирует сервисы.

### 4. Telemetry Collector

Фоновый сбор метрик хоста и контейнеров.

- Использует `cgroups v2` для чтения статистики напрямую (минимальный оверхед).
- Метрики: CPU, RAM, Disk I/O, Network.

## Процесс работы

1.  **Bootstrap**: Агент устанавливается `Infrastructure Service` через SSH.
2.  **Enrollment**: При первом запуске регистрируется в Control Plane, используя выданный токен.
3.  **Loop**:
    - Слушает Kafka и gRPC.
    - Отправляет телеметрию и хартбиты.
    - При получении `Deploy` команды -> применяет Docker Compose конфигурацию в локальный Swarm/Docker.

## Безопасность

- **Isolation**: Работает от пользователя `axion` (не root, но в группе docker).
- **mTLS**: Все соединения с Control Plane шифруются.
- **Static Binary**: Не подвержен атакам через подмену системных библиотек (DLL hijacking и т.п.), так как все слинковано статически.

## Конфигурация

Агент конфигурируется через файл `/etc/axion/agent.toml` или переменные окружения `AXION_AGENT__*`.

```toml
[agent]
token = "..."

[kafka]
brokers = ["host:9092"]

[control_plane]
grpc_url = "https://control.axion.dev"
```

### Переменные окружения

Все параметры конфигурации можно переопределить через ENV (префикс `AXION_AGENT__`).

| Переменная | Точка в TOML | Описание |
| :--- | :--- | :--- |
| `AXION_AGENT__AGENT__TOKEN` | `agent.token` | Токен авторизации агента. |
| `AXION_AGENT__CONTROL_PLANE__GRPC_URL` | `control_plane.grpc_url` | URL gRPC сервера Control Plane. |
| `AXION_AGENT__KAFKA__BROKERS` | `kafka.brokers` | Список Kafka брокеров (запятая-разделитель). |
| `AXION_AGENT__LOCAL__ENABLED` | `local.enabled` | Включить режим локальной разработки (IPC). |
