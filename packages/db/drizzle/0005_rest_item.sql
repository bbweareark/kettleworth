CREATE TABLE "rest_item" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"tag" text NOT NULL,
	"payload" jsonb NOT NULL,
	"generated_by" text DEFAULT 'ai' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rest_item_kind_idx" ON "rest_item" USING btree ("kind","created_at");