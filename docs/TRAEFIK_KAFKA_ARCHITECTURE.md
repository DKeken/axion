# Архитектура взаимодействия Traefik и Kafka

## Важное уточнение

**Traefik и Kafka НЕ общаются напрямую друг с другом.** Они работают на разных уровнях архитектуры и выполняют разные роли.

## Роли компонентов

### Traefik (API Gateway)

- **Назначение**: Единая точка входа для внешних клиентов
- **Протокол**: HTTP/HTTPS, WebSocket
- **Уровень**: Внешний (Client → Service)

### Kafka (Event Bus)

- **Назначение**: Межсервисная коммуникация
- **Протокол**: Kafka Protocol (TCP)
- **Уровень**: Внутренний (Service → Service)

## Архитектура коммуникации

```
┌──────────────┐
│   Клиент     │
│  (Browser)   │
└──────┬───────┘
       │ HTTP/WebSocket
       │
       ▼
┌─────────────────────────────────┐
│      Traefik (API Gateway)       │
│  - Маршрутизация HTTP/WS        │
│  - SSL/TLS termination          │
│  - Load balancing                │
│  - Rate limiting                 │
└──────┬──────────────────────────┘
       │ HTTP/WebSocket (проксирование)
       │
       ▼
┌─────────────────────────────────┐
│   NestJS Service (Graph Service) │
│  ┌───────────────────────────┐  │
│  │ HTTP Server (port 3001)   │  │ ← Traefik проксирует сюда
│  │ - WebSocket Gateway        │  │
│  │ - Health checks            │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Kafka Consumer/Producer    │  │ ← Подключение к Kafka
│  │ - MessagePattern handlers │  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │ Kafka Protocol (TCP)
               │
               ▼
┌─────────────────────────────────┐
│      Kafka (Event Bus)           │
│  - Topics: axion.graph-service  │
│  - Topics: axion.codegen-service│
│  - Topics: axion.deployment-... │
└──────┬──────────────────────────┘
       │ Kafka Protocol (TCP)
       │
       ▼
┌─────────────────────────────────┐
│   Другие NestJS Services        │
│  - Codegen Service              │
│  - Deployment Service           │
│  - Infrastructure Service       │
└─────────────────────────────────┘
```

## Детальное описание потоков

### 1. Внешний запрос (Клиент → Traefik → Service)

```
Клиент (Browser)
    │
    │ HTTP GET /api/graph/projects
    │ WebSocket ws://graph.localhost
    ▼
Traefik (порт 80/443)
    │
    │ Анализирует Host header
    │ Определяет целевой сервис
    │ Проксирует запрос
    ▼
Graph Service (порт 3001)
    │
    │ Обрабатывает HTTP/WebSocket
    │ Возвращает ответ
    ▼
Traefik
    │
    │ Проксирует ответ обратно
    ▼
Клиент
```

**Пример конфигурации Traefik:**

```yaml
# docker-compose.yml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.graph-ws.rule=Host(`graph.localhost`)"
  - "traefik.http.routers.graph-ws.entrypoints=web"
  - "traefik.http.services.graph-ws.loadbalancer.server.port=3001"
```

### 2. Межсервисная коммуникация (Service → Kafka → Service)

```
Graph Service
    │
    │ Нужно вызвать Codegen Service
    │
    │ graphClient.send(
    │   CODEGEN_SERVICE_PATTERNS.GENERATE_CODE,
    │   { projectId, template }
    │ )
    │
    ▼
Kafka Producer
    │
    │ Отправляет сообщение в топик
    │ Topic: axion.codegen-service
    │ Key: projectId
    │ Value: { projectId, template }
    │
    ▼
Kafka Broker (порт 9092)
    │
    │ Сохраняет сообщение в топик
    │ Распределяет по партициям
    │
    ▼
Codegen Service (Kafka Consumer)
    │
    │ Получает сообщение из топика
    │ @MessagePattern(CODEGEN_SERVICE_PATTERNS.GENERATE_CODE)
    │ Обрабатывает запрос
    │
    ▼
Kafka Producer (Codegen Service)
    │
    │ Отправляет ответ в топик
    │ Topic: axion.codegen-service (response)
    │
    ▼
Graph Service (Kafka Consumer)
    │
    │ Получает ответ
    │ Возвращает результат
```

**Пример кода:**

```typescript
// Graph Service отправляет запрос
@Injectable()
export class GraphService {
  constructor(
    @Inject(CODEGEN_SERVICE_NAME)
    private readonly codegenClient: ClientProxy
  ) {}

  async generateCode(projectId: string) {
    // Отправка через Kafka
    return this.codegenClient
      .send(CODEGEN_SERVICE_PATTERNS.GENERATE_CODE, { projectId })
      .toPromise();
  }
}

// Codegen Service получает запрос
@Controller()
export class CodegenController {
  @MessagePattern(CODEGEN_SERVICE_PATTERNS.GENERATE_CODE)
  async generateCode(@Payload() data: GenerateCodeRequest) {
    // Обработка запроса из Kafka
    return this.codegenService.generate(data);
  }
}
```

