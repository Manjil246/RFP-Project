import { sql } from "drizzle-orm";
import { db } from "../database/sql-db";
import { rfps, vendors, proposals, proposalComparisons } from "../models";

export interface DashboardStats {
  rfps: number;
  vendors: number;
  proposals: number;
  comparisons: number;
}

export class StatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    // Get counts using SQL count queries (more efficient than fetching all records)
    const [rfpsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfps);

    const [vendorsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vendors);

    const [proposalsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(proposals);

    const [comparisonsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(proposalComparisons);

    return {
      rfps: Number(rfpsCount.count) || 0,
      vendors: Number(vendorsCount.count) || 0,
      proposals: Number(proposalsCount.count) || 0,
      comparisons: Number(comparisonsCount.count) || 0,
    };
  }
}
