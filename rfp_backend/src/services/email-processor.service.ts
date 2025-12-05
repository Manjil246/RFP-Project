import { GmailAPIService, ParsedEmail } from "./gmail-api.service";
import { VendorRepository } from "../repositories/vendor.repository";
import { RFPVendorRepository } from "../repositories/rfp-vendor.repository";
import { RFPRepository } from "../repositories/rfp.repository";
import { ProposalRepository } from "../repositories/proposal.repository";
import { ProposalParsingService } from "./proposal-parsing.service";
import { OpenAIService } from "./openai.service";
import { ProposalComparisonRepository } from "../repositories/proposal-comparison.repository";
import { Proposal } from "../models/proposal-model";

export class EmailProcessorService {
  private gmailAPIService: GmailAPIService;
  private vendorRepository: VendorRepository;
  private rfpVendorRepository: RFPVendorRepository;
  private rfpRepository: RFPRepository;
  private proposalRepository: ProposalRepository;
  private proposalParsingService: ProposalParsingService;
  private openAIService: OpenAIService;
  private proposalComparisonRepository: ProposalComparisonRepository;

  constructor() {
    this.gmailAPIService = new GmailAPIService();
    this.vendorRepository = new VendorRepository();
    this.rfpVendorRepository = new RFPVendorRepository();
    this.rfpRepository = new RFPRepository();
    this.proposalRepository = new ProposalRepository();
    this.proposalParsingService = new ProposalParsingService();
    this.openAIService = new OpenAIService();
    this.proposalComparisonRepository = new ProposalComparisonRepository();
  }