## Разделение ответственности

### Traefik обрабатывает:

- ✅ HTTP запросы от клиентов (браузер, мобильные приложения)
- ✅ WebSocket соединения для real-time обновлений
- ✅ SSL/TLS termination
- ✅ Load balancing между инстансами сервисов
- ✅ Rate limiting и защита от DDoS
- ✅ Маршрутизация на основе Host header

### Kafka обрабатывает:

- ✅ Межсервисные вызовы (Service → Service)
- ✅ Event sourcing (сохранение событий)
- ✅ CQRS (разделение команд и запросов)
- ✅ Асинхронная обработка задач
- ✅ Гарантия доставки сообщений
- ✅ Масштабирование через партиции

## Почему они не общаются напрямую?

1. **Разные протоколы**:
   - Traefik работает с HTTP/WebSocket
   - Kafka работает с собственным бинарным протоколом

2. **Разные уровни**:
   - Traefik: внешний слой (публичный API)
   - Kafka: внутренний слой (приватная коммуникация)

3. **Разные задачи**:
   - Traefik: маршрутизация внешних запросов
   - Kafka: асинхронная обработка событий

## Пример полного потока

### Сценарий: Клиент создает проект через UI

```
1. Клиент → Traefik
   POST https://graph.localhost/api/projects
   Headers: { Authorization: Bearer token }

2. Traefik → Graph Service
   Проксирует HTTP запрос на порт 3001
   Сохраняет оригинальные headers

3. Graph Service (HTTP Handler)
   - Валидирует токен через Better Auth
   - Создает проект в БД
   - Отправляет событие в Kafka:
     Topic: axion.deployment-service
     Event: PROJECT_CREATED
     Data: { projectId, userId, config }

4. Kafka → Deployment Service
   Deployment Service получает событие
   Создает инфраструктуру для проекта

5. Deployment Service → Kafka
   Отправляет событие:
   Topic: axion.graph-service
   Event: DEPLOYMENT_STARTED
   Data: { projectId, deploymentId }

6. Graph Service → WebSocket (через Traefik)
   Отправляет обновление клиенту через WebSocket
   Клиент видит статус деплоя в real-time
```

## Конфигурация в docker-compose.yml

### Traefik зависит от Kafka

```yaml
traefik:
  depends_on:
    kafka:
      condition: service_healthy
```

**Почему?** Traefik должен запускаться после Kafka, чтобы:

- Убедиться, что инфраструктура готова
- Сервисы могли подключиться к Kafka при старте
- Health checks проходили успешно

Но это **не означает**, что Traefik общается с Kafka напрямую. Это просто зависимость порядка запуска.

## Итоговая схема

```
┌─────────────────────────────────────────────────────────┐
│                    Внешний слой                         │
│  Клиенты → Traefik → Services (HTTP/WebSocket)         │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Services запущены
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Внутренний слой                       │
│  Services ↔ Kafka ↔ Services (Kafka Protocol)          │
└─────────────────────────────────────────────────────────┘
```

**Ключевой момент**: Traefik и Kafka работают параллельно на разных уровнях, не пересекаясь напрямую.

---

## Traefik Service Discovery

### Как Traefik обнаруживает сервисы

Traefik использует **Docker Provider** для автоматического обнаружения сервисов:

1. **Docker Socket**: Traefik подключается к `/var/run/docker.sock` (read-only)
2. **Мониторинг контейнеров**: Отслеживает запуск/остановку/обновление контейнеров в реальном времени
3. **Чтение Labels**: Читает Traefik labels из `docker-compose.yml` или Docker контейнеров
4. **Автоматическая маршрутизация**: Создает роутеры и сервисы на основе labels
5. **Real-time обновления**: Обновляет конфигурацию без перезапуска Traefik

### Конфигурация Traefik

```yaml
traefik:
  command:
    - "--providers.docker=true" # Включить Docker provider
    - "--providers.docker.exposedbydefault=false" # Только сервисы с labels
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro # Доступ к Docker API
```

### Автоматизация конфигурации

Для сокращения бойлерплейта создана система автоматической генерации labels:

**Централизованная конфигурация**: `docker/services.config.ts`

```typescript
export const SERVICES_CONFIG = {
  [GRAPH_SERVICE_NAME]: {
    serviceName: GRAPH_SERVICE_NAME,
    dockerServiceName: "graph-service",
    routerName: "graph",
    host: "graph.localhost",
    port: 3001,
    websocket: true,
    healthCheckPath: "/health",
  },
  // ... другие сервисы
};
```

**Генерация labels**:

```bash
# Просмотр (dry-run)
bun run docker:generate-labels:dry

# Генерация для конкретного сервиса
bun run docker:generate-labels GRAPH_SERVICE

# Генерация для всех сервисов
bun run docker:generate-labels:all
```

