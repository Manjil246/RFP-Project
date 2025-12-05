CREATE TABLE "watch_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"last_history_id" varchar(255),
	"watch_expiration" bigint,
	"last_renewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watch_state_email_address_unique" UNIQUE("email_address")
);
