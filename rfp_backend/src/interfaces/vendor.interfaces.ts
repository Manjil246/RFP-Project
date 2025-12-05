import { Vendor, NewVendor } from "../models/vendor-model";

export interface IVendorRepository {
  createVendor(vendor: NewVendor): Promise<Vendor>;
  getVendorById(id: string): Promise<Vendor | null>;
  getAllVendors(): Promise<Vendor[]>;
  updateVendor(id: string, vendor: Partial<NewVendor>): Promise<Vendor | null>;
  deleteVendor(id: string): Promise<boolean>;
  getVendorByEmail(email: string): Promise<Vendor | null>;
}

export interface IVendorService {
  createVendor(vendor: NewVendor): Promise<Vendor>;
  getVendorById(id: string): Promise<Vendor | null>;
  getAllVendors(): Promise<Vendor[]>;
  updateVendor(id: string, vendor: Partial<NewVendor>): Promise<Vendor | null>;
  deleteVendor(id: string): Promise<boolean>;
}

