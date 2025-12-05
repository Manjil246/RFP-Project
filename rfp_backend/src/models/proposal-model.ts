import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { rfps } from "./rfp-model";
import { vendors } from "./vendor-model";

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  rfpId: uuid("rfp_id")
    .notNull()
    .references(() => rfps.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  emailSubject: varchar("email_subject", { length: 500 }),
  emailBody: text("email_body"),
  emailMessageId: varchar("email_message_id", { length: 255 }), // For tracking/threading
  extractedData: jsonb("extracted_data"), // AI parsed data: pricing, terms, delivery, etc.
  rawAttachments: jsonb("raw_attachments"), // Metadata about attachments
  parsedAt: timestamp("parsed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type inference for TypeScript
export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;

