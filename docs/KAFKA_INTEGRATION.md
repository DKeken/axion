# Kafka Integration Guide

## Архитектура коммуникации

Все микросервисы в Axion Stack общаются **только через Kafka**, прямые HTTP вызовы между сервисами запрещены.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Traefik   │────────▶│    Kafka    │────────▶│  Services   │
│ (edge HTTP) │  HTTP   │  Event Bus  │  Kafka  │  (NestJS)   │
└─────────────┘         └─────────────┘         └─────────────┘
     │                        │                        │
     │                        │                        │
     └────────────────────────┴────────────────────────┘
                    WebSocket (через Traefik)
```

## Правила коммуникации

### ✅ Разрешено

1. **Клиент → Traefik → Service**: HTTP/WebSocket запросы от клиентов
2. **Service → Kafka → Service**: Все межсервисные коммуникации через Kafka
3. **Service → External APIs**: Внешние API вызовы (OpenRouter, Docker Hub и т.д.)

### ❌ Запрещено

1. **Service → Service (прямой HTTP)**: Запрещены прямые HTTP вызовы между сервисами
2. **Service → Service (gRPC)**: Используется только Kafka для межсервисной коммуникации

## Конфигурация Kafka

### Docker Compose

Kafka настроен в `docker-compose.yml` с следующими параметрами:

- **Mode**: KRaft (без Zookeeper)
- **Port**: `9092` (проброшен на хост через port mapping)
- **Advertised Listeners**: `kafka:9092` (для Docker сети)
- **Auto-create topics**: Включено
- **Replication**: 1 (для development)
- **ACLs**: Отключены для development (KRaft mode)

**Важно**:

- Клиенты с хоста должны использовать `localhost:9092` как bootstrap server
- Клиенты из Docker должны использовать `kafka:9092`
- Kafka вернет `kafka:9092` в метаданных, но клиенты с хоста могут продолжать использовать `localhost:9092` для подключения

### Переменные окружения

```bash
# Kafka brokers (через запятую для кластера)
# Для локального запуска (вне Docker): localhost:9092
# Для запуска в Docker: kafka:9092
KAFKA_BROKERS=localhost:9092

# Опционально: SASL аутентификация
KAFKA_SASL_USERNAME=admin
KAFKA_SASL_PASSWORD=admin-password
KAFKA_SASL_MECHANISM=scram-sha-512

# Подавление предупреждений KafkaJS
KAFKAJS_NO_PARTITIONER_WARNING=1
```

**Важно**:

- При локальном запуске сервиса (вне Docker) используйте `localhost:9092`
- При запуске сервиса в Docker используйте `kafka:9092`
- Убедитесь, что Kafka доступен по указанному адресу

## Использование в NestJS сервисах

### Server (прием сообщений)

```typescript
import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { createKafkaServerOptions } from "@axion/shared";
import { NestFactory } from "@nestjs/core";
import type { MicroserviceOptions } from "@nestjs/microservices";

const app = await NestFactory.create(AppModule);

// Подключение Kafka microservice
const kafkaBrokers = process.env.KAFKA_BROKERS || "localhost:9092";
app.connectMicroservice<MicroserviceOptions>(
  createKafkaServerOptions(GRAPH_SERVICE_NAME, kafkaBrokers)
);

await app.startAllMicroservices();
```

### Controller (обработка сообщений)

```typescript
import { GRAPH_SERVICE_PATTERNS } from "@axion/contracts";
import { Controller, MessagePattern, Payload } from "@nestjs/microservices";