  /**
   * Process a single email message
   * 1. Check if sender is a vendor
   * 2. Find latest RFP sent to that vendor
   * 3. Create or update proposal
   */
  async processEmail(messageId: string): Promise<void> {
    const startTime = Date.now();
    console.log(`\n   📧 Processing email: ${messageId}`);

    try {
      // Step 1: Fetch email headers (fast)
      const headerStartTime = Date.now();
      const emailHeaders =
        await this.gmailAPIService.fetchEmailHeaders(messageId);
      const headerTime = Date.now() - headerStartTime;
      console.log(`      ⏱️  Headers fetched in ${headerTime}ms`);
      console.log(
        `      From: ${emailHeaders.fromName} <${emailHeaders.from}>`
      );

      // Step 2: Check if sender is a registered vendor
      const vendor = await this.vendorRepository.getVendorByEmail(
        emailHeaders.from
      );
      if (!vendor) {
        console.log(`      ⚠️  Sender is not a registered vendor - IGNORED`);
        return;
      }
      console.log(`      ✅ Sender is registered vendor: ${vendor.name}`);

      // Step 3: Find latest RFP sent to this vendor
      const latestRFP = await this.rfpVendorRepository.getLatestRFPForVendor(
        vendor.id
      );
      if (!latestRFP) {
        console.log(
          `      ⚠️  No RFP found for vendor ${vendor.name} - IGNORED`
        );
        return;
      }
      console.log(
        `      ✅ Found latest RFP: ${latestRFP.rfpId.substring(0, 8)}... (${latestRFP.rfpTitle})`
      );

      // Step 4: Get RFP with line items
      const rfpWithItems = await this.rfpRepository.getRFPWithLineItems(
        latestRFP.rfpId
      );
      if (!rfpWithItems || !rfpWithItems.lineItems) {
        console.log(`      ⚠️  RFP not found or has no line items - IGNORED`);
        return;
      }

      // Step 5: Check if proposal already exists
      const existingProposal =
        await this.proposalRepository.getProposalByRFPAndVendor(
          latestRFP.rfpId,
          vendor.id
        );

      // Step 6: Fetch full email body
      const fullEmailStartTime = Date.now();
      const fullEmail = await this.gmailAPIService.fetchEmail(messageId);
      const fullEmailTime = Date.now() - fullEmailStartTime;
      console.log(`      ⏱️  Full email fetched in ${fullEmailTime}ms`);

      if (existingProposal) {
        // Update existing proposal with LLM merge
        console.log(`      🔄 Proposal exists, merging with new email...`);
        await this.updateProposalWithMerge(
          existingProposal.id,
          fullEmail,
          rfpWithItems.lineItems
        );
      } else {
        // Create new proposal
        console.log(`      ✨ Creating new proposal...`);
        await this.createNewProposal(
          latestRFP.rfpId,
          vendor.id,
          fullEmail,
          rfpWithItems.lineItems
        );
      }

      const totalTime = Date.now() - startTime;
      console.log(`      ✅ Email processed successfully in ${totalTime}ms`);
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(
        `      ❌ Error processing email after ${totalTime}ms:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Create a new proposal from email
   */
  private async createNewProposal(
    rfpId: string,
    vendorId: string,
    email: ParsedEmail,
    rfpLineItems: any[]
  ): Promise<void> {
    const parseStartTime = Date.now();

    // Parse proposal data using AI
    const extractedData =
      await this.proposalParsingService.parseProposalFromEmail(
        email,
        rfpLineItems
      );

    const parseTime = Date.now() - parseStartTime;
    console.log(`         ⏱️  AI parsing completed in ${parseTime}ms`);

    // Clean email body (remove quoted content)
    // Note: extractReplyContent is a private method, we'll parse it directly
    const emailContent = email.text || this.stripHtml(email.html);
    const cleanedEmailBody = this.extractReplyContent(emailContent);

    // Create proposal
    const newProposal = {
      rfpId,
      vendorId,
      emailSubject: email.subject,
      emailBody: cleanedEmailBody,
      emailMessageId: email.messageId,
      extractedData: extractedData as any,
      rawAttachments:
        email.attachments.length > 0
          ? email.attachments.map((att) => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size,
            }))
          : null,
      parsedAt: new Date(),
    };

    const proposal = await this.proposalRepository.createProposal(newProposal);

    // Create proposal line items
    const newLineItems = extractedData.pricing.lineItems.map((item) => {
      const matchingRFPItem = rfpLineItems.find(
        (rfpItem) =>
          rfpItem.itemName.toLowerCase() === item.itemName.toLowerCase()
      );

      return {
        proposalId: proposal.id,
        rfpLineItemId: matchingRFPItem?.id || null,
        itemName: item.itemName,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || null,
        totalPrice: item.totalPrice || null,
        specifications: item.specifications || null,
        notes: item.notes || null,
      };
    });

    await this.proposalRepository.createProposalLineItems(newLineItems);

    // Mark comparison as stale when new proposal is created
    await this.proposalComparisonRepository.markComparisonAsStale(rfpId);

    console.log(
      `         ✅ Proposal created: ${proposal.id.substring(0, 8)}...`
    );
  }

  /**
   * Update existing proposal by merging with new email using LLM
   */
  private async updateProposalWithMerge(
    proposalId: string,
    newEmail: ParsedEmail,
    rfpLineItems: any[]
  ): Promise<void> {
    const mergeStartTime = Date.now();

    // Get existing proposal
    const existingProposal =
      await this.proposalRepository.getProposalWithLineItems(proposalId);
    if (!existingProposal) {
      throw new Error("Proposal not found for update");
    }

    // Clean new email body
    const newEmailContent = newEmail.text || this.stripHtml(newEmail.html);
    const cleanedNewEmailBody = this.extractReplyContent(newEmailContent);

    // Parse new email
    const newExtractedData =
      await this.proposalParsingService.parseProposalFromEmail(
        newEmail,
        rfpLineItems
      );

    // Merge with LLM
    const mergePrompt = `You are merging two proposal submissions from a vendor.

Previous proposal data:
${JSON.stringify(existingProposal.extractedData, null, 2)}

Previous proposal line items:
${JSON.stringify(existingProposal.lineItems, null, 2)}

New email received:
${cleanedNewEmailBody}

New email parsed data:
${JSON.stringify(newExtractedData, null, 2)}

Merge these into a single, final proposal. Consider:
- Updated pricing takes precedence
- Latest terms override old ones
- Merge line items intelligently (combine duplicates, keep latest prices)
- Keep the most complete information
- Preserve all important details from both

Return ONLY valid JSON in this exact format:
{
  "totalPrice": "string or null",
  "pricing": {
    "lineItems": [
      {
        "itemName": "string",
        "quantity": number or null,
        "unitPrice": "string or null",
        "totalPrice": "string or null",
        "specifications": {} or null,
        "notes": "string or null"
      }
    ]
  },
  "deliveryTime": "string or null",
  "paymentTerms": "string or null",
  "warranty": "string or null",
  "additionalTerms": {} or null
}`;

    const mergedData =
      await this.openAIService.extractProposalFromEmail(mergePrompt);
    const mergeTime = Date.now() - mergeStartTime;
    console.log(`         ⏱️  LLM merge completed in ${mergeTime}ms`);

    // Validate and set defaults for merged data
    if (!mergedData.pricing) {
      mergedData.pricing = { lineItems: [] };
    }
    if (!mergedData.pricing.lineItems) {
      mergedData.pricing.lineItems = [];
    }

    // Update proposal
    await this.proposalRepository.updateProposal(proposalId, {
      emailSubject: newEmail.subject,
      emailBody: cleanedNewEmailBody,
      emailMessageId: newEmail.messageId,
      extractedData: mergedData as any,
      parsedAt: new Date(),
    });

    // Update line items (delete old, create new)
    await this.proposalRepository.deleteProposalLineItems(proposalId);
    const mergedLineItems = mergedData.pricing.lineItems.map(
      (item: {
        itemName: string;
        quantity?: number;
        unitPrice?: string;
        totalPrice?: string;
        specifications?: Record<string, any>;
        notes?: string;
      }) => {
        const matchingRFPItem = rfpLineItems.find(
          (rfpItem) =>
            rfpItem.itemName.toLowerCase() === item.itemName.toLowerCase()
        );

        return {
          proposalId,
          rfpLineItemId: matchingRFPItem?.id || null,
          itemName: item.itemName,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || null,
          totalPrice: item.totalPrice || null,
          specifications: item.specifications || null,
          notes: item.notes || null,
        };
      }
    );

    await this.proposalRepository.createProposalLineItems(mergedLineItems);

    // Mark comparison as stale when proposal is updated
    const rfpId = existingProposal.rfpId;
    await this.proposalComparisonRepository.markComparisonAsStale(rfpId);

    console.log(
      `         ✅ Proposal updated: ${proposalId.substring(0, 8)}...`
    );
  }

  /**
   * Extract only the new reply content, excluding quoted original email
   */
  private extractReplyContent(emailContent: string): string {
    if (!emailContent) return "";

    const quoteMarkers = [
      /^On .+ wrote:.*$/m,
      /^From:.*$/m,
      /^-----Original Message-----.*$/m,
      /^>+.*$/m,
      /^On .+ <.+> wrote:.*$/m,
    ];

    let content = emailContent;
    for (const marker of quoteMarkers) {
      const match = content.search(marker);
      if (match !== -1) {
        content = content.substring(0, match).trim();
        break;
      }
    }

    const lines = content.split("\n");
    const filteredLines: string[] = [];
    let foundQuoteStart = false;

    for (const line of lines) {
      if (
        /^On .+ wrote:.*$/i.test(line) ||
        /^From:.*$/i.test(line) ||
        /^-----Original Message-----.*$/i.test(line)
      ) {
        foundQuoteStart = true;
        break;
      }
      if (/^>+\s/.test(line)) {
        continue;
      }
      filteredLines.push(line);
    }

    if (foundQuoteStart) {
      content = filteredLines.join("\n").trim();
    } else {
      content = content.trim();
    }

    return content || emailContent;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\n\s*\n/g, "\n");
  }
}
