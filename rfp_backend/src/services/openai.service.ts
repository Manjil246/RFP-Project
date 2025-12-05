import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/env";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export interface ExtractedRFPData {
  title: string;
  description?: string;
  budget?: string;
  deadline?: string;
  paymentTerms?: string;
  warranty?: string;
  otherTerms?: Record<string, any>;
  lineItems: Array<{
    itemName: string;
    quantity: number;
    specifications?: Record<string, any>;
    notes?: string;
  }>;
}

export class OpenAIService {
  async extractRFPFromNaturalLanguage(
    naturalLanguageText: string
  ): Promise<ExtractedRFPData> {
    const prompt = `You are an AI assistant that extracts structured RFP (Request for Proposal) information from natural language descriptions.

Extract the following information from the user's text:
- title: A concise title for the RFP
- description: A detailed description
- budget: Total budget amount (as a string, e.g., "50000" or "50000.00")
- deadline: Delivery deadline date (in YYYY-MM-DD format if mentioned)
- paymentTerms: Payment terms (e.g., "net 30", "net 60")
- warranty: Warranty requirements
- otherTerms: Any other terms as a JSON object
- lineItems: Array of items being procured, each with:
  - itemName: Name of the item
  - quantity: Number of items
  - specifications: Object with specs (e.g., {ram: "16GB", size: "27-inch"})
  - notes: Any additional notes(Not the ones already listed)

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "description": "string or null",
  "budget": "string or null",
  "deadline": "YYYY-MM-DD or null",
  "paymentTerms": "string or null",
  "warranty": "string or null",
  "otherTerms": {} or null,
  "lineItems": [
    {
      "itemName": "string",
      "quantity": number,
      "specifications": {} or null,
      "notes": "string or null"
    }
  ]
}

User's text:
${naturalLanguageText}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that extracts structured RFP data from natural language. Always return valid JSON only, no additional text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const extractedData = JSON.parse(content) as ExtractedRFPData;

      // Validate required fields
      if (!extractedData.title) {
        throw new Error("Title is required");
      }

      if (!extractedData.lineItems || extractedData.lineItems.length === 0) {
        throw new Error("At least one line item is required");
      }

      return extractedData;
    } catch (error: any) {
      console.error("OpenAI extraction error:", error);
      throw new Error(`Failed to extract RFP data: ${error.message}`);
    }
  }

  /**
   * Extract proposal data from email content using OpenAI
   * This is a generic method that can parse JSON from any prompt
   */
  async extractProposalFromEmail(prompt: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that extracts structured proposal data from emails. Always return valid JSON only, no additional text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const extractedData = JSON.parse(content);
      return extractedData;
    } catch (error: any) {
      console.error("OpenAI proposal extraction error:", error);
      throw new Error(`Failed to extract proposal data: ${error.message}`);
    }
  }
}
