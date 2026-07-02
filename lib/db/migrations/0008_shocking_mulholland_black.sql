CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"author_name" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_body_nonempty" CHECK (length(btrim("comments"."body")) > 0)
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_video_id_idx" ON "comments" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "comments_video_created_idx" ON "comments" USING btree ("video_id","created_at");