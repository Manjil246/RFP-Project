import { eq, desc, sql } from "drizzle-orm";
import { db } from "../database/sql-db";
import { rfps, rfpLineItems, rfpVendors, vendors } from "../models";
import { IRFPRepository } from "../interfaces/rfp.interfaces";
import { RFP, NewRFP } from "../models/rfp-model";
import { RFPLineItem, NewRFPLineItem } from "../models/rfp-line-item-model";

export class RFPRepository implements IRFPRepository {
  async createRFP(rfp: NewRFP): Promise<RFP> {
    const [createdRFP] = await db.insert(rfps).values(rfp).returning();
    return createdRFP;
  }

  async createRFPLineItems(
    lineItems: NewRFPLineItem[]
  ): Promise<RFPLineItem[]> {
    if (lineItems.length === 0) return [];
    const createdItems = await db
      .insert(rfpLineItems)
      .values(lineItems)
      .returning();
    return createdItems;
  }

  async getRFPById(id: string): Promise<RFP | null> {
    const [rfp] = await db.select().from(rfps).where(eq(rfps.id, id)).limit(1);
    return rfp || null;
  }

  async getAllRFPs(): Promise<RFP[]> {
    return await db.select().from(rfps).orderBy(desc(rfps.createdAt));
  }

  async updateRFP(id: string, rfp: Partial<NewRFP>): Promise<RFP | null> {
    const [updatedRFP] = await db
      .update(rfps)
      .set({ ...rfp, updatedAt: new Date() })
      .where(eq(rfps.id, id))
      .returning();
    return updatedRFP || null;
  }

  async deleteRFP(id: string): Promise<boolean> {
    await db.delete(rfps).where(eq(rfps.id, id));
    return true; // Delete operation is successful regardless of whether record existed
  }

  async getAllRFPsWithVendorCounts(): Promise<
    (RFP & { lineItems: RFPLineItem[]; vendorCount: number })[]
  > {
    // First, get all RFPs with their line items
    const rfpsWithItems = await this.getAllRFPsWithLineItems();

    // Then, get vendor counts for each RFP in a single query
    const vendorCountsResult = await db
      .select({
        rfpId: rfpVendors.rfpId,
        vendorCount: sql<number>`count(*)`,
      })
      .from(rfpVendors)
      .where(eq(rfpVendors.emailStatus, "sent"))
      .groupBy(rfpVendors.rfpId);

    // Create a map of RFP ID to vendor count
    const vendorCountMap = new Map<string, number>();
    vendorCountsResult.forEach((row) => {
      vendorCountMap.set(row.rfpId, Number(row.vendorCount) || 0);
    });

    // Combine RFPs with their vendor counts
    return rfpsWithItems.map((rfp) => ({
      ...rfp,
      vendorCount: vendorCountMap.get(rfp.id) || 0,
    }));
  }

  async getAllRFPsWithLineItems(): Promise<
    (RFP & { lineItems: RFPLineItem[] })[]
  > {
    const allRFPs = await this.getAllRFPs();

    // Get line items for each RFP
    const rfpsWithLineItems = await Promise.all(
      allRFPs.map(async (rfp) => {
        const rfpWithItems = await this.getRFPWithLineItems(rfp.id);
        return rfpWithItems || { ...rfp, lineItems: [] };
      })
    );

    return rfpsWithLineItems;
  }

  async getRFPWithLineItems(
    id: string
  ): Promise<(RFP & { lineItems: RFPLineItem[] }) | null> {
    // Single query with LEFT JOIN to get RFP and all its line items
    const result = await db
      .select({
        // RFP fields
        id: rfps.id,
        title: rfps.title,
        description: rfps.description,
        budget: rfps.budget,
        deadline: rfps.deadline,
        paymentTerms: rfps.paymentTerms,
        warranty: rfps.warranty,
        otherTerms: rfps.otherTerms,
        status: rfps.status,
        createdAt: rfps.createdAt,
        updatedAt: rfps.updatedAt,
        sentAt: rfps.sentAt,
        // Line item fields
        lineItemId: rfpLineItems.id,
        itemName: rfpLineItems.itemName,
        quantity: rfpLineItems.quantity,
        specifications: rfpLineItems.specifications,
        notes: rfpLineItems.notes,
        lineItemCreatedAt: rfpLineItems.createdAt,
      })
      .from(rfps)
      .leftJoin(rfpLineItems, eq(rfps.id, rfpLineItems.rfpId))
      .where(eq(rfps.id, id));

    if (result.length === 0) {
      return null; // RFP not found
    }

    // Extract RFP data from first row
    const rfpData = result[0];
    const rfp: RFP = {
      id: rfpData.id,
      title: rfpData.title,
      description: rfpData.description,
      budget: rfpData.budget,
      deadline: rfpData.deadline,
      paymentTerms: rfpData.paymentTerms,
      warranty: rfpData.warranty,
      otherTerms: rfpData.otherTerms,
      status: rfpData.status,
      createdAt: rfpData.createdAt,
      updatedAt: rfpData.updatedAt,
      sentAt: rfpData.sentAt,
    };

    // Extract and format line items
    const lineItems: RFPLineItem[] = result
      .filter((row) => row.lineItemId !== null) // Filter out rows where line item is null (LEFT JOIN)
      .map((row) => ({
        id: row.lineItemId!,
        rfpId: row.id,
        itemName: row.itemName!,
        quantity: row.quantity!,
        specifications: row.specifications,
        notes: row.notes,
        createdAt: row.lineItemCreatedAt!,
      }));

    return {
      ...rfp,
      lineItems,
    };
  }

  async getRFPWithLineItemsAndAllVendors(id: string): Promise<
    | (RFP & {
        lineItems: RFPLineItem[];
        sentVendors: Array<{
          vendorId: string;
          vendorName: string;
          vendorEmail: string;
          emailStatus: string;
          emailSentAt: string | null;
        }>;
        allVendors: Array<{
          id: string;
          name: string;
          email: string;
        }>;
      })
    | null
  > {
    // Get RFP with line items first
    const rfpWithItems = await this.getRFPWithLineItems(id);
    if (!rfpWithItems) {
      return null;
    }

    // Get vendors who have received this RFP
    const sentVendorsResult: Array<{
      id: string;
      rfpId: string;
      vendorId: string;
      emailSentAt: Date | null;
      emailStatus: string;
      emailMessageId: string | null;
      createdAt: Date;
      vendorName: string;
      vendorEmail: string;
    }> = await db
      .select({
        id: rfpVendors.id,
        rfpId: rfpVendors.rfpId,
        vendorId: rfpVendors.vendorId,
        emailSentAt: rfpVendors.emailSentAt,
        emailStatus: rfpVendors.emailStatus,
        emailMessageId: rfpVendors.emailMessageId,
        createdAt: rfpVendors.createdAt,
        vendorName: vendors.name,
        vendorEmail: vendors.email,
      })
      .from(rfpVendors)
      .innerJoin(vendors, eq(rfpVendors.vendorId, vendors.id))
      .where(eq(rfpVendors.rfpId, id));

    // Get ALL vendors (for the send dialog)
    const allVendorsResult = await db.select().from(vendors);

    const sentVendors = sentVendorsResult.map((r) => ({
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      vendorEmail: r.vendorEmail,
      emailStatus: r.emailStatus,
      emailSentAt: r.emailSentAt?.toISOString() || null,
    }));

    const allVendors = allVendorsResult.map((v) => ({
      id: v.id,
      name: v.name,
      email: v.email,
    }));

    return {
      ...rfpWithItems,
      sentVendors,
      allVendors,
    };
  }
}
