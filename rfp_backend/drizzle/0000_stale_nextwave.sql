CREATE TYPE "public"."rfp_status" AS ENUM('draft', 'sent', 'in_review', 'closed');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "proposal_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"rfp_line_item_id" uuid,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(15, 2),
	"total_price" numeric(15, 2),
	"specifications" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"email_subject" varchar(500),
	"email_body" text,
	"email_message_id" varchar(255),
	"extracted_data" jsonb,
	"raw_attachments" jsonb,
	"parsed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfp_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"specifications" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfp_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfp_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"email_sent_at" timestamp,
	"email_status" "email_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"budget" numeric(15, 2),
	"deadline" date,
	"payment_terms" varchar(255),
	"warranty" varchar(255),
	"other_terms" jsonb,
	"status" "rfp_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"contact_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "proposal_line_items" ADD CONSTRAINT "proposal_line_items_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_line_items" ADD CONSTRAINT "proposal_line_items_rfp_line_item_id_rfp_line_items_id_fk" FOREIGN KEY ("rfp_line_item_id") REFERENCES "public"."rfp_line_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfp_line_items" ADD CONSTRAINT "rfp_line_items_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfp_vendors" ADD CONSTRAINT "rfp_vendors_rfp_id_rfps_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfp_vendors" ADD CONSTRAINT "rfp_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;