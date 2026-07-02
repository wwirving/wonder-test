CREATE TYPE "public"."access_tier" AS ENUM('public', 'members');--> statement-breakpoint
CREATE TYPE "public"."ai_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "clips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"start_s" real NOT NULL,
	"end_s" real NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clip_range_valid" CHECK ("clips"."start_s" >= 0 and "clips"."start_s" < "clips"."end_s")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"synopsis" text,
	"director" text,
	"genre" text[] DEFAULT '{}'::text[] NOT NULL,
	"mood_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"runtime_seconds" integer,
	"poster_url" text,
	"access_tier" "access_tier" DEFAULT 'public' NOT NULL,
	"storage_path" text,
	"status" "video_status" DEFAULT 'draft' NOT NULL,
	"ai_tags_status" "ai_status" DEFAULT 'pending' NOT NULL,
	"ai_clips_status" "ai_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "runtime_positive" CHECK ("videos"."runtime_seconds" is null or "videos"."runtime_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "watch_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"watched_seconds" real NOT NULL,
	"video_duration" real NOT NULL,
	"pct_watched" real GENERATED ALWAYS AS (least(watched_seconds / nullif(video_duration, 0), 1.0)) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watched_seconds_nonneg" CHECK ("watch_events"."watched_seconds" >= 0),
	CONSTRAINT "video_duration_pos" CHECK ("watch_events"."video_duration" > 0)
);
--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_events" ADD CONSTRAINT "watch_events_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clips_video_id_idx" ON "clips" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "videos_status_idx" ON "videos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "watch_events_video_id_idx" ON "watch_events" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "watch_events_video_created_idx" ON "watch_events" USING btree ("video_id","created_at");