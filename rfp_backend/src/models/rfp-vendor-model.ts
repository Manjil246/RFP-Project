import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  varchar,
} from "drizzle-orm/pg-core";
import { rfps } from "./rfp-model";
import { vendors } from "./vendor-model";

export const emailStatusEnum = pgEnum("email_status", [
  "pending",
  "sent",
  "failed",
]);

export const rfpVendors = pgTable("rfp_vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  rfpId: uuid("rfp_id")
    .notNull()
    .references(() => rfps.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  emailSentAt: timestamp("email_sent_at"),
  emailMessageId: varchar("email_message_id", { length: 500 }), // Store Message-ID for matching replies
  emailStatus: emailStatusEnum("email_status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type inference for TypeScript
export type RFPVendor = typeof rfpVendors.$inferSelect;
export type NewRFPVendor = typeof rfpVendors.$inferInsert;

