import { pgTable, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("menu_settings", {
  id: integer("id").primaryKey().default(1),
  currency: text("currency").notNull().default("ل.س"),
});
export const insertSettingsSchema = createInsertSchema(settingsTable);
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
