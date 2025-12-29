import { eq, desc } from "drizzle-orm";
import { db } from "../database/sql-db";
import { vendors } from "../models";
import { IVendorRepository } from "../interfaces/vendor.interfaces";
import { Vendor, NewVendor } from "../models/vendor-model";

export class VendorRepository implements IVendorRepository {
  async createVendor(vendor: NewVendor): Promise<Vendor> {
    const [createdVendor] = await db.insert(vendors).values(vendor).returning();
    return createdVendor;
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);
    return vendor || null;
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  async updateVendor(
    id: string,
    vendor: Partial<NewVendor>
  ): Promise<Vendor | null> {
    const [updatedVendor] = await db
      .update(vendors)
      .set({ ...vendor, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updatedVendor || null;
  }

  async deleteVendor(id: string): Promise<boolean> {
    await db.delete(vendors).where(eq(vendors.id, id));
    return true; // Delete operation is successful regardless of whether record existed
  }

  async getVendorByEmail(email: string): Promise<Vendor | null> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.email, email))
      .limit(1);
    return vendor || null;
  }
}
