import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  jsonb,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { proposals } from "./proposal-model";
import { rfpLineItems } from "./rfp-line-item-model";

export const proposalLineItems = pgTable("proposal_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  rfpLineItemId: uuid("rfp_line_item_id")
    .references(() => rfpLineItems.id, { onDelete: "set null" }), // Links to what was requested
  itemName: varchar("item_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }),
  specifications: jsonb("specifications"), // Vendor's specs
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type inference for TypeScript
export type ProposalLineItem = typeof proposalLineItems.$inferSelect;
export type NewProposalLineItem = typeof proposalLineItems.$inferInsert;

