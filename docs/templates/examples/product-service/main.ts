// src/main.ts
// Сгенерировано из: components/main-entry.md
// Конфигурация: SERVICE_NAME=product-service, PROJECT_ID={project_id}

import { Elysia } from "elysia";
import { RabbitMQServer } from "./messaging/server";
import { ProductService } from "./modules/product/product.service";
import { ProductRepository } from "./database/repository";
import { healthCheck } from "./health/health.check";

const app = new Elysia();

// Health check endpoint
app.get("/health", healthCheck);

// RabbitMQ сервер для межсервисного общения
const rabbitMQServer = new RabbitMQServer({
  url: process.env.RABBITMQ_URL!,
  vhost: `project_${process.env.PROJECT_ID}`,
});

// Инициализация сервиса
const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);

// Регистрация handlers
rabbitMQServer.registerHandler("product-service.create", async (data) => {
  return await productService.create(data);
});

rabbitMQServer.registerHandler("product-service.getById", async (data) => {
  return await productService.getById(data.id);
});

rabbitMQServer.registerHandler("product-service.findAll", async (data) => {
  return await productService.findAll(data);
});

rabbitMQServer.registerHandler("product-service.update", async (data) => {
  return await productService.update(data.id, data);
});

rabbitMQServer.registerHandler("product-service.delete", async (data) => {
  return await productService.delete(data.id);
});

// Запуск приложения
const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, () => {
  console.log(`product-service started on port ${port}`);
});

// Запуск RabbitMQ сервера
rabbitMQServer.start().catch((error) => {
  console.error("Failed to start RabbitMQ server:", error);
  process.exit(1);
});
