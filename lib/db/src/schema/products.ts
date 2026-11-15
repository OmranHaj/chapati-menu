import { pgTable, serial, text, integer, boolean, numeric, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("menu_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull().default(""),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id, { onDelete: "restrict" }),
  imageUrl: text("image_url").notNull().default(""),
  available: boolean("available").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  badge: text("badge").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check("menu_products_price_nonnegative", sql`${table.price} >= 0`)]);
export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
