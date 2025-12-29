import crypto from "crypto";
import { sql, eq } from "drizzle-orm";
import { db, postgresClient } from "../database/sql-db";
import { ProposalRepository } from "../repositories/proposal.repository";
import { ProposalComparisonRepository } from "../repositories/proposal-comparison.repository";
import { RFPRepository } from "../repositories/rfp.repository";
import { OpenAIComparisonService } from "./openai-comparison.service";
import { Proposal } from "../models/proposal-model";
import { ProposalLineItem } from "../models/proposal-line-item-model";

export interface ComparisonData {
  proposals: Array<{
    proposalId: string;
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    totalPrice: string | null;
    deliveryTime: string | null;
    paymentTerms: string | null;
    warranty: string | null;
    completenessScore: number | null;
    completenessScoreExplanation?: string | null; // Detailed explanation of why this completeness score was given
  }>;
  comparisonTable: {
    criteria: string;
    values: Record<string, string | number | null>; // vendorId -> value
    winner?: string; // vendorId
  }[];
  summary: {
    totalProposals: number;
    priceRange: {
      min: string | null;
      max: string | null;
      average: string | null;
    };
    deliveryRange: {
      fastest: string | null;
      slowest: string | null;
    };
  };
}

export interface Recommendation {
  vendorId: string;
  vendorName: string;
  reasoning: string; // Detailed explanation of why this vendor is recommended
  score: number; // 0-100, overall recommendation score
  scoreBreakdown?: {
    priceScore?: number; // 0-100, how well the price meets requirements
    deliveryScore?: number; // 0-100, how well delivery time meets requirements
    completenessScore?: number; // 0-100, how complete the proposal is
    termsScore?: number; // 0-100, how well terms meet requirements
    overallScore: number; // 0-100, weighted overall score
    explanation?: string; // Detailed explanation of the score breakdown
  };
}

export class ProposalComparisonService {
  private proposalRepository: ProposalRepository;
  private proposalComparisonRepository: ProposalComparisonRepository;
  private rfpRepository: RFPRepository;
  private openAIComparisonService: OpenAIComparisonService;

  constructor() {
    this.proposalRepository = new ProposalRepository();
    this.proposalComparisonRepository = new ProposalComparisonRepository();
    this.rfpRepository = new RFPRepository();
    this.openAIComparisonService = new OpenAIComparisonService();
  }

  /**
   * Get comparison for RFP (cached or generate new)
   */
  async getComparisonForRFP(rfpId: string): Promise<{
    comparison: ComparisonData;
    recommendation: Recommendation;
    wasCached: boolean;
    computedAt: Date;
  }> {
    const startTime = Date.now();
    console.log(
      `\n🔍 [Comparison] Getting comparison for RFP: ${rfpId.substring(0, 8)}...`
    );

    // Get all proposals for RFP
    const proposals =
      await this.proposalRepository.getProposalsByRFPIdWithLineItems(rfpId);

    if (proposals.length === 0) {
      console.log(`   ⚠️  No proposals found for RFP`);
      throw new Error("No proposals found for this RFP");
    }

    console.log(`   📊 Found ${proposals.length} proposal(s) for comparison`);

    // Get existing comparison
    const existingComparison =
      await this.proposalComparisonRepository.getComparisonByRFPId(rfpId);

    // Check if comparison exists and is up-to-date using compared flag
    if (existingComparison && existingComparison.compared) {
      console.log(
        `   💾 Found existing comparison (computed at: ${existingComparison.computedAt.toLocaleString()})`
      );

      // Verify proposal IDs still match (safety check)
      const proposalIds = existingComparison.proposalIds as string[];
      const currentIds = proposals.map((p) => p.id).sort();
      const storedIds = proposalIds.sort();

      const idsMatch = JSON.stringify(currentIds) === JSON.stringify(storedIds);

      if (idsMatch) {
        // Return cached comparison
        const totalTime = Date.now() - startTime;
        console.log(
          `   ✅ Cache HIT - Returning existing comparison (${totalTime}ms)`
        );
        return {
          comparison: existingComparison.comparisonData as ComparisonData,
          recommendation: existingComparison.recommendation as Recommendation,
          wasCached: true,
          computedAt: existingComparison.computedAt,
        };
      } else {
        console.log(
          `   ⚠️  Cache MISS - Proposal IDs changed: ${storedIds.length} → ${currentIds.length}`
        );
        // Mark as stale if IDs don't match
        await this.proposalComparisonRepository.markComparisonAsStale(rfpId);
      }
    } else if (existingComparison && !existingComparison.compared) {
      console.log(
        `   ⚠️  Cache MISS - Comparison exists but is marked as stale (proposals were updated)`
      );
    } else {
      console.log(`   ⚠️  Cache MISS - No existing comparison found`);
    }

    // Generate new comparison (stale or doesn't exist)
    console.log(`   🤖 Generating new comparison using LLM...`);
    const llmStartTime = Date.now();
    const { comparison, recommendation } = await this.generateComparison(
      rfpId,
      proposals
    );
    const llmTime = Date.now() - llmStartTime;
    console.log(`   ✅ LLM comparison completed in ${llmTime}ms`);

    // Save to database
    console.log(`   💾 Saving comparison to database...`);
    await this.proposalComparisonRepository.upsertComparison({
      rfpId,
      proposalIds: proposals.map((p) => p.id),
      comparisonData: comparison,
      recommendation,
      proposalHashes: {}, // Empty object since we removed hash logic
      computedAt: new Date(),
    });
    console.log(`   ✅ Comparison saved successfully`);

    const totalTime = Date.now() - startTime;
    console.log(`   ⏱️  Total time: ${totalTime}ms\n`);

    return {
      comparison,
      recommendation,
      wasCached: false,
      computedAt: new Date(),
    };
  }

