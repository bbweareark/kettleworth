CREATE TABLE "rest_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"session_id" uuid,
	"kind" text NOT NULL,
	"item_id" text,
	"correct" boolean,
	"detail" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rest_activity" ADD CONSTRAINT "rest_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rest_activity" ADD CONSTRAINT "rest_activity_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rest_activity_user_idx" ON "rest_activity" USING btree ("user_id","created_at");