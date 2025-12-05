import { IProposalRepository } from "../interfaces/proposal.interfaces";
import { IProposalService } from "../interfaces/proposal.interfaces";
import { ProposalParsingService } from "./proposal-parsing.service";
import { ParsedEmail } from "./gmail-api.service";
import { Proposal, NewProposal } from "../models/proposal-model";
import { ProposalLineItem, NewProposalLineItem } from "../models/proposal-line-item-model";
import { RFPLineItem } from "../models/rfp-line-item-model";
import { ProposalComparisonRepository } from "../repositories/proposal-comparison.repository";

export class ProposalService implements IProposalService {
  private proposalRepository: IProposalRepository;
  private proposalParsingService: ProposalParsingService;
  private proposalComparisonRepository: ProposalComparisonRepository;

  constructor(proposalRepository: IProposalRepository) {
    this.proposalRepository = proposalRepository;
    this.proposalParsingService = new ProposalParsingService();
    this.proposalComparisonRepository = new ProposalComparisonRepository();
  }

  async createProposalFromEmail(
    rfpId: string,
    vendorId: string,
    email: ParsedEmail,
    rfpLineItems: RFPLineItem[]
  ): Promise<Proposal & { lineItems: ProposalLineItem[] }> {
    // Check if proposal already exists for this message
    if (email.messageId) {
      const exists = await this.proposalRepository.checkProposalExistsByMessageId(
        email.messageId
      );
      if (exists) {
        throw new Error("Proposal already exists for this email");
      }
    }

    // Parse proposal data using AI
    const extractedData = await this.proposalParsingService.parseProposalFromEmail(
      email,
      rfpLineItems
    );

    // Extract clean reply content (remove quoted original email)
    const cleanEmailBody = this.extractReplyContent(email.text || email.html);

    // Create proposal record
    const newProposal: NewProposal = {
      rfpId,
      vendorId,
      emailSubject: email.subject,
      emailBody: cleanEmailBody, // Store cleaned version (vendor reply only)
      emailMessageId: email.messageId,
      extractedData: extractedData as any,
      rawAttachments: email.attachments.length > 0
        ? email.attachments.map((att) => ({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
          }))
        : null,
      parsedAt: new Date(),
    };

    const createdProposal = await this.proposalRepository.createProposal(
      newProposal
    );

    // Create proposal line items
    const newLineItems: NewProposalLineItem[] = extractedData.pricing.lineItems.map(
      (item, index) => {
        // Try to match with RFP line item
        const matchingRFPItem = rfpLineItems.find(
          (rfpItem) =>
            rfpItem.itemName.toLowerCase() === item.itemName.toLowerCase()
        );

        return {
          proposalId: createdProposal.id,
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

    const createdLineItems =
      await this.proposalRepository.createProposalLineItems(newLineItems);

    // Mark comparison as stale when new proposal is created
    await this.proposalComparisonRepository.markComparisonAsStale(rfpId);

    return {
      ...createdProposal,
      lineItems: createdLineItems,
    };
  }

  async getProposalById(
    id: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] }) | null> {
    return await this.proposalRepository.getProposalWithLineItems(id);
  }

  async getProposalsByRFPId(
    rfpId: string
  ): Promise<(Proposal & { lineItems: ProposalLineItem[] })[]> {
    return await this.proposalRepository.getProposalsByRFPIdWithLineItems(rfpId);
  }

  async getAllProposals(): Promise<
    (Proposal & {
      lineItems: ProposalLineItem[];
      rfp?: { id: string; title: string };
      vendor?: { id: string; name: string; email: string };
    })[]
  > {
    // Get proposals with RFP and Vendor details
    const allProposalsWithDetails =
      await this.proposalRepository.getAllProposalsWithDetails();

    // Add line items to each proposal
    const proposalsWithItems = await Promise.all(
      allProposalsWithDetails.map(async (proposal) => {
        const proposalWithItems =
          await this.proposalRepository.getProposalWithLineItems(proposal.id);
        return {
          ...proposal,
          lineItems: proposalWithItems?.lineItems || [],
        };
      })
    );

    return proposalsWithItems;
  }

  /**
   * Extract only the new reply content, excluding quoted original email
   */
  private extractReplyContent(emailContent: string): string {
    if (!emailContent) return "";

    // Split by common quote markers
    const quoteMarkers = [
      /^On .+ wrote:.*$/m, // "On Wed, Dec 3, 2025 at 1:37 AM <email> wrote:"
      /^From:.*$/m, // "From: sender@example.com"
      /^-----Original Message-----.*$/m, // "-----Original Message-----"
      /^On .+ <.+> wrote:.*$/m, // "On date <email> wrote:"
    ];

    let content = emailContent;

    // Try to find where the quoted content starts
    for (const marker of quoteMarkers) {
      const match = content.search(marker);
      if (match !== -1) {
        // Extract everything before the quote marker
        content = content.substring(0, match).trim();
        break;
      }
    }

    // Remove any remaining quoted lines (lines starting with >)
    const lines = content.split("\n");
    const filteredLines: string[] = [];
    let foundQuoteStart = false;

    for (const line of lines) {
      // Check if this line starts a quote block
      if (/^On .+ wrote:.*$/i.test(line) || /^From:.*$/i.test(line) || /^-----Original Message-----.*$/i.test(line)) {
        foundQuoteStart = true;
        break;
      }
      // Skip lines that are clearly quoted
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

    return content || emailContent; // Fallback to original if extraction fails
  }
}

