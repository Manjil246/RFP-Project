-- Add compared column to proposal_comparisons table
ALTER TABLE "proposal_comparisons" ADD COLUMN "compared" boolean DEFAULT false NOT NULL;

-- Update existing records: if comparison exists, mark as compared
UPDATE "proposal_comparisons" SET "compared" = true WHERE "comparison_data" IS NOT NULL;

