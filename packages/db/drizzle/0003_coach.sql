CREATE TABLE "coach_letter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"week_starts_on" date NOT NULL,
	"headline" text NOT NULL,
	"body" text NOT NULL,
	"stats" jsonb NOT NULL,
	"adaptations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_by" text NOT NULL,
	"emailed_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_letter" ADD CONSTRAINT "coach_letter_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_message" ADD CONSTRAINT "coach_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coach_letter_user_week_idx" ON "coach_letter" USING btree ("user_id","week_starts_on");--> statement-breakpoint
CREATE INDEX "coach_message_user_idx" ON "coach_message" USING btree ("user_id","created_at");