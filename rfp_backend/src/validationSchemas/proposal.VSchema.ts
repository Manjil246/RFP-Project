import { z } from "zod";

export const getProposalByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid proposal ID format"),
  }),
});

export const getProposalsByRFPIdSchema = z.object({
  params: z.object({
    rfpId: z.string().uuid("Invalid RFP ID format"),
  }),
});

