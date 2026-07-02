import { type Video } from "@/lib/db/schema";
import { db } from "@/lib/db/client";
import { getVideo, listVideos } from "@/lib/services/videos";

/**
 * Seed catalogue for the discover feed. These are shaped as real `Video` rows
 * and are inserted into the DB by `lib/db/seed.ts` so discovery isn't empty in a
 * fresh environment. The feed itself now reads live from Postgres (below); this
 * array is only the seed source of truth.
 *
 * Posters/previews reuse the local demo assets in `public/video/`;
 * `storagePath` doubles as the (locally playable) hover-preview source.
 */
export const MOCK_VIDEOS: Video[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Andalucía",
    synopsis:
      "A sun-bleached elegy for a vanishing south — processions, grief, and gold leaf, shot on 16mm across a single Holy Week.",
    director: "YZA Voku",
    credits: [],
    genre: ["Drama", "Documentary"],
    moodTags: ["Contemplative", "Devotional", "Sun-drenched"],
    tags: ["16mm", "Spain", "Ritual"],
    runtimeSeconds: 639,
    posterUrl: "/video/mock-poster.webp",
    accessTier: "public",
    storagePath: "/video/mock.mp4",
    status: "published",
    aiTagsStatus: "ready",
    aiClipsStatus: "ready",
    createdAt: new Date("2026-06-18T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    title: "Le Drip",
    synopsis:
      "Paint meets water in extreme macro. A meditation on colour, surface tension, and the exact moment form becomes feeling.",
    director: "Alex Naghavi",
    credits: [],
    genre: ["Animation", "Music"],
    moodTags: ["Hypnotic", "Abstract", "Tactile"],
    tags: ["Macro", "Experimental", "Colour"],
    runtimeSeconds: 279,
    posterUrl: "/video/mock-poster.webp",
    accessTier: "public",
    storagePath: "/video/mock.mp4",
    status: "published",
    aiTagsStatus: "ready",
    aiClipsStatus: "ready",
    createdAt: new Date("2026-06-11T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    title: "91",
    synopsis:
      "Inspired by Psalm 91 and The Screwtape Letters — a wordless descent and return, staged in body paint and cold northern light.",
    director: "Jordan Daniel Chesney",
    credits: [],
    genre: ["Drama", "Thriller"],
    moodTags: ["Ominous", "Spiritual", "Stark"],
    tags: ["Portrait", "Allegory"],
    runtimeSeconds: 153,
    posterUrl: "/video/mock-poster.webp",
    accessTier: "members",
    storagePath: "/video/mock.mp4",
    status: "published",
    aiTagsStatus: "ready",
    aiClipsStatus: "pending",
    createdAt: new Date("2026-05-30T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    title: "Nightshade",
    synopsis:
      "A neon-soaked chase through a city that never resolves. Genre exercise as mood piece — all pursuit, no arrival.",
    director: "Mara Quinn",
    credits: [],
    genre: ["Thriller", "Sci-Fi"],
    moodTags: ["Neon", "Tense", "Nocturnal"],
    tags: ["Anamorphic", "Night", "Chase"],
    runtimeSeconds: 512,
    posterUrl: "/video/mock-poster.webp",
    accessTier: "public",
    storagePath: "/video/mock.mp4",
    status: "published",
    aiTagsStatus: "ready",
    aiClipsStatus: "ready",
    createdAt: new Date("2026-04-22T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    title: "The Long Way Down",
    synopsis:
      "Two strangers share a cable-car cabin for eleven minutes and a lifetime. A comedy about how much can be said in a small box.",
    director: "Idris Bello",
    credits: [],
    genre: ["Comedy", "Drama"],
    moodTags: ["Warm", "Wry", "Intimate"],
    tags: ["Two-hander", "Dialogue", "Alps"],
    runtimeSeconds: 668,
    posterUrl: "/video/mock-poster.webp",
    accessTier: "public",
    storagePath: "/video/mock.mp4",
    status: "published",
    aiTagsStatus: "ready",
    aiClipsStatus: "ready",
    createdAt: new Date("2025-11-09T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    title: "Static Bloom",
    synopsis:
      "Archival TV signals decay into gardens. A found-footage collage on memory, entropy, and the beauty of a dying broadcast.",
    director: "Petra Volk",
    credits: [],
    genre: ["Documentary", "Horror"],
    moodTags: ["Nostalgic", "Eerie", "Glitch"],
    tags: ["Found-footage", "Analog", "Collage"],
    runtimeSeconds: 402,
    posterUrl: "/video/mock-poster.webp",
    accessTier: "public",
    storagePath: "/video/mock.mp4",
    status: "published",
    aiTagsStatus: "processing",
    aiClipsStatus: "pending",
    createdAt: new Date("2025-08-14T10:00:00Z"),
  },
];

/** The discover feed: published videos, newest first — read live from the DB. */
export async function getDiscoverVideos(): Promise<Video[]> {
  return listVideos(db, { status: "published" });
}

/** A single video by id, for the watch page — read live from the DB. */
export async function getVideoById(id: string): Promise<Video | null> {
  return getVideo(db, id);
}
