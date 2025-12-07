import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/env";
import { Proposal } from "../models/proposal-model";
import { ProposalLineItem } from "../models/proposal-line-item-model";
import { RFP } from "../models/rfp-model";
import { RFPLineItem } from "../models/rfp-line-item-model";
import { ComparisonData, Recommendation } from "./proposal-comparison.service";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface ProposalWithVendor {
  proposal: Proposal & { lineItems: ProposalLineItem[] };
  vendor: { id: string; name: string; email: string };
}

interface RFPWithItems {
  id: string;
  title: string;
  description: string | null;
  budget: string | null;
  deadline: string | null;
  paymentTerms: string | null;
  warranty: string | null; // Changed from warrantyRequired to match RFP model
  lineItems: RFPLineItem[];
}

export class OpenAIComparisonService {
  /**
   * Compare proposals and generate recommendation using AI
   */
  async compareAndRecommend(
    rfp: RFPWithItems,
    proposalsWithVendors: ProposalWithVendor[]
  ): Promise<{ comparison: ComparisonData; recommendation: Recommendation }> {
    const llmStartTime = Date.now();
    console.log(
      `         📤 Sending request to OpenAI (model: gpt-4o-mini)...`
    );

    try {
      // Helper to convert value to string if it's an object, otherwise return string or null
      const toStringOrNull = (value: any): string | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === "string") {
          // If it's already a string, return it (but check for "[object Object]")
          return value === "[object Object]" ? "Not specified" : value;
        }
        if (typeof value === "object") {
          // If it's an object, try to convert it to a readable string
          try {
            // If it's an array, join the values
            if (Array.isArray(value)) {
              if (value.length === 0) return null;
              return value.map(item => 
                typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)
              ).join(", ");
            }
            // If it's an object, try to extract meaningful information
            // Check if it has common warranty-related keys
            if (value.duration || value.period || (value.length && typeof value.length === "number")) {
              const duration = value.duration || value.period || value.length;
              const unit = value.unit || "years";
              return `${duration} ${unit}`;
            }
            // Check for other common object patterns
            if (value.value) return String(value.value);
            if (value.text) return String(value.text);
            if (value.description) return String(value.description);
            // Otherwise, try to stringify key-value pairs
            const entries = Object.entries(value);
            if (entries.length > 0) {
              const formatted = entries
                .slice(0, 5) // Limit to first 5 entries to avoid too long strings
                .map(([key, val]) => {
                  if (val === null || val === undefined) return `${key}: N/A`;
                  if (typeof val === "object") {
                    try {
                      return `${key}: ${JSON.stringify(val)}`;
                    } catch {
                      return `${key}: [object]`;
                    }
                  }
                  return `${key}: ${String(val)}`;
                })
                .join(", ");
              return formatted || "Not specified";
            }
            // Empty object
            return "Not specified";
          } catch (e) {
            // If all else fails, try JSON.stringify
            try {
              const jsonStr = JSON.stringify(value);
              // Don't return "[object Object]" - return something more meaningful
              return jsonStr === "{}" ? "Not specified" : jsonStr;
            } catch {
              return "Not specified";
            }
          }
        }
        // For other types (number, boolean, etc.), convert to string
        const str = String(value);
        return str === "[object Object]" ? "Not specified" : str;
      };

      // Prepare proposal data for LLM
      const proposalsData = proposalsWithVendors.map(({ proposal, vendor }) => {
        const extracted = (proposal.extractedData as any) || {};
        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorEmail: vendor.email,
          totalPrice: extracted.totalPrice || null,
          deliveryTime: toStringOrNull(extracted.deliveryTime),
          paymentTerms: toStringOrNull(extracted.paymentTerms),
          warranty: toStringOrNull(extracted.warranty),
          lineItems: proposal.lineItems.map((item) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        };
      });

      const prompt = `You are an AI assistant that compares vendor proposals for an RFP and recommends the best vendor.

RFP Details:
- Title: ${rfp.title}
- Description: ${rfp.description || "N/A"}
- Budget: ${rfp.budget || "Not specified"}
- Deadline: ${rfp.deadline || "Not specified"}
- Payment Terms Required: ${rfp.paymentTerms || "Not specified"}
- Warranty Required: ${rfp.warranty || "Not specified"}
- Required Items: ${rfp.lineItems.map((item) => `${item.itemName} (Qty: ${item.quantity})`).join(", ")}

Proposals Received:
${JSON.stringify(proposalsData, null, 2)}

IMPORTANT: You must create a detailed comparison table with ALL available criteria from the proposals. For each proposal, extract and compare:
1. Total Price (use the exact value from totalPrice field)
2. Delivery Time (use the exact value from deliveryTime field)
3. Payment Terms (use the exact value from paymentTerms field)
4. Warranty (use the exact value from warranty field)
5. Completeness Score: Calculate intelligently (0-100) based on how well each proposal meets the RFP requirements:
   - How many required line items are provided with pricing
   - Whether total price is provided
   - Whether delivery time is provided
   - Whether payment terms are provided (if required in RFP)
   - Whether warranty is provided (if required in RFP)
   - Overall completeness of the proposal compared to RFP requirements
   - For each proposal, provide a detailed explanation of why the completeness score was given (what's included, what's missing, etc.)

For the comparisonTable, you MUST include ALL criteria that have values in at least one proposal. Use the EXACT vendorId from the proposalsData for the values object keys.

Return ONLY valid JSON in this exact format:
{
  "comparison": {
    "proposals": [
      {
        "proposalId": "string",
        "vendorId": "string",
        "vendorName": "string",
        "vendorEmail": "string",
        "totalPrice": "string or null",
        "deliveryTime": "string or null",
        "paymentTerms": "string or null",
        "warranty": "string or null",
        "completenessScore": number or null,
        "completenessScoreExplanation": "string or null - Detailed explanation of why this completeness score was given, including what requirements are met and what's missing"
      }
    ],
    "comparisonTable": [
      {
        "criteria": "Total Price",
        "values": {
          "vendorId1": "50000",
          "vendorId2": "45000"
        },
        "winner": "vendorId2"
      },
      {
        "criteria": "Delivery Time",
        "values": {
          "vendorId1": "30 days",
          "vendorId2": "20 days"
        },
        "winner": "vendorId2"
      },
      {
        "criteria": "Payment Terms",
        "values": {
          "vendorId1": "Net 30",
          "vendorId2": "Net 45"
        },
        "winner": null
      },
      {
        "criteria": "Warranty",
        "values": {
          "vendorId1": "1 year",
          "vendorId2": "2 years"
        },
        "winner": "vendorId2"
      },
      {
        "criteria": "Completeness Score",
        "values": {
          "vendorId1": 85,
          "vendorId2": 90
        },
        "winner": "vendorId2"
      }
    ],
    "summary": {
      "totalProposals": number,
      "priceRange": {
        "min": "string or null",
        "max": "string or null",
        "average": "string or null"
      },
      "deliveryRange": {
        "fastest": "string or null",
        "slowest": "string or null"
      }
    }
  },
  "recommendation": {
    "vendorId": "string",
    "vendorName": "string",
    "reasoning": "Very detailed and comprehensive explanation (3-5 paragraphs) of why this vendor is recommended. Include: specific comparisons with other vendors, how well it meets each RFP requirement, strengths and weaknesses analysis, and why it's the best overall choice",
    "score": number (0-100, overall recommendation score),
    "scoreBreakdown": {
      "priceScore": number (0-100, how well the price meets requirements - lower is better if within budget),
      "deliveryScore": number (0-100, how well delivery time meets requirements - faster is better if within deadline),
      "completenessScore": number (0-100, how complete the proposal is),
      "termsScore": number (0-100, how well payment terms and warranty meet requirements),
      "overallScore": number (0-100, weighted overall score),
      "explanation": "Detailed explanation of how each score was calculated and why, including specific comparisons with other proposals"
    }
  }
}

CRITICAL: 
- Use EXACT vendorId values from proposalsData as keys in the values object
- Include ALL criteria that have data (Total Price, Delivery Time, Payment Terms, Warranty, Completeness Score)
- Use the exact values from the proposals (don't convert or modify them)
- For winner determination, prioritize proposals that MEET RFP REQUIREMENTS:
  * Total Price: Lowest price that is within budget (if budget specified), otherwise lowest overall
  * Delivery Time: Fastest delivery that meets deadline (if deadline specified), otherwise fastest overall
  * Warranty: Longest warranty that meets requirement (if warranty required), otherwise longest overall
  * Completeness Score: Highest score
- If a proposal doesn't meet RFP requirements, it should NOT be the winner for that criteria
- If a value is null in a proposal, use null in the values object, not "N/A"
- The recommendation should heavily weight proposals that meet ALL RFP requirements
- Provide detailed explanations for completeness scores - explain what requirements are met, what's missing, and why the score was assigned
- The recommendation reasoning should be comprehensive (3-5 paragraphs) explaining the full analysis
- The score breakdown should explain how each component score was calculated with specific comparisons`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that compares vendor proposals and recommends the best vendor. Always return valid JSON only, no additional text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.0,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI for comparison");
      }

      const result = JSON.parse(content) as {
        comparison: ComparisonData;
        recommendation: Recommendation;
      };

      // Validate and ensure proposal IDs are correct, and merge GPT-calculated completenessScore
      // Map GPT response proposals by vendorId for quick lookup
      const gptProposalsMap = new Map(
        result.comparison.proposals.map((p) => [p.vendorId, p])
      );

      result.comparison.proposals = proposalsWithVendors.map(
        ({ proposal, vendor }) => {
          const extracted = (proposal.extractedData as any) || {};
          const gptProposal = gptProposalsMap.get(vendor.id);
          // Ensure all fields are properly formatted (convert objects to strings)
          const warrantyValue = toStringOrNull(extracted.warranty);
          const deliveryTimeValue = toStringOrNull(extracted.deliveryTime);
          const paymentTermsValue = toStringOrNull(extracted.paymentTerms);
          return {
            proposalId: proposal.id,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorEmail: vendor.email,
            totalPrice: extracted.totalPrice || null,
            deliveryTime: deliveryTimeValue,
            paymentTerms: paymentTermsValue,
            warranty: warrantyValue,
            completenessScore: gptProposal?.completenessScore ?? null,
            completenessScoreExplanation: gptProposal?.completenessScoreExplanation ?? null,
          };
        }
      );

      // Build comparison table from actual proposal data (ensure values are correctly mapped)
      // Winners are determined based on RFP requirements, not just relative comparison
      const comparisonTable: Array<{
        criteria: string;
        values: Record<string, string | number | null>;
        winner?: string;
      }> = [];

      // Helper to parse delivery time to days
      const parseDeliveryDays = (
        deliveryTime: string | null
      ): number | null => {
        if (!deliveryTime || typeof deliveryTime !== "string") return null;
        const match = deliveryTime.match(/(\d+)\s*(day|week|month)/i);
        if (!match) return null;
        const num = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === "day" || unit === "days") return num;
        if (unit === "week" || unit === "weeks") return num * 7;
        if (unit === "month" || unit === "months") return num * 30;
        return null;
      };

      // Helper to parse deadline to days from now
      const parseDeadlineDays = (deadline: string | null): number | null => {
        if (!deadline) return null;
        try {
          const deadlineDate = new Date(deadline);
          const now = new Date();
          const diffTime = deadlineDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 0 ? diffDays : null;
        } catch {
          return null;
        }
      };

      // Helper to determine winner considering RFP requirements
      const getNumericWinner = (
        values: Record<string, string | number | null>,
        lowerIsBetter: boolean,
        rfpRequirement?: number | null,
        meetsRequirement?: (value: number, requirement: number) => boolean
      ): string | undefined => {
        const numericValues: Array<{
          vendorId: string;
          value: number;
          meetsReq: boolean;
        }> = [];
        Object.entries(values).forEach(([vendorId, val]) => {
          if (val !== null && val !== undefined) {
            const num =
              typeof val === "string"
                ? parseFloat(val.replace(/[^0-9.-]/g, ""))
                : val;
            if (!isNaN(num)) {
              const meetsReq =
                rfpRequirement !== null &&
                rfpRequirement !== undefined &&
                meetsRequirement
                  ? meetsRequirement(num, rfpRequirement)
                  : true; // If no requirement, all meet it
              numericValues.push({ vendorId, value: num, meetsReq });
            }
          }
        });
        if (numericValues.length === 0) return undefined;

        // Prioritize vendors that meet requirements
        const meetingReq = numericValues.filter((v) => v.meetsReq);
        const candidates = meetingReq.length > 0 ? meetingReq : numericValues;

        return lowerIsBetter
          ? candidates.reduce((min, curr) =>
              curr.value < min.value ? curr : min
            ).vendorId
          : candidates.reduce((max, curr) =>
              curr.value > max.value ? curr : max
            ).vendorId;
      };

      // Parse RFP requirements
      const rfpBudget = rfp.budget
        ? parseFloat(rfp.budget.replace(/[^0-9.-]/g, ""))
        : null;
      const rfpDeadlineDays = parseDeadlineDays(rfp.deadline);

      // Total Price - winner is lowest price within budget (or lowest overall if no budget)
      const priceValues: Record<string, string | null> = {};
      result.comparison.proposals.forEach((p) => {
        priceValues[p.vendorId] = p.totalPrice;
      });
      if (Object.values(priceValues).some((v) => v !== null)) {
        comparisonTable.push({
          criteria: "Total Price",
          values: priceValues,
          winner: getNumericWinner(
            priceValues,
            true,
            rfpBudget,
            (price, budget) => price <= budget
          ),
        });
      }

      // Delivery Time - winner is fastest delivery that meets deadline (or fastest overall if no deadline)
      const deliveryValues: Record<string, string | null> = {};
      const deliveryDaysValues: Record<string, number | null> = {};
      result.comparison.proposals.forEach((p) => {
        deliveryValues[p.vendorId] = p.deliveryTime;
        deliveryDaysValues[p.vendorId] = parseDeliveryDays(p.deliveryTime);
      });
      if (Object.values(deliveryValues).some((v) => v !== null)) {
        comparisonTable.push({
          criteria: "Delivery Time",
          values: deliveryValues,
          winner: getNumericWinner(
            deliveryDaysValues,
            true, // Lower (faster) is better
            rfpDeadlineDays,
            (deliveryDays, deadlineDays) => deliveryDays <= deadlineDays
          ),
        });
      }

      // Payment Terms
      const paymentValues: Record<string, string | null> = {};
      result.comparison.proposals.forEach((p) => {
        paymentValues[p.vendorId] = p.paymentTerms;
      });
      if (Object.values(paymentValues).some((v) => v !== null)) {
        comparisonTable.push({
          criteria: "Payment Terms",
          values: paymentValues,
          winner: undefined, // No clear winner for payment terms
        });
      }

      // Warranty - winner is longest warranty that meets requirement (or longest overall if no requirement)
      const warrantyValues: Record<string, string | null> = {};
      const warrantyYearsValues: Record<string, number | null> = {};
      result.comparison.proposals.forEach((p) => {
        // Ensure warranty is a string or null - use the same helper function
        let warrantyStr = toStringOrNull(p.warranty);
        // Double-check: if it's still an object (shouldn't happen, but safety check)
        if (warrantyStr && typeof warrantyStr === "object") {
          warrantyStr = JSON.stringify(warrantyStr);
        }
        // Ensure it's a string or null
        warrantyValues[p.vendorId] = warrantyStr && typeof warrantyStr === "string" ? warrantyStr : null;
        // Try to parse warranty to years
        if (warrantyStr && typeof warrantyStr === "string") {
          const match = warrantyStr.match(/(\d+)\s*(year|month)/i);
          if (match) {
            const num = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            warrantyYearsValues[p.vendorId] =
              unit === "year" || unit === "years" ? num : num / 12;
          } else {
            warrantyYearsValues[p.vendorId] = null;
          }
        } else {
          warrantyYearsValues[p.vendorId] = null;
        }
      });
      if (Object.values(warrantyValues).some((v) => v !== null && v !== undefined)) {
        // Parse RFP warranty requirement
        const rfpWarrantyStr = toStringOrNull(rfp.warranty);
        const rfpWarrantyYears = rfpWarrantyStr
          ? (() => {
              if (typeof rfpWarrantyStr !== "string") return null;
              const match = rfpWarrantyStr.match(/(\d+)\s*(year|month)/i);
              if (match) {
                const num = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                return unit === "year" || unit === "years" ? num : num / 12;
              }
              return null;
            })()
          : null;

        // Final safety check: ensure all values in warrantyValues are strings or null
        const sanitizedWarrantyValues: Record<string, string | null> = {};
        Object.entries(warrantyValues).forEach(([vendorId, value]) => {
          if (value === null || value === undefined) {
            sanitizedWarrantyValues[vendorId] = null;
          } else if (typeof value === "string") {
            sanitizedWarrantyValues[vendorId] = value;
          } else if (typeof value === "object") {
            // Last resort: convert object to string
            sanitizedWarrantyValues[vendorId] = toStringOrNull(value);
          } else {
            sanitizedWarrantyValues[vendorId] = String(value);
          }
        });

        comparisonTable.push({
          criteria: "Warranty",
          values: sanitizedWarrantyValues,
          winner: getNumericWinner(
            warrantyYearsValues,
            false, // Higher (longer) is better
            rfpWarrantyYears,
            (warrantyYears, reqYears) => warrantyYears >= reqYears
          ),
        });
      }

      // Completeness Score
      const completenessValues: Record<string, number | null> = {};
      result.comparison.proposals.forEach((p) => {
        completenessValues[p.vendorId] = p.completenessScore;
      });
      if (Object.values(completenessValues).some((v) => v !== null)) {
        comparisonTable.push({
          criteria: "Completeness Score",
          values: completenessValues,
          winner: getNumericWinner(completenessValues, false),
        });
      }

      // Use our built comparison table (more reliable than LLM-generated one)
      result.comparison.comparisonTable = comparisonTable;

      const llmTime = Date.now() - llmStartTime;
      console.log(`         ✅ OpenAI response received in ${llmTime}ms`);

      return result;
    } catch (error: any) {
      console.error("OpenAI comparison error:", error);
      throw new Error(`Failed to generate comparison: ${error.message}`);
    }
  }
}
