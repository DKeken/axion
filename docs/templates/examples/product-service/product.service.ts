// src/modules/product/product.service.ts
// Сгенерировано из: blueprints/crud-service/service.ts.mdx
// LLM сгенерировал только методы (между маркерами)

import { ProductRepository } from "../../database/repository";
import {
  CreateProductDto,
  UpdateProductDto,
  Product,
} from "../../database/schema";

export class ProductService {
  constructor(private repository: ProductRepository) {}

  // ============================================
  // LLM ГЕНЕРИРУЕТ ТОЛЬКО МЕТОДЫ НИЖЕ
  // ============================================

  async create(data: CreateProductDto): Promise<Product> {
    // Валидация
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Product name is required");
    }

    if (data.price <= 0) {
      throw new Error("Product price must be positive");
    }

    // Сохранение
    return await this.repository.create(data);
  }

  async getById(id: string): Promise<Product | null> {
    const product = await this.repository.findById(id);

    if (!product) {
      return null;
    }

    return product;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ products: Product[]; total: number }> {
    return await this.repository.findAll(options);
  }

  async update(id: string, data: UpdateProductDto): Promise<Product | null> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      return null;
    }

    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      return false;
    }

    return await this.repository.delete(id);
  }

  // ============================================
  // Конец LLM генерации
  // ============================================
}
