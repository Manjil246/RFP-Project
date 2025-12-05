import { eq, inArray } from "drizzle-orm";
import { db } from "../database/sql-db";
import {
  proposalComparisons,
  ProposalComparison,
  NewProposalComparison,
} from "../models/proposal-comparison-model";

export class ProposalComparisonRepository {
  async getComparisonByRFPId(rfpId: string): Promise<ProposalComparison | null> {
    const [comparison] = await db
      .select()
      .from(proposalComparisons)
      .where(eq(proposalComparisons.rfpId, rfpId))
      .limit(1);
    return comparison || null;
  }

  async upsertComparison(comparison: NewProposalComparison): Promise<ProposalComparison> {
    const existing = await this.getComparisonByRFPId(comparison.rfpId);

    if (existing) {
      const [updated] = await db
        .update(proposalComparisons)
        .set({
          proposalIds: comparison.proposalIds,
          comparisonData: comparison.comparisonData,
          recommendation: comparison.recommendation,
          proposalHashes: comparison.proposalHashes,
          compared: true, // Mark as compared when updated
          computedAt: comparison.computedAt,
          updatedAt: new Date(),
        })
        .where(eq(proposalComparisons.rfpId, comparison.rfpId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(proposalComparisons)
        .values({
          ...comparison,
          compared: true, // Mark as compared when created
        })
        .returning();
      return created;
    }
  }

  /**
   * Mark comparison as stale (not compared) when proposals change
   */
  async markComparisonAsStale(rfpId: string): Promise<void> {
    const result = await db
      .update(proposalComparisons)
      .set({
        compared: false,
        updatedAt: new Date(),
      })
      .where(eq(proposalComparisons.rfpId, rfpId))
      .returning({ id: proposalComparisons.id });
    
    // If no comparison record exists yet, that's fine - it will be created when comparison is first run
    if (result.length === 0) {
      console.log(`         ℹ️  No comparison record exists yet for RFP ${rfpId.substring(0, 8)}... (will be created on first comparison)`);
    } else {
      console.log(`         🔄 Marked comparison as stale for RFP ${rfpId.substring(0, 8)}...`);
    }
  }

  /**
   * Get comparison status for multiple RFPs (for listing page)
   */
  async getComparisonStatuses(rfpIds: string[]): Promise<Record<string, boolean>> {
    if (rfpIds.length === 0) return {};
    
    const comparisons = await db
      .select({
        rfpId: proposalComparisons.rfpId,
        compared: proposalComparisons.compared,
      })
      .from(proposalComparisons)
      .where(inArray(proposalComparisons.rfpId, rfpIds));
    
    const statusMap: Record<string, boolean> = {};
    comparisons.forEach((comp) => {
      statusMap[comp.rfpId] = comp.compared;
    });
    
    return statusMap;
  }

  async deleteComparisonByRFPId(rfpId: string): Promise<void> {
    await db.delete(proposalComparisons).where(eq(proposalComparisons.rfpId, rfpId));
  }
}

