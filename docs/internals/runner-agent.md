---
title: "Runner Agent"
description: "Техническая реализация агента развертывания (Rust, Docker Swarm)."
---

# Runner Agent (Internals)

**Runner Agent** — это системный демон, написанный на **Rust**, отвечающий за управление жизненным циклом приложений на серверах пользователя.

## Компоненты

### 1. gRPC Client (Command Channel)
Поддерживает постоянное двунаправленное соединение с Control Plane.
- **Heartbeats**: Каждые 5 секунд отправляет статус "Alive".
- **Immediate Actions**: Получает команды на немедленное действие (например, "Stop Container").

### 2. Kafka Consumer (Deployment Channel)
Подписан на топик `runner.commands.{agent_id}`. Используется для получения тяжелых пейлоадов, таких как манифесты развертывания (Docker Compose файлы).
- **Гарантия доставки**: Использует Kafka Consumer Groups для гарантированной обработки команд.

### 3. Telemetry Collector
Фоновый поток, собирающий метрики хоста и контейнеров.
- **Стек**: Использование `cgroups` (v2) для чтения статистики Docker-контейнеров без обращения к Docker API (для производительности).
- **Метрики**: CPU Usage, Memory Usage, Disk I/O, Network I/O.

### 4. Swarm Manager
Модуль взаимодействия с Docker Engine.
- **API**: Использует `bollard` (Rust Docker Client).
- **Функции**: Выполняет эквиваленты команд `docker stack deploy`, `docker service scale`, `docker service logs`.

---

## Процесс установки

Установка агента полностью автоматизирована и идемпотентна.

1.  **SSH Handshake**: Control Plane подключается к серверу.
2.  **Arch Detection**: `uname -m` определяет архитектуру (`x86_64` / `aarch64`).
3.  **Binary Download**: Загрузка статического бинарника (Musl-linked) с CDN.
4.  **Systemd Unit**: Создание и запуск сервиса `axion-agent.service`.
5.  **Enrollment**: Агент генерирует ключи, стучится в API и регистрирует себя как "Ready".

## Безопасность

*   **Static Binary**: Бинарный файл не имеет внешних зависимостей (libc вшит), что исключает атаки через подмену библиотек.
*   **Socket Access**: Работает от пользователя `axion`, имеет доступ только к `/var/run/docker.sock`.
*   **MTLS**: Взаимодействие с Kafka и gRPC защищено взаимным TLS (mTLS).
*   **Signature Verification**: Перед обновлением агент проверяет цифровую подпись нового бинарного файла.
