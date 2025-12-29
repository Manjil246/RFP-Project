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
    // Execute all count queries in parallel for better performance
    const [rfpsResult, vendorsResult, proposalsResult, comparisonsResult] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(rfps),
        db.select({ count: sql<number>`count(*)` }).from(vendors),
        db.select({ count: sql<number>`count(*)` }).from(proposals),
        db.select({ count: sql<number>`count(*)` }).from(proposalComparisons),
      ]);

    // Extract counts from results (each query returns an array with one object)
    const rfpsCount = rfpsResult[0];
    const vendorsCount = vendorsResult[0];
    const proposalsCount = proposalsResult[0];
    const comparisonsCount = comparisonsResult[0];

    return {
      rfps: Number(rfpsCount.count) || 0,
      vendors: Number(vendorsCount.count) || 0,
      proposals: Number(proposalsCount.count) || 0,
      comparisons: Number(comparisonsCount.count) || 0,
    };
  }
}
