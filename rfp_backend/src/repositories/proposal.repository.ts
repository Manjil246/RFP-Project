import { eq, desc, and } from "drizzle-orm";
import { db } from "../database/sql-db";
import { proposals, proposalLineItems, rfps, vendors } from "../models";
import { IProposalRepository } from "../interfaces/proposal.interfaces";
import { Proposal, NewProposal } from "../models/proposal-model";
import {
  ProposalLineItem,
  NewProposalLineItem,
} from "../models/proposal-line-item-model";

export class ProposalRepository implements IProposalRepository {
  async createProposal(proposal: NewProposal): Promise<Proposal> {
    const [createdProposal] = await db
      .insert(proposals)
      .values(proposal)
      .returning();
    return createdProposal;
  }

  async createProposalLineItems(
    lineItems: NewProposalLineItem[]
  ): Promise<ProposalLineItem[]> {
    if (lineItems.length === 0) return [];
    const createdItems = await db
      .insert(proposalLineItems)
      .values(lineItems)
      .returning();
    return createdItems;
  }

  async getProposalById(id: string): Promise<Proposal | null> {
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, id))
      .limit(1);
    return proposal || null;
  }

  async getProposalsByRFPId(rfpId: string): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.rfpId, rfpId))
      .orderBy(desc(proposals.createdAt));
  }

  async getAllProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
  }

  /**
   * Get all proposals with RFP and Vendor information
   */
  async getAllProposalsWithDetails(): Promise<
    (Proposal & {
      rfp: { id: string; title: string };
      vendor: { id: string; name: string; email: string };
    })[]
  > {
    const results = await db
      .select({
        id: proposals.id,
        rfpId: proposals.rfpId,
        vendorId: proposals.vendorId,
        emailSubject: proposals.emailSubject,
        emailBody: proposals.emailBody,
        emailMessageId: proposals.emailMessageId,
        extractedData: proposals.extractedData,
        rawAttachments: proposals.rawAttachments,
        parsedAt: proposals.parsedAt,
        createdAt: proposals.createdAt,
        updatedAt: proposals.updatedAt,
        rfpTitle: rfps.title,
        vendorName: vendors.name,
        vendorEmail: vendors.email,
      })
      .from(proposals)
      .innerJoin(rfps, eq(proposals.rfpId, rfps.id))
      .innerJoin(vendors, eq(proposals.vendorId, vendors.id))
      .orderBy(desc(proposals.createdAt));

    return results.map((r) => ({
      id: r.id,
      rfpId: r.rfpId,
      vendorId: r.vendorId,
      emailSubject: r.emailSubject,
      emailBody: r.emailBody,
      emailMessageId: r.emailMessageId,
      extractedData: r.extractedData,
      rawAttachments: r.rawAttachments,
      parsedAt: r.parsedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      rfp: {
        id: r.rfpId,
        title: r.rfpTitle,
      },
      vendor: {
        id: r.vendorId,
        name: r.vendorName,
        email: r.vendorEmail,
      },
    }));
  }

  async getProposalWithLineItems(
    id: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] }) | null> {
    const proposal = await this.getProposalById(id);
    if (!proposal) return null;

    const lineItems = await db
      .select()
      .from(proposalLineItems)
      .where(eq(proposalLineItems.proposalId, id));

    return {
      ...proposal,
      lineItems,
    };
  }

  async getProposalsByRFPIdWithLineItems(
    rfpId: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] })[]> {
    const proposalsList = await this.getProposalsByRFPId(rfpId);

    const proposalsWithItems = await Promise.all(
      proposalsList.map(async (proposal) => {
        const lineItems = await db
          .select()
          .from(proposalLineItems)
          .where(eq(proposalLineItems.proposalId, proposal.id));

        return {
          ...proposal,
          lineItems,
        };
      })
    );

    return proposalsWithItems;
  }

  async checkProposalExistsByMessageId(messageId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.emailMessageId, messageId))
      .limit(1);
    return !!result;
  }

  /**
   * Get proposal by RFP and vendor
   */
  async getProposalByRFPAndVendor(
    rfpId: string,
    vendorId: string
  ): Promise<Proposal | null> {
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(and(eq(proposals.rfpId, rfpId), eq(proposals.vendorId, vendorId)))
      .limit(1);
    return proposal || null;
  }

  /**
   * Update proposal
   */
  async updateProposal(
    id: string,
    updates: Partial<NewProposal>
  ): Promise<Proposal | null> {
    const [updated] = await db
      .update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return updated || null;
  }

  /**
   * Delete proposal line items
   */
  async deleteProposalLineItems(proposalId: string): Promise<void> {
    await db
      .delete(proposalLineItems)
      .where(eq(proposalLineItems.proposalId, proposalId));
  }
}
