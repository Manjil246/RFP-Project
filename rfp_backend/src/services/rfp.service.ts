import { IRFPRepository } from "../interfaces/rfp.interfaces";
import { IRFPService } from "../interfaces/rfp.interfaces";
import { OpenAIService } from "./openai.service";
import { RFPEmailService } from "./rfp-email.service";
import { RFPVendorRepository } from "../repositories/rfp-vendor.repository";
import { IVendorRepository } from "../interfaces/vendor.interfaces";
import { RFP, NewRFP } from "../models/rfp-model";
import { RFPLineItem, NewRFPLineItem } from "../models/rfp-line-item-model";

export class RFPService implements IRFPService {
  private rfpRepository: IRFPRepository;
  private openAIService: OpenAIService;
  private rfpEmailService: RFPEmailService;
  private rfpVendorRepository: RFPVendorRepository;
  private vendorRepository: IVendorRepository;

  constructor(
    rfpRepository: IRFPRepository,
    vendorRepository: IVendorRepository
  ) {
    this.rfpRepository = rfpRepository;
    this.vendorRepository = vendorRepository;
    this.openAIService = new OpenAIService();
    this.rfpEmailService = new RFPEmailService();
    this.rfpVendorRepository = new RFPVendorRepository();
  }

  async createRFPFromNaturalLanguage(
    naturalLanguageText: string
  ): Promise<RFP & { lineItems: RFPLineItem[] }> {
    // Extract structured data using OpenAI
    const extractedData =
      await this.openAIService.extractRFPFromNaturalLanguage(
        naturalLanguageText
      );

    // Create RFP record
    const newRFP: NewRFP = {
      title: extractedData.title,
      description: extractedData.description || null,
      budget: extractedData.budget || null,
      deadline: extractedData.deadline || null,
      paymentTerms: extractedData.paymentTerms || null,
      warranty: extractedData.warranty || null,
      otherTerms: extractedData.otherTerms || null,
      status: "draft",
    };

    const createdRFP = await this.rfpRepository.createRFP(newRFP);

    // Create line items
    const newLineItems: NewRFPLineItem[] = extractedData.lineItems.map(
      (item) => ({
        rfpId: createdRFP.id,
        itemName: item.itemName,
        quantity: item.quantity,
        specifications: item.specifications || null,
        notes: item.notes || null,
      })
    );

    const createdLineItems =
      await this.rfpRepository.createRFPLineItems(newLineItems);

    return {
      ...createdRFP,
      lineItems: createdLineItems,
    };
  }

  async getRFPById(
    id: string
  ): Promise<(RFP & { lineItems: RFPLineItem[] }) | null> {
    return await this.rfpRepository.getRFPWithLineItems(id);
  }

  async getAllRFPs(): Promise<(RFP & { lineItems: RFPLineItem[] })[]> {
    const allRFPs = await this.rfpRepository.getAllRFPs();

    // Get line items for each RFP
    const rfpsWithLineItems = await Promise.all(
      allRFPs.map(async (rfp) => {
        const rfpWithItems = await this.rfpRepository.getRFPWithLineItems(
          rfp.id
        );
        return rfpWithItems || { ...rfp, lineItems: [] };
      })
    );

    return rfpsWithLineItems;
  }

  async getAllRFPsWithVendorCounts(): Promise<
    (RFP & { lineItems: RFPLineItem[]; vendorCount: number })[]
  > {
    return await this.rfpRepository.getAllRFPsWithVendorCounts();
  }

  async getRFPByIdWithAllVendors(
    id: string
  ): Promise<
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
    return await this.rfpRepository.getRFPWithLineItemsAndAllVendors(id);
  }

  async updateRFP(id: string, rfp: Partial<NewRFP>): Promise<RFP | null> {
    return await this.rfpRepository.updateRFP(id, rfp);
  }

  async deleteRFP(id: string): Promise<boolean> {
    return await this.rfpRepository.deleteRFP(id);
  }

  async sendRFPToVendors(
    rfpId: string,
    vendorIds: string[]
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{
      vendorId: string;
      vendorName: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    // Get RFP with line items
    const rfpWithItems = await this.rfpRepository.getRFPWithLineItems(rfpId);
    if (!rfpWithItems) {
      throw new Error("RFP not found");
    }

    const results: Array<{
      vendorId: string;
      vendorName: string;
      success: boolean;
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    // Send to each vendor
    for (const vendorId of vendorIds) {
      try {
        // Get vendor
        const vendor = await this.vendorRepository.getVendorById(vendorId);
        if (!vendor) {
          results.push({
            vendorId,
            vendorName: "Unknown",
            success: false,
            error: "Vendor not found",
          });
          failedCount++;
          continue;
        }

        // Check if already sent, if not create rfp_vendor record
        const exists = await this.rfpVendorRepository.checkRFPVendorExists(
          rfpId,
          vendorId
        );

        if (!exists) {
          await this.rfpVendorRepository.createRFPVendor({
            rfpId,
            vendorId,
            emailStatus: "pending",
          });
        }

        // Send email and get message ID
        const messageId = await this.rfpEmailService.sendRFPToVendor(
          rfpWithItems,
          rfpWithItems.lineItems,
          vendor
        );

        // Update status to sent and store message ID
        await this.rfpVendorRepository.updateRFPVendorStatus(
          rfpId,
          vendorId,
          "sent",
          new Date()
        );

        // Store message ID for matching replies
        if (messageId) {
          await this.rfpVendorRepository.updateEmailMessageId(
            rfpId,
            vendorId,
            messageId
          );
        }

        results.push({
          vendorId,
          vendorName: vendor.name,
          success: true,
        });
        successCount++;
      } catch (error: any) {
        // Update status to failed
        await this.rfpVendorRepository.updateRFPVendorStatus(
          rfpId,
          vendorId,
          "failed"
        );

        results.push({
          vendorId,
          vendorName: "Unknown",
          success: false,
          error: error.message || "Failed to send email",
        });
        failedCount++;
      }
    }

    // Update RFP status to "sent" if at least one email was sent
    if (successCount > 0) {
      await this.rfpRepository.updateRFP(rfpId, {
        status: "sent",
        sentAt: new Date(),
      });
    }

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  async getRFPVendors(rfpId: string): Promise<
    Array<{
      vendorId: string;
      vendorName: string;
      vendorEmail: string;
      emailStatus: string;
      emailSentAt: string | null;
    }>
  > {
    const rfpVendors =
      await this.rfpVendorRepository.getRFPVendorsByRFPId(rfpId);

    return rfpVendors.map((rv) => ({
      vendorId: rv.vendorId,
      vendorName: rv.vendor.name,
      vendorEmail: rv.vendor.email,
      emailStatus: rv.emailStatus,
      emailSentAt: rv.emailSentAt?.toISOString() || null,
    }));
  }
}
