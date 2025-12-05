import { z } from "zod";

export const createRFPSchema = z.object({
  body: z.object({
    naturalLanguageText: z
      .string()
      .min(10, "Natural language text must be at least 10 characters")
      .max(5000, "Natural language text must be less than 5000 characters"),
  }),
});

export const updateRFPSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    budget: z.string().optional(),
    deadline: z.string().optional(),
    paymentTerms: z.string().optional(),
    warranty: z.string().optional(),
    otherTerms: z.record(z.any()).optional(),
    status: z.enum(["draft", "sent", "in_review", "closed"]).optional(),
  }),
  params: z.object({
    id: z.string().uuid("Invalid RFP ID format"),
  }),
});

export const getRFPByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid RFP ID format"),
  }),
});

export const deleteRFPSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid RFP ID format"),
  }),
});

export const sendRFPToVendorsSchema = z.object({
  body: z.object({
    vendorIds: z
      .array(z.string().uuid("Invalid vendor ID format"))
      .min(1, "At least one vendor ID is required"),
  }),
  params: z.object({
    id: z.string().uuid("Invalid RFP ID format"),
  }),
});

