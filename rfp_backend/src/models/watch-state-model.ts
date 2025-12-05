import { pgTable, uuid, varchar, bigint, timestamp } from "drizzle-orm/pg-core";

export const watchState = pgTable("watch_state", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailAddress: varchar("email_address", { length: 255 }).notNull().unique(), // Gmail account being watched
  lastHistoryId: varchar("last_history_id", { length: 255 }), // Last processed historyId
  watchExpiration: bigint("watch_expiration", { mode: "number" }), // Expiration timestamp from watch (milliseconds)
  lastRenewedAt: timestamp("last_renewed_at"), // When watch was last renewed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WatchState = typeof watchState.$inferSelect;
export type NewWatchState = typeof watchState.$inferInsert;
