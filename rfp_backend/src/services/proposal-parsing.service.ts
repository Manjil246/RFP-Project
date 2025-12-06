import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/env";
import { ParsedEmail } from "./gmail-api.service";
import { RFPLineItem } from "../models/rfp-line-item-model";
import { FileParserService, ParsedFileContent } from "./file-parser.service";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export interface ExtractedProposalData {
  totalPrice?: string;
  pricing: {
    lineItems: Array<{
      itemName: string;
      quantity?: number;
      unitPrice?: string;
      totalPrice?: string;
      specifications?: Record<string, any>;
      notes?: string;
    }>;
  };
  deliveryTime?: string;
  paymentTerms?: string;
  warranty?: string;
  additionalTerms?: Record<string, any>;
}

export class ProposalParsingService {
  private fileParserService: FileParserService;

  constructor() {
    this.fileParserService = new FileParserService();
  }

  async parseProposalFromEmail(
    email: ParsedEmail,
    rfpLineItems: RFPLineItem[]
  ): Promise<ExtractedProposalData> {
    console.log(`      🤖 Starting AI parsing...`);
    const aiStartTime = Date.now();

    // Extract only the new reply content, not the quoted original email
    let emailContent = email.text || this.stripHtml(email.html);
    emailContent = this.extractReplyContent(emailContent);

    // Parse all attachments
    const parsedAttachments: ParsedFileContent[] = [];
    const imageAttachments: ParsedFileContent[] = [];

    if (email.attachments && email.attachments.length > 0) {
      console.log(
        `      📎 Processing ${email.attachments.length} attachment(s)...`
      );

      for (const attachment of email.attachments) {
        const parsed = await this.fileParserService.parseFile(
          attachment.content,
          attachment.filename,
          attachment.contentType
        );

        if (parsed) {
          if (parsed.isImage) {
            imageAttachments.push(parsed);
          } else {
            parsedAttachments.push(parsed);
          }
        }
      }

      console.log(
        `      ✅ Parsed ${parsedAttachments.length} text file(s) and ${imageAttachments.length} image(s)`
      );
    }

    // Build prompt with email content and extracted text from attachments
    let promptText = `You are an AI assistant that extracts structured proposal information from vendor email responses to RFPs.

Extract the following information from the vendor's email and any attached files:
- totalPrice: Total proposal price (as string, e.g., "45000" or "45000.00")
- pricing.lineItems: Array of items with pricing, matching the requested items where possible
  - itemName: Name of the item
  - quantity: Number of items (if mentioned)
  - unitPrice: Price per unit (as string)
  - totalPrice: Total price for this item (as string)
  - specifications: Any specifications provided
  - notes: Additional notes
- deliveryTime: Delivery timeline (e.g., "30 days", "2 weeks")
- paymentTerms: Payment terms (e.g., "net 30", "50% upfront")
- warranty: Warranty information
- additionalTerms: Any other terms as a JSON object

Requested items from RFP:
${rfpLineItems.map((item) => `- ${item.itemName} (Qty: ${item.quantity})`).join("\n")}

Vendor's email content:
${emailContent}`;

    // Add extracted text from attachments
    if (parsedAttachments.length > 0) {
      promptText += `\n\nAttached files content:\n`;
      parsedAttachments.forEach((parsed) => {
        promptText += `\n--- ${parsed.filename} (${parsed.mimeType}) ---\n`;
        promptText += `${parsed.text}\n`;
      });
    }

    promptText += `\nReturn ONLY valid JSON in this exact format:
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

    try {
      // Build message content - use Vision API if images exist, otherwise text-only
      const messageContent: any[] = [];

      // Add text prompt
      messageContent.push({
        type: "text",
        text: promptText,
      });

      // Add images if any
      if (imageAttachments.length > 0) {
        imageAttachments.forEach((image) => {
          messageContent.push({
            type: "image_url",
            image_url: {
              url: `data:${image.mimeType};base64,${image.base64}`,
            },
          });
        });
      }

      // Use gpt-4o if images exist (supports vision), otherwise gpt-4o-mini (cheaper)
      const model = imageAttachments.length > 0 ? "gpt-4o" : "gpt-4o-mini";

      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that extracts structured proposal data from vendor emails and attached files. Always return valid JSON only, no additional text.",
          },
          {
            role: "user",
            content: messageContent,
          },
        ],
        temperature: 0.0,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const extractedData = JSON.parse(content) as ExtractedProposalData;

      // Validate and set defaults
      if (!extractedData.pricing) {
        extractedData.pricing = { lineItems: [] };
      }

      const aiTime = Date.now() - aiStartTime;
      console.log(`      ✅ AI parsing completed in ${aiTime}ms`);
      console.log(
        `      📊 Extracted: ${extractedData.pricing.lineItems.length} line items`
      );

      return extractedData;
    } catch (error: any) {
      console.error("OpenAI proposal parsing error:", error);
      throw new Error(`Failed to parse proposal: ${error.message}`);
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\n\s*\n/g, "\n");
  }

  /**
   * Extract only the new reply content, excluding quoted original email
   * Common patterns:
   * - "On [date] [sender] wrote:"
   * - "From: [sender]"
   * - "-----Original Message-----"
   * - "> " quoted lines
   */
  private extractReplyContent(emailContent: string): string {
    if (!emailContent) return "";

    // Split by common quote markers
    const quoteMarkers = [
      /^On .+ wrote:.*$/m, // "On Wed, Dec 3, 2025 at 1:37 AM <email> wrote:"
      /^From:.*$/m, // "From: sender@example.com"
      /^-----Original Message-----.*$/m, // "-----Original Message-----"
      /^>+.*$/m, // Lines starting with ">"
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
      if (
        /^On .+ wrote:.*$/i.test(line) ||
        /^From:.*$/i.test(line) ||
        /^-----Original Message-----.*$/i.test(line)
      ) {
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
