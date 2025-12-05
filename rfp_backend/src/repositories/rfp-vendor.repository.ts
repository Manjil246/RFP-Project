import { eq, and, desc } from "drizzle-orm";
import { db } from "../database/sql-db";
import { rfpVendors, vendors } from "../models";
import { RFPVendor, NewRFPVendor } from "../models/rfp-vendor-model";

export class RFPVendorRepository {
  async createRFPVendor(rfpVendor: NewRFPVendor): Promise<RFPVendor> {
    const [created] = await db.insert(rfpVendors).values(rfpVendor).returning();
    return created;
  }

  async updateRFPVendorStatus(
    rfpId: string,
    vendorId: string,
    status: "pending" | "sent" | "failed",
    emailSentAt?: Date
  ): Promise<RFPVendor | null> {
    const [updated] = await db
      .update(rfpVendors)
      .set({
        emailStatus: status,
        emailSentAt: emailSentAt || new Date(),
      })
      .where(
        and(eq(rfpVendors.rfpId, rfpId), eq(rfpVendors.vendorId, vendorId))
      )
      .returning();
    return updated || null;
  }

  async getRFPVendorsByRFPId(rfpId: string): Promise<
    (RFPVendor & {
      vendor: {
        id: string;
        name: string;
        email: string;
      };
    })[]
  > {
    const results = await db
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
      .where(eq(rfpVendors.rfpId, rfpId));

    return results.map((r) => ({
      id: r.id,
      rfpId: r.rfpId,
      vendorId: r.vendorId,
      emailSentAt: r.emailSentAt,
      emailStatus: r.emailStatus,
      emailMessageId: r.emailMessageId,
      createdAt: r.createdAt,
      vendor: {
        id: r.vendorId,
        name: r.vendorName,
        email: r.vendorEmail,
      },
    }));
  }

  async checkRFPVendorExists(
    rfpId: string,
    vendorId: string
  ): Promise<boolean> {
    const [result] = await db
      .select()
      .from(rfpVendors)
      .where(
        and(eq(rfpVendors.rfpId, rfpId), eq(rfpVendors.vendorId, vendorId))
      )
      .limit(1);
    return !!result;
  }

  async getRFPVendorByMessageId(messageId: string): Promise<
    | (RFPVendor & {
        vendor: {
          id: string;
          name: string;
          email: string;
        };
        rfpId: string;
      })
    | null
  > {
    const results = await db
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
      .where(eq(rfpVendors.emailMessageId, messageId))
      .limit(1);

    if (results.length === 0) return null;

    const r = results[0];
    return {
      id: r.id,
      rfpId: r.rfpId,
      vendorId: r.vendorId,
      emailSentAt: r.emailSentAt,
      emailStatus: r.emailStatus,
      emailMessageId: r.emailMessageId,
      createdAt: r.createdAt,
      vendor: {
        id: r.vendorId,
        name: r.vendorName,
        email: r.vendorEmail,
      },
    };
  }

  async updateEmailMessageId(
    rfpId: string,
    vendorId: string,
    messageId: string
  ): Promise<void> {
    await db
      .update(rfpVendors)
      .set({ emailMessageId: messageId })
      .where(
        and(eq(rfpVendors.rfpId, rfpId), eq(rfpVendors.vendorId, vendorId))
      );
  }

  /**
   * Get latest RFP sent to a vendor (by sentAt or createdAt DESC)
   */
  async getLatestRFPForVendor(vendorId: string): Promise<{
    rfpId: string;
    rfpTitle: string;
  } | null> {
    const { rfps } = await import("../models");
    const results = await db
      .select({
        rfpId: rfpVendors.rfpId,
        rfpTitle: rfps.title,
        sentAt: rfpVendors.emailSentAt,
        createdAt: rfps.createdAt,
      })
      .from(rfpVendors)
      .innerJoin(rfps, eq(rfpVendors.rfpId, rfps.id))
      .where(
        and(
          eq(rfpVendors.vendorId, vendorId),
          eq(rfpVendors.emailStatus, "sent")
        )
      )
      .orderBy(desc(rfpVendors.emailSentAt), desc(rfps.createdAt))
      .limit(1);

    if (results.length === 0) return null;

    return {
      rfpId: results[0].rfpId,
      rfpTitle: results[0].rfpTitle,
    };
  }
}