  /**
   * Generate new comparison using AI
   */
  private async generateComparison(
    rfpId: string,
    proposals: (Proposal & { lineItems: ProposalLineItem[] })[]
  ): Promise<{ comparison: ComparisonData; recommendation: Recommendation }> {
    console.log(`      📋 Fetching RFP details...`);
    // Get RFP details
    const rfp = await this.rfpRepository.getRFPWithLineItems(rfpId);
    if (!rfp) {
      throw new Error("RFP not found");
    }
    console.log(`      ✅ RFP: ${rfp.title}`);

    // Get vendor details for each proposal
    console.log(
      `      👥 Fetching vendor details for ${proposals.length} proposal(s)...`
    );
    const { VendorRepository } =
      await import("../repositories/vendor.repository");
    const vendorRepository = new VendorRepository();

    const proposalsWithVendors = await Promise.all(
      proposals.map(async (proposal) => {
        const vendor = await vendorRepository.getVendorById(proposal.vendorId);
        return {
          proposal,
          vendor: vendor || {
            id: proposal.vendorId,
            name: "Unknown",
            email: "",
          },
        };
      })
    );
    console.log(`      ✅ Vendor details fetched`);

    // Generate comparison using AI
    console.log(
      `      🧠 Calling OpenAI API for comparison and recommendation...`
    );
    const { comparison, recommendation } =
      await this.openAIComparisonService.compareAndRecommend(
        rfp,
        proposalsWithVendors
      );
    console.log(
      `      ✅ Recommended vendor: ${recommendation.vendorName} (Score: ${recommendation.score}/100)`
    );

    return { comparison, recommendation };
  }

  /**
   * Get comparison statuses for multiple RFPs (for listing page)
   */
  async getComparisonStatuses(
    rfpIds: string[]
  ): Promise<Record<string, boolean>> {
    return await this.proposalComparisonRepository.getComparisonStatuses(
      rfpIds
    );
  }

  /**
   * Get RFP comparison data (proposal counts + comparison status) for all RFPs
   * Single efficient query with joins and aggregations using raw SQL
   */
  async getRFPComparisonData(): Promise<
    Array<{
      rfpId: string;
      rfpTitle: string;
      proposalCount: number;
      hasComparison: boolean;
      compared: boolean;
    }>
  > {
    // Use raw SQL query for better control and to avoid Drizzle ORM limitations
    // Include RFP title so frontend doesn't need separate API call
    const results = await postgresClient`
      SELECT 
        r.id as "rfpId",
        r.title as "rfpTitle",
        COALESCE(COUNT(DISTINCT p.id), 0)::int as "proposalCount",
        CASE WHEN COUNT(DISTINCT pc.id) > 0 THEN true ELSE false END as "hasComparison",
        (COALESCE(MAX(pc.compared::int), 0) > 0) as "compared"
      FROM rfps r
      LEFT JOIN proposals p ON r.id = p.rfp_id
      LEFT JOIN proposal_comparisons pc ON r.id = pc.rfp_id
      GROUP BY r.id, r.title
      ORDER BY r.created_at DESC
    `;

    return results.map((r: any) => ({
      rfpId: r.rfpId,
      rfpTitle: r.rfpTitle,
      proposalCount: Number(r.proposalCount) || 0,
      hasComparison: r.hasComparison || false,
      compared: r.compared || false,
    }));
  }
}
