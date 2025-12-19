# Integration Tests

Integration tests для проверки взаимодействия между компонентами системы.

## Структура

```
tests/integration/
├── kafka/
│   ├── message-pattern.test.ts    # Тесты Kafka MessagePattern handlers
│   └── dlq.test.ts                # Тесты Dead Letter Queue
├── database/
│   ├── repository.test.ts        # Тесты Repository pattern
│   └── transactions.test.ts       # Тесты транзакций
└── README.md                      # Этот файл
```

## Запуск тестов

```bash
# Все integration тесты
bun test tests/integration

# Только Kafka тесты
bun test tests/integration/kafka

# Только Database тесты
bun test tests/integration/database
```

## Prerequisites

1. **Test Database** - отдельная БД для тестов
2. **Test Kafka** - изолированный Kafka для тестов
3. **Test Redis** - отдельный Redis для BullMQ

## Environment Variables

- `TEST_DATABASE_URL` - URL тестовой БД
- `TEST_KAFKA_BROKERS` - Kafka brokers для тестов
- `TEST_REDIS_URL` - Redis URL для тестов