**Результат**: Автоматически генерируются все необходимые Traefik labels для сервиса.

Подробнее: [docker/README.md](../../docker/README.md)

---

## Почему НЕ использовать Traefik → Kafka → Services?

### ❌ Проблемы подхода "Traefik → Kafka → Services"

```
Клиент → Traefik → Kafka → Services
```

**Почему это плохая идея:**

1. **Разные протоколы**:
   - Traefik работает с HTTP/WebSocket
   - Kafka использует бинарный протокол (не HTTP)
   - Нужна конвертация протоколов, что добавляет сложность и задержку

2. **Добавление лишнего слоя**:
   - Сервисы уже могут напрямую подключаться к Kafka
   - Traefik как промежуточный слой не добавляет ценности
   - Увеличивает latency и сложность отладки

3. **Потеря преимуществ Kafka**:
   - Kafka работает асинхронно (fire-and-forget)
   - HTTP запросы синхронные (request-response)
   - Конвертация теряет асинхронность

4. **Проблемы с масштабированием**:
   - Kafka партиции распределяют нагрузку автоматически
   - Traefik не понимает партиции Kafka
   - Нарушается балансировка нагрузки

5. **Сложность отладки**:
   - Дополнительный слой усложняет troubleshooting
   - Логи разбросаны по Traefik и Kafka
   - Сложнее отследить поток сообщений

### ✅ Текущая архитектура правильная

```
Клиент → Traefik → Service (HTTP/WebSocket)
                ↓
         Service → Kafka → Service (Kafka Protocol)
```

**Преимущества:**

1. **Разделение ответственности**:
   - Traefik: внешний API (HTTP/WebSocket)
   - Kafka: внутренняя коммуникация (события)

2. **Оптимальная производительность**:
   - Нет лишних конвертаций протоколов
   - Прямое подключение к Kafka
   - Минимальная latency

3. **Гибкость**:
   - Сервисы могут работать независимо
   - Легко масштабировать каждый компонент отдельно
   - Можно использовать разные протоколы для разных задач

4. **Простота отладки**:
   - Четкое разделение: HTTP логи в Traefik, Kafka логи в Kafka
   - Легко отследить поток данных

## Когда Traefik → Kafka имеет смысл?

**Только для внешних клиентов**, которые хотят отправлять события в Kafka через HTTP:

```
Внешний клиент (IoT, мобильное приложение)
    │
    │ HTTP POST /api/events
    ▼
Traefik (API Gateway)
    │
    │ Конвертирует HTTP → Kafka message
    ▼
Kafka (Event Bus)
    │
    │ Распределяет по сервисам
    ▼
Services (обрабатывают события)
```

**Пример использования:**

- IoT устройства отправляют телеметрию через HTTP
- Мобильные приложения отправляют аналитику
- Внешние системы интегрируются через REST API

**Но это НЕ для микросервисов!** Микросервисы должны подключаться к Kafka напрямую.

## Рекомендуемая архитектура

### Для микросервисов (текущая):

```
┌─────────────────────────────────────────┐
│         Внешний слой (HTTP)             │
│  Клиенты → Traefik → Services           │
└─────────────────────────────────────────┘
                    │
                    │ Services запущены
                    ▼
┌─────────────────────────────────────────┐
│      Внутренний слой (Kafka)            │
│  Services ↔ Kafka ↔ Services            │
│  (прямое подключение, без Traefik)      │
└─────────────────────────────────────────┘
```

### Для внешних клиентов (опционально):

```
┌─────────────────────────────────────────┐
│    Внешние клиенты (HTTP → Kafka)       │
│  IoT/Mobile → Traefik → Kafka           │
│  (только для событий, не для RPC)       │
└─────────────────────────────────────────┘
```

## Итоговые рекомендации

### ✅ Делайте так:

1. **Traefik для HTTP/WebSocket**:
   - Внешние запросы от клиентов
   - WebSocket для real-time обновлений
   - Health checks и мониторинг

2. **Kafka для межсервисной коммуникации**:
   - Прямое подключение сервисов к Kafka
   - Асинхронная обработка событий
   - Event sourcing и CQRS

3. **Разделение уровней**:
   - Внешний слой: Traefik
   - Внутренний слой: Kafka
   - Не смешивать!

### ❌ Не делайте так:

1. **Traefik → Kafka → Services**:
   - Лишний слой для микросервисов
   - Потеря производительности
   - Усложнение архитектуры

2. **HTTP между сервисами**:
   - Нарушает принцип event-driven архитектуры
   - Создает жесткие зависимости
   - Усложняет масштабирование

## Вывод

**Текущая архитектура правильная и оптимальная.** Traefik и Kafka работают на разных уровнях и не должны пересекаться для микросервисной коммуникации. Использование Traefik как прокси для Kafka имеет смысл только для внешних клиентов, которые не могут напрямую подключаться к Kafka.
