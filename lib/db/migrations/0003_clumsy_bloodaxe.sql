ALTER TABLE "videos" ADD COLUMN "tl_task_id" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "tl_video_id" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "ai_suggestions" jsonb;