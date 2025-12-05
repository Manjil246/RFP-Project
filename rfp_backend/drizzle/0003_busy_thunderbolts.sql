CREATE TABLE "proposal_comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_id" uuid NOT NULL,
	"proposal_ids" jsonb NOT NULL,
	"comparison_data" jsonb NOT NULL,
	"recommendation" jsonb NOT NULL,
	"proposal_hashes" jsonb NOT NULL,
	"computed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_comparisons_rfp_id_unique" UNIQUE("rfp_id")
);
--> statement-breakpoint
ALTER TABLE "proposal_comparisons" ADD CONSTRAINT "proposal_comparisons_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE cascade ON UPDATE no action;