import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { rfps } from "./rfp-model";

export const rfpLineItems = pgTable("rfp_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  rfpId: uuid("rfp_id")
    .notNull()
    .references(() => rfps.id, { onDelete: "cascade" }),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  specifications: jsonb("specifications"), // e.g., {ram: "16GB", size: "27-inch"}
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type inference for TypeScript
export type RFPLineItem = typeof rfpLineItems.$inferSelect;
export type NewRFPLineItem = typeof rfpLineItems.$inferInsert;

