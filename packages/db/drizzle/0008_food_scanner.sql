CREATE TABLE "food_product" (
	"barcode" text PRIMARY KEY NOT NULL,
	"found" integer DEFAULT 1 NOT NULL,
	"name" text,
	"brand" text,
	"per100" jsonb,
	"unit" text DEFAULT 'g' NOT NULL,
	"serving_size" real,
	"serving_label" text,
	"image_url" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_log" ADD COLUMN "detail" jsonb;