import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  date,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const rfpStatusEnum = pgEnum("rfp_status", [
  "draft",
  "sent",
  "in_review",
  "closed",
]);

export const rfps = pgTable("rfps", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  deadline: date("deadline"),
  paymentTerms: varchar("payment_terms", { length: 255 }),
  warranty: varchar("warranty", { length: 255 }),
  otherTerms: jsonb("other_terms"), // Flexible for additional terms
  status: rfpStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
});

// Type inference for TypeScript
export type RFP = typeof rfps.$inferSelect;
export type NewRFP = typeof rfps.$inferInsert;

