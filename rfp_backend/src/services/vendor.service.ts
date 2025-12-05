import { IVendorRepository } from "../interfaces/vendor.interfaces";
import { IVendorService } from "../interfaces/vendor.interfaces";
import { Vendor, NewVendor } from "../models/vendor-model";

export class VendorService implements IVendorService {
  private vendorRepository: IVendorRepository;

  constructor(vendorRepository: IVendorRepository) {
    this.vendorRepository = vendorRepository;
  }

  async createVendor(vendor: NewVendor): Promise<Vendor> {
    // Check if vendor with same email already exists
    const existingVendor = await this.vendorRepository.getVendorByEmail(
      vendor.email
    );
    if (existingVendor) {
      throw new Error("Vendor with this email already exists");
    }

    return await this.vendorRepository.createVendor(vendor);
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    return await this.vendorRepository.getVendorById(id);
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await this.vendorRepository.getAllVendors();
  }

  async updateVendor(
    id: string,
    vendor: Partial<NewVendor>
  ): Promise<Vendor | null> {
    // If email is being updated, check for duplicates
    if (vendor.email) {
      const existingVendor = await this.vendorRepository.getVendorByEmail(
        vendor.email
      );
      if (existingVendor && existingVendor.id !== id) {
        throw new Error("Vendor with this email already exists");
      }
    }

    return await this.vendorRepository.updateVendor(id, vendor);
  }

  async deleteVendor(id: string): Promise<boolean> {
    return await this.vendorRepository.deleteVendor(id);
  }
}