@Controller()
export class GraphController {
  @MessagePattern(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
  async createProject(@Payload() data: CreateProjectRequest) {
    // Обработка сообщения из Kafka
    return this.graphService.createProject(data);
  }
}
```

### Client (отправка сообщений)

```typescript
import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { createKafkaClientOptions } from "@axion/shared";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class SomeService {
  constructor(
    @Inject(GRAPH_SERVICE_NAME)
    private readonly graphClient: ClientProxy
  ) {}

  async callGraphService() {
    // Отправка сообщения через Kafka
    return this.graphClient
      .send(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT, requestData)
      .toPromise();
  }
}
```

### Module (регистрация клиента)

```typescript
import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { createKafkaClientOptions } from "@axion/shared";
import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";

@Module({
  imports: [
    ClientsModule.register([
      createKafkaClientOptions(
        GRAPH_SERVICE_NAME,
        process.env.KAFKA_BROKERS || "localhost:9092"
      ),
    ]),
  ],
})
export class SomeModule {}
```

## Traefik Integration

### WebSocket через Traefik

WebSocket соединения проксируются через Traefik для единой точки входа:

```yaml
# docker-compose.yml labels для сервиса
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.graph-ws.rule=Host(`graph.localhost`)"
  - "traefik.http.routers.graph-ws.entrypoints=web"
  - "traefik.http.services.graph-ws.loadbalancer.server.port=3001"
  # WebSocket support
  - "traefik.http.middlewares.graph-ws-headers.headers.customrequestheaders.X-Forwarded-Proto=http"
```

### Trusted Origins

Сервисы должны доверять запросам от Traefik:

```typescript
trustedOrigins: [
  "http://localhost:3000",
  "http://traefik.localhost",
  "https://traefik.localhost",
];
```

## Отладка

### Проверка подключения к Kafka

```bash
# Проверка healthcheck Kafka
docker exec axion-kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Просмотр топиков
docker exec axion-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Просмотр сообщений в топике
docker exec axion-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic axion.graph-service \
  --from-beginning
```

### Kafka UI

Доступен через Traefik: `http://kafka-ui.localhost` или напрямую: `http://localhost:8081`

### Логи

```bash
# Логи Kafka
docker logs -f axion-kafka

# Логи сервиса
bun run dev
```

## Troubleshooting

### Проблема: Отрицательный таймаут

**Симптом**: `TimeoutNegativeWarning: -1765571462421 is a negative number`

**Решение**:

- Убедитесь, что `maxWaitTimeInMs` всегда положительное значение (минимум 1000ms)
- Проблема может быть связана с Socket.IO connectionStateRecovery (уже отключено в конфигурации)
- Если проблема сохраняется, проверьте версию Socket.IO и обновите при необходимости

### Проблема: ENOTFOUND kafka

**Симптом**: `getaddrinfo ENOTFOUND kafka`

**Решение**:

- При локальном запуске сервиса (вне Docker) используйте `KAFKA_BROKERS=localhost:9092`
- При запуске в Docker используйте `KAFKA_BROKERS=kafka:9092`
- Убедитесь, что Kafka запущен и доступен: `docker ps | grep kafka`

### Проблема: Сервис не получает сообщения

**Проверка**:

1. Kafka запущен и доступен
2. Топик создан: `kafka-topics --list`
3. Consumer group активен: проверьте логи сервиса
4. MessagePattern совпадает с отправляемым паттерном

### Проблема: WebSocket не работает через Traefik

**Проверка**:

1. Traefik labels настроены правильно
2. `trustedOrigins` включает Traefik URL
3. WebSocket upgrade headers передаются корректно

## Best Practices

1. **Всегда используйте константы из `@axion/contracts`** для MessagePattern
2. **Типизируйте payload** через Protobuf типы
3. **Обрабатывайте ошибки** через `handleServiceError`
4. **Логируйте входящие сообщения** в контроллерах
5. **Используйте idempotent producer** для гарантий exactly-once delivery
6. **Настройте retry policy** для надежности

## Production Considerations

1. **SASL/SSL**: Включите аутентификацию и шифрование
2. **Replication**: Увеличьте replication factor до 3
3. **Partitions**: Настройте количество партиций по нагрузке
4. **Monitoring**: Настройте метрики Kafka (JMX)
5. **Backup**: Настройте retention policy для важных топиков
