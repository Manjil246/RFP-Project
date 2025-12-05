import { eq, desc } from "drizzle-orm";
import { db } from "../database/sql-db";
import { rfps, rfpLineItems } from "../models";
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
    const result = await db.delete(rfps).where(eq(rfps.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRFPWithLineItems(
    id: string
  ): Promise<(RFP & { lineItems: RFPLineItem[] }) | null> {
    const rfp = await this.getRFPById(id);
    if (!rfp) return null;

    const lineItems = await db
      .select()
      .from(rfpLineItems)
      .where(eq(rfpLineItems.rfpId, id));

    return {
      ...rfp,
      lineItems,
    };
  }
}

