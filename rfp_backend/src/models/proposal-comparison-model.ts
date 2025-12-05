import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { rfps } from "./rfp-model";

export const proposalComparisons = pgTable("proposal_comparisons", {
  id: uuid("id").defaultRandom().primaryKey(),
  rfpId: uuid("rfp_id")
    .notNull()
    .references(() => rfps.id, { onDelete: "cascade" })
    .unique(), // One comparison per RFP
  proposalIds: jsonb("proposal_ids").notNull(), // Array of proposal IDs
  comparisonData: jsonb("comparison_data").notNull(), // Structured comparison
  recommendation: jsonb("recommendation").notNull(), // AI recommendation
  proposalHashes: jsonb("proposal_hashes").notNull(), // Hash of each proposal for change detection (kept for backward compatibility)
  compared: boolean("compared").default(false).notNull(), // Flag to track if comparison is up-to-date
  computedAt: timestamp("computed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type inference for TypeScript
export type ProposalComparison = typeof proposalComparisons.$inferSelect;
export type NewProposalComparison = typeof proposalComparisons.$inferInsert;

