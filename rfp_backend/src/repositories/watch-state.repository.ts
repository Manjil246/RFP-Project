import { eq } from "drizzle-orm";
import { db } from "../database/sql-db";
import { watchState } from "../models";
import { WatchState, NewWatchState } from "../models/watch-state-model";

export class WatchStateRepository {
  /**
   * Get watch state for an email address
   */
  async getWatchState(emailAddress: string): Promise<WatchState | null> {
    const [state] = await db
      .select()
      .from(watchState)
      .where(eq(watchState.emailAddress, emailAddress))
      .limit(1);
    return state || null;
  }

  /**
   * Create or update watch state
   */
  async upsertWatchState(data: {
    emailAddress: string;
    lastHistoryId?: string | null;
    watchExpiration?: number | null;
    lastRenewedAt?: Date | null;
  }): Promise<WatchState> {
    const existing = await this.getWatchState(data.emailAddress);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(watchState)
        .set({
          lastHistoryId: data.lastHistoryId ?? existing.lastHistoryId,
          watchExpiration: data.watchExpiration ?? existing.watchExpiration,
          lastRenewedAt: data.lastRenewedAt ?? existing.lastRenewedAt,
          updatedAt: new Date(),
        })
        .where(eq(watchState.emailAddress, data.emailAddress))
        .returning();
      return updated;
    } else {
      // Create new
      const newState: NewWatchState = {
        emailAddress: data.emailAddress,
        lastHistoryId: data.lastHistoryId ?? null,
        watchExpiration: data.watchExpiration ?? null,
        lastRenewedAt: data.lastRenewedAt ?? null,
      };
      const [created] = await db
        .insert(watchState)
        .values(newState)
        .returning();
      return created;
    }
  }

  /**
   * Update last processed historyId
   */
  async updateLastHistoryId(
    emailAddress: string,
    historyId: string
  ): Promise<WatchState> {
    return this.upsertWatchState({
      emailAddress,
      lastHistoryId: historyId,
    });
  }

  /**
   * Update watch expiration
   */
  async updateWatchExpiration(
    emailAddress: string,
    expiration: number,
    renewedAt: Date
  ): Promise<WatchState> {
    return this.upsertWatchState({
      emailAddress,
      watchExpiration: expiration,
      lastRenewedAt: renewedAt,
    });
  }
}
