// src/database/schema.ts
// Сгенерировано из: components/drizzle/schema.md
// Конфигурация: из UI формы пользователя

import {
  pgTable,
  uuid,
  varchar,
  text,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  price: doublePrecision("price").notNull(),
  description: text("description"),
  category_id: uuid("category_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type CreateProductDto = typeof products.$inferInsert;
export type UpdateProductDto = Partial<CreateProductDto>;
