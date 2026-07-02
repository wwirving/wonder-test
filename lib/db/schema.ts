import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AiTagSuggestions } from "@/lib/twelve-labs/types";

/** A single cast/crew credit — role + name (e.g. "Cinematographer" · "…"). */
export type Credit = { role: string; name: string };

/* ---------- enums ---------- */

export const accessTierEnum = pgEnum("access_tier", ["public", "members"]);
export const videoStatusEnum = pgEnum("video_status", ["draft", "published"]);
// Twelve Labs webhook lifecycle, shared by ai_tags_status and ai_clips_status.
export const aiStatusEnum = pgEnum("ai_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

/* ---------- videos ---------- */
// Genre / mood / tags are free-form text[] (not pgEnum): multi-select, open vocabulary.

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    synopsis: text("synopsis"),
    director: text("director"),
    // Cast & crew, authored by the creator. jsonb array of { role, name } —
    // richer than a flat text[] because a credit is inherently a pair.
    credits: jsonb("credits")
      .$type<Credit[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    genre: text("genre")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    moodTags: text("mood_tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    runtimeSeconds: integer("runtime_seconds"), // derived from the probed file at upload
    posterUrl: text("poster_url"),
    accessTier: accessTierEnum("access_tier").notNull().default("public"),
    storagePath: text("storage_path"), // Supabase Storage object path
    status: videoStatusEnum("status").notNull().default("draft"),
    aiTagsStatus: aiStatusEnum("ai_tags_status").notNull().default("pending"),
    aiClipsStatus: aiStatusEnum("ai_clips_status").notNull().default("pending"),
    // Twelve Labs handles: the indexing task (polled + used for crash recovery)
    // and the resolved video id (the retrieval handle for /analyze). Null until
    // the indexing reconciler kicks the video off (see lib/services/indexing.ts).
    tlTaskId: text("tl_task_id"),
    tlVideoId: text("tl_video_id"),
    // When the current indexing attempt was claimed. Lets the reconciler tell a
    // genuine crash (stuck minutes with no task id) apart from the normal
    // sub-second window between claiming and persisting tlTaskId.
    indexingStartedAt: timestamp("indexing_started_at", { withTimezone: true }),
    // Persisted /analyze auto-tag payload, so suggestions survive a reload/poll
    // and the creator can accept them later. Clips persist to the `clips` table.
    aiSuggestions: jsonb("ai_suggestions").$type<AiTagSuggestions>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("videos_status_idx").on(t.status),
    index("videos_created_at_idx").on(t.createdAt),
    check(
      "runtime_positive",
      sql`${t.runtimeSeconds} is null or ${t.runtimeSeconds} >= 0`,
    ),
  ],
);

/* ---------- watch_events ---------- */

export const watchEvents = pgTable(
  "watch_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    watchedSeconds: real("watched_seconds").notNull(),
    videoDuration: real("video_duration").notNull(),
    // Stored generated column: fraction watched, capped at 1.0 (rewind/loop safe)
    // and 0-duration safe via nullif. The DB owns this metric so aggregates stay trivial.
    pctWatched: real("pct_watched").generatedAlwaysAs(
      sql`least(watched_seconds / nullif(video_duration, 0), 1.0)`,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("watch_events_video_id_idx").on(t.videoId),
    index("watch_events_video_created_idx").on(t.videoId, t.createdAt),
    check("watched_seconds_nonneg", sql`${t.watchedSeconds} >= 0`),
    check("video_duration_pos", sql`${t.videoDuration} > 0`),
  ],
);

/* ---------- clips ---------- */

export const clips = pgTable(
  "clips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    startS: real("start_s").notNull(),
    endS: real("end_s").notNull(),
    label: text("label"),
    // A still frame grabbed from the clip's start, stored in Storage — the
    // distinct thumbnail shown at rest (generated client-side once clips land).
    posterUrl: text("poster_url"),
    // Whether the creator kept this AI-suggested clip to feature. Auto-clips
    // start featured (matching the editor's "all selected by default"); the
    // creator unfeatures the ones they don't want. Drives the discover reel.
    featured: boolean("featured").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("clips_video_id_idx").on(t.videoId),
    check("clip_range_valid", sql`${t.startS} >= 0 and ${t.startS} < ${t.endS}`),
  ],
);

/* ---------- inferred types ---------- */

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type WatchEvent = typeof watchEvents.$inferSelect;
export type NewWatchEvent = typeof watchEvents.$inferInsert;
export type Clip = typeof clips.$inferSelect;
export type NewClip = typeof clips.$inferInsert;
