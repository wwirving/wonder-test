CREATE TABLE "loves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loves" ADD CONSTRAINT "loves_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loves_video_session_uniq" ON "loves" USING btree ("video_id","session_id");--> statement-breakpoint
CREATE INDEX "loves_video_id_idx" ON "loves" USING btree ("video_id");