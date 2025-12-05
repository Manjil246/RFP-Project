import { z } from "zod";

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    email: z.string().email("Invalid email format"),
    contactInfo: z.record(z.any()).optional(),
  }),
});

export const updateVendorSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    contactInfo: z.record(z.any()).optional(),
  }),
  params: z.object({
    id: z.string().uuid("Invalid vendor ID format"),
  }),
});

export const getVendorByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid vendor ID format"),
  }),
});

export const deleteVendorSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid vendor ID format"),
  }),
});

