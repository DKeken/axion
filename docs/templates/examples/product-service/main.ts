// src/main.ts
// Сгенерировано из: components/main-entry.mdx
// Конфигурация: SERVICE_NAME=product-service, PROJECT_ID={project_id}

import { Elysia } from "elysia";
import { HttpRpcServer } from "./messaging/http-rpc-server";
import { ProductService } from "./modules/product/product.service";
import { ProductRepository } from "./database/repository";
import { healthCheck } from "./health/health.check";

const app = new Elysia();

// Health check endpoint
app.get("/health", healthCheck);

// HTTP RPC router для межсервисного общения внутри Docker/Swarm
const rpcServer = new HttpRpcServer({ pathPrefix: "/rpc" });
rpcServer.attach(app);

// Инициализация сервиса
const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);

// Регистрация handlers
rpcServer.registerHandler("product-service.create", async (data) => {
  return await productService.create(data);
});

rpcServer.registerHandler("product-service.getById", async (data) => {
  return await productService.getById(data.id);
});

rpcServer.registerHandler("product-service.findAll", async (data) => {
  return await productService.findAll(data);
});

rpcServer.registerHandler("product-service.update", async (data) => {
  return await productService.update(data.id, data);
});

rpcServer.registerHandler("product-service.delete", async (data) => {
  return await productService.delete(data.id);
});

// Запуск приложения
const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, () => {
  console.log(`product-service started on port ${port}`);
});
