// Seed the discover feed with a starter catalogue so a fresh DB isn't empty.
// Idempotent: re-running is a no-op (ON CONFLICT (id) DO NOTHING). These rows
// mirror lib/mock-videos.ts and reuse the local demo assets in public/video/.
//
//   node --env-file=.env.local scripts/seed.mjs
import postgres from "postgres";

const POSTER = "/video/mock-poster.webp";
const SRC = "/video/mock.mp4";

const rows = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Andalucía",
    synopsis:
      "A sun-bleached elegy for a vanishing south — processions, grief, and gold leaf, shot on 16mm across a single Holy Week.",
    director: "YZA Voku",
    genre: ["Drama", "Documentary"],
    mood_tags: ["Contemplative", "Devotional", "Sun-drenched"],
    tags: ["16mm", "Spain", "Ritual"],
    runtime_seconds: 639,
    poster_url: POSTER,
    access_tier: "public",
    storage_path: SRC,
    status: "published",
    ai_tags_status: "ready",
    ai_clips_status: "ready",
    created_at: new Date("2026-06-18T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    title: "Le Drip",
    synopsis:
      "Paint meets water in extreme macro. A meditation on colour, surface tension, and the exact moment form becomes feeling.",
    director: "Alex Naghavi",
    genre: ["Animation", "Music"],
    mood_tags: ["Hypnotic", "Abstract", "Tactile"],
    tags: ["Macro", "Experimental", "Colour"],
    runtime_seconds: 279,
    poster_url: POSTER,
    access_tier: "public",
    storage_path: SRC,
    status: "published",
    ai_tags_status: "ready",
    ai_clips_status: "ready",
    created_at: new Date("2026-06-11T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    title: "91",
    synopsis:
      "Inspired by Psalm 91 and The Screwtape Letters — a wordless descent and return, staged in body paint and cold northern light.",
    director: "Jordan Daniel Chesney",
    genre: ["Drama", "Thriller"],
    mood_tags: ["Ominous", "Spiritual", "Stark"],
    tags: ["Portrait", "Allegory"],
    runtime_seconds: 153,
    poster_url: POSTER,
    access_tier: "members",
    storage_path: SRC,
    status: "published",
    ai_tags_status: "ready",
    ai_clips_status: "pending",
    created_at: new Date("2026-05-30T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    title: "Nightshade",
    synopsis:
      "A neon-soaked chase through a city that never resolves. Genre exercise as mood piece — all pursuit, no arrival.",
    director: "Mara Quinn",
    genre: ["Thriller", "Sci-Fi"],
    mood_tags: ["Neon", "Tense", "Nocturnal"],
    tags: ["Anamorphic", "Night", "Chase"],
    runtime_seconds: 512,
    poster_url: POSTER,
    access_tier: "public",
    storage_path: SRC,
    status: "published",
    ai_tags_status: "ready",
    ai_clips_status: "ready",
    created_at: new Date("2026-04-22T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    title: "The Long Way Down",
    synopsis:
      "Two strangers share a cable-car cabin for eleven minutes and a lifetime. A comedy about how much can be said in a small box.",
    director: "Idris Bello",
    genre: ["Comedy", "Drama"],
    mood_tags: ["Warm", "Wry", "Intimate"],
    tags: ["Two-hander", "Dialogue", "Alps"],
    runtime_seconds: 668,
    poster_url: POSTER,
    access_tier: "public",
    storage_path: SRC,
    status: "published",
    ai_tags_status: "ready",
    ai_clips_status: "ready",
    created_at: new Date("2025-11-09T10:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    title: "Static Bloom",
    synopsis:
      "Archival TV signals decay into gardens. A found-footage collage on memory, entropy, and the beauty of a dying broadcast.",
    director: "Petra Volk",
    genre: ["Documentary", "Horror"],
    mood_tags: ["Nostalgic", "Eerie", "Glitch"],
    tags: ["Found-footage", "Analog", "Collage"],
    runtime_seconds: 402,
    poster_url: POSTER,
    access_tier: "public",
    storage_path: SRC,
    status: "published",
    ai_tags_status: "processing",
    ai_clips_status: "pending",
    created_at: new Date("2025-08-14T10:00:00Z"),
  },
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });
try {
  const cols = [
    "id",
    "title",
    "synopsis",
    "director",
    "genre",
    "mood_tags",
    "tags",
    "runtime_seconds",
    "poster_url",
    "access_tier",
    "storage_path",
    "status",
    "ai_tags_status",
    "ai_clips_status",
    "created_at",
  ];
  const inserted = await sql`
    insert into videos ${sql(rows, ...cols)}
    on conflict (id) do nothing
    returning id
  `;
  console.log(`Seed complete — ${inserted.length} new row(s), ${rows.length - inserted.length} already present.`);
} catch (e) {
  console.error("Seed failed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
