ALTER TABLE "progress_photo" ADD COLUMN "content_type" text DEFAULT 'image/jpeg' NOT NULL;--> statement-breakpoint
ALTER TABLE "progress_photo" ADD COLUMN "bytes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "progress_photo" ADD COLUMN "analysis" jsonb;