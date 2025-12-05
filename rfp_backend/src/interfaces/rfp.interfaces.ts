import { RFP, NewRFP } from "../models/rfp-model";
import { RFPLineItem, NewRFPLineItem } from "../models/rfp-line-item-model";

export interface IRFPRepository {
  createRFP(rfp: NewRFP): Promise<RFP>;
  createRFPLineItems(lineItems: NewRFPLineItem[]): Promise<RFPLineItem[]>;
  getRFPById(id: string): Promise<RFP | null>;
  getAllRFPs(): Promise<RFP[]>;
  updateRFP(id: string, rfp: Partial<NewRFP>): Promise<RFP | null>;
  deleteRFP(id: string): Promise<boolean>;
  getRFPWithLineItems(id: string): Promise<(RFP & { lineItems: RFPLineItem[] }) | null>;
}

export interface IRFPService {
  createRFPFromNaturalLanguage(
    naturalLanguageText: string
  ): Promise<RFP & { lineItems: RFPLineItem[] }>;
  getRFPById(id: string): Promise<(RFP & { lineItems: RFPLineItem[] }) | null>;
  getAllRFPs(): Promise<(RFP & { lineItems: RFPLineItem[] })[]>;
  updateRFP(id: string, rfp: Partial<NewRFP>): Promise<RFP | null>;
  deleteRFP(id: string): Promise<boolean>;
  sendRFPToVendors(rfpId: string, vendorIds: string[]): Promise<{
    success: number;
    failed: number;
    results: Array<{ vendorId: string; vendorName: string; success: boolean; error?: string }>;
  }>;
  getRFPVendors(rfpId: string): Promise<Array<{
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    emailStatus: string;
    emailSentAt: string | null;
  }>>;
}

