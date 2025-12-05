import z from "zod";

export const healthCheckQuerySchema = z.object({
  name: z.string().min(2).max(20).optional(),
});
