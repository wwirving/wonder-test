/**
 * Server-only Twelve Labs client wrapper.
 *
 * Thin, typed surface over `twelvelabs-js` for the two things this app needs:
 * kicking off video indexing and turning a finished index into the structured
 * enrichment the editor shows (auto-tags + suggested clips). All calls require
 * `TWELVE_LABS_API_KEY`; index-scoped calls also need `TWELVE_LABS_INDEX_ID`
 * (the one shared index, created once via `scripts/tl-setup-index.mjs`).
 *
 * Config is read lazily and guarded per-call (not at module load) so pages that
 * never index still build/run when the keys are absent.
 */
import { TwelveLabs } from "twelvelabs-js";
import type { AiTagSuggestions, SuggestedClip } from "@/lib/twelve-labs/types";

/** The generative model behind `/analyze`. Pegasus is required for analysis. */
const ANALYZE_MODEL = "pegasus1.2";

let client: TwelveLabs | null = null;

function getClient(): TwelveLabs {
  if (client) return client;
  const apiKey = process.env.TWELVE_LABS_API_KEY;
  if (!apiKey) throw new Error("TWELVE_LABS_API_KEY is not configured");
  client = new TwelveLabs({ apiKey });
  return client;
}

function getIndexId(): string {
  const id = process.env.TWELVE_LABS_INDEX_ID;
  if (!id) throw new Error("TWELVE_LABS_INDEX_ID is not configured");
  return id;
}

/** Terminal-success + terminal-failure task states (the rest mean "still going"). */
export const TL_READY = "ready";
export const TL_FAILED = "failed";

export type IndexingHandle = { taskId: string; videoId: string | null };

/**
 * Create a video indexing task from a publicly reachable URL. Twelve Labs pulls
 * the bytes on their infra — we only hand over a string. `externalId` (our
 * videoId) is stored as user metadata for traceability in their dashboard.
 */
export async function createIndexingTask(input: {
  videoUrl: string;
  externalId: string;
}): Promise<IndexingHandle> {
  const res = await getClient().tasks.create({
    indexId: getIndexId(),
    videoUrl: input.videoUrl,
    enableVideoStream: true,
    userMetadata: JSON.stringify({ external_id: input.externalId }),
  });
  if (!res.id) throw new Error("Twelve Labs did not return a task id");
  return { taskId: res.id, videoId: res.videoId ?? null };
}

/** Current status + resolved videoId for a task (videoId fills in once known). */
export async function getTask(
  taskId: string,
): Promise<{ status: string; videoId: string | null }> {
  const res = await getClient().tasks.retrieve(taskId);
  return { status: res.status ?? "", videoId: res.videoId ?? null };
}

/**
 * Run a structured `/analyze` call and parse the JSON payload it returns.
 * `data` comes back as a stringified JSON object matching `jsonSchema`.
 */
async function analyzeJson<T>(
  videoId: string,
  prompt: string,
  jsonSchema: Record<string, unknown>,
): Promise<T> {
  const res = await getClient().analyze({
    videoId,
    modelName: ANALYZE_MODEL,
    prompt,
    temperature: 0.2,
    responseFormat: { type: "json_schema", jsonSchema },
  });
  if (!res.data) throw new Error("Twelve Labs analyze returned no data");
  return JSON.parse(res.data) as T;
}

const TAGS_PROMPT =
  "You are tagging a short film for a curated streaming catalogue. Watch the " +
  "video and return: a 2-3 sentence synopsis (never invent or include a title), " +
  "mood/theme tags, and general descriptive tags. Each label must be 1-3 words " +
  "in Title Case. Return 3-5 mood tags and 3-6 tags. Do not return genres.";

// Note the schema constraints Twelve Labs enforces: strings cannot use
// minLength/maxLength, and array `minItems` may only be 0 or 1 — so we keep
// counts to the prompt and validate shape ourselves after parsing.
const TAGS_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    synopsis: { type: "string" },
    moodTags: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["synopsis", "moodTags", "tags"],
};

const asStrings = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];

/** Auto-tags: synopsis draft + genre/mood/tag suggestions for the creator. */
export async function analyzeTags(videoId: string): Promise<AiTagSuggestions> {
  const raw = await analyzeJson<Partial<AiTagSuggestions>>(
    videoId,
    TAGS_PROMPT,
    TAGS_SCHEMA,
  );
  return {
    synopsis: typeof raw.synopsis === "string" ? raw.synopsis.trim() : "",
    moodTags: asStrings(raw.moodTags),
    tags: asStrings(raw.tags),
  };
}

const CLIPS_PROMPT =
  "Identify the most shareable highlight moments in this video. For each, give " +
  "the start and end time in seconds (start must be less than end) and a short " +
  "2-5 word label describing the moment. Return between 1 and 5 clips.";

const CLIPS_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    clips: {
      type: "array",
      items: {
        type: "object",
        properties: {
          startS: { type: "number" },
          endS: { type: "number" },
          label: { type: "string" },
        },
        required: ["startS", "endS", "label"],
      },
    },
  },
  required: ["clips"],
};

/**
 * Suggested clips. We validate each range (0 <= start < end) so it satisfies the
 * `clips` table CHECK constraint, and synthesise a stable id from the range.
 */
export async function analyzeClips(videoId: string): Promise<SuggestedClip[]> {
  const raw = await analyzeJson<{ clips?: unknown }>(
    videoId,
    CLIPS_PROMPT,
    CLIPS_SCHEMA,
  );
  const items = Array.isArray(raw.clips) ? raw.clips : [];
  const clips: SuggestedClip[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const startS = Number(c.startS);
    const endS = Number(c.endS);
    const label = typeof c.label === "string" ? c.label.trim() : "";
    if (!Number.isFinite(startS) || !Number.isFinite(endS)) continue;
    if (startS < 0 || startS >= endS) continue;
    clips.push({ id: `${startS}-${endS}`, startS, endS, label });
  }
  return clips;
}
