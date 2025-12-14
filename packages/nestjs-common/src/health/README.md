# Universal Health Module

Универсальный модуль для health checks в NestJS микросервисах. Убирает необходимость создавать health модули для каждого сервиса.

## Использование

```typescript
import { HealthModule } from "@axion/nestjs-common";
import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { getClient } from "@/database/connection";

@Module({
  imports: [
    HealthModule.forRoot({
      serviceName: GRAPH_SERVICE_NAME,
      getDatabaseClient: () => getClient(),
    }),
  ],
})
export class AppModule {}
```

## Преимущества

- ✅ Автоматическая проверка базы данных
- ✅ HTTP и Kafka health check endpoints
- ✅ Поддержка дополнительных проверок
- ✅ Нет необходимости создавать отдельные health модули для каждого сервиса

