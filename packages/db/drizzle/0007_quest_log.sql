CREATE TABLE "quest_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"on_date" date NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'asked' NOT NULL,
	"session_id" uuid,
	"payload" jsonb,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "quest_log" ADD CONSTRAINT "quest_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_log" ADD CONSTRAINT "quest_log_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quest_log_user_idx" ON "quest_log" USING btree ("user_id","on_date");