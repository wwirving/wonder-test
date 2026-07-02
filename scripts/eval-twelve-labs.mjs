// Eval: hit the real Twelve Labs API with the already-uploaded test clip and
// prove we can retrieve every field the editor needs (auto-tags + clips, plus a
// transcript spot-check). Prints a checklist and exits non-zero if anything the
// UI depends on is missing.
//
//   node --env-file=.env.local scripts/eval-twelve-labs.mjs
//   node --env-file=.env.local scripts/eval-twelve-labs.mjs --url https://.../source.mp4
//   node --env-file=.env.local scripts/eval-twelve-labs.mjs --video-id <uuid>
//
// The prompts + schemas below mirror lib/services/twelve-labs.ts — keep them in
// sync. This script is the live counterpart to the mocked unit tests.
import postgres from "postgres";
import { TwelveLabs } from "twelvelabs-js";

/* ---------- args + env ---------- */
const args = process.argv.slice(2);
const argVal = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const urlArg = argVal("--url");
const videoIdArg = argVal("--video-id");

const apiKey = process.env.TWELVE_LABS_API_KEY;
const indexId = process.env.TWELVE_LABS_INDEX_ID;
const dbUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!apiKey || !indexId) {
  console.error("TWELVE_LABS_API_KEY and TWELVE_LABS_INDEX_ID must be set");
  process.exit(1);
}

const client = new TwelveLabs({ apiKey });
const ANALYZE_MODEL = "pegasus1.2";

/* ---------- prompts + schemas (mirror lib/services/twelve-labs.ts) ---------- */
const TAGS_PROMPT =
  "You are tagging a short film for a curated streaming catalogue. Watch the " +
  "video and return: a 2-3 sentence synopsis (never invent or include a title), " +
  "mood/theme tags, and general descriptive tags. Each label must be 1-3 words " +
  "in Title Case. Return 3-5 mood tags and 3-6 tags. Do not return genres.";
const TAGS_SCHEMA = {
  type: "object",
  properties: {
    synopsis: { type: "string" },
    moodTags: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["synopsis", "moodTags", "tags"],
};
const CLIPS_PROMPT =
  "Identify the most shareable highlight moments in this video. For each, give " +
  "the start and end time in seconds (start must be less than end) and a short " +
  "2-5 word label describing the moment. Return between 1 and 5 clips.";
const CLIPS_SCHEMA = {
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

async function analyzeJson(videoId, prompt, jsonSchema) {
  const res = await client.analyze({
    videoId,
    modelName: ANALYZE_MODEL,
    prompt,
    temperature: 0.2,
    responseFormat: { type: "json_schema", jsonSchema },
  });
  if (!res.data) throw new Error("analyze returned no data");
  return JSON.parse(res.data);
}

/* ---------- resolve the test clip ---------- */
async function resolveClip() {
  if (urlArg) return { url: urlArg, source: "--url arg" };
  if (!dbUrl) {
    throw new Error("No --url given and DATABASE_URL not set to look one up");
  }
  const sql = postgres(dbUrl, { prepare: false, max: 1 });
  try {
    let rows;
    if (videoIdArg) {
      rows = await sql`
        select id, title, storage_path, tl_task_id
        from videos where id = ${videoIdArg} limit 1`;
    } else {
      // The real uploaded clip: storage_path is a Supabase URL (seed rows use
      // local /video/ paths, so filter those out). Newest first.
      const prefix = (supabaseUrl ?? "http") + "%";
      rows = await sql`
        select id, title, storage_path, tl_task_id
        from videos
        where storage_path like ${prefix}
        order by created_at desc limit 1`;
    }
    if (!rows.length || !rows[0].storage_path) {
      throw new Error(
        "No uploaded clip found. Upload one via the app, or pass --url.",
      );
    }
    return {
      url: rows[0].storage_path,
      source: `db video ${rows[0].id} ("${rows[0].title}")`,
      existingTaskId: rows[0].tl_task_id ?? null,
    };
  } finally {
    await sql.end();
  }
}

/* ---------- checklist ---------- */
let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);

/* ---------- run ---------- */
try {
  const clip = await resolveClip();
  console.log(`\nTest clip: ${clip.source}`);
  console.log(`URL: ${clip.url}\n`);

  // Dedup demo: reuse the task already recorded on the row, else create one.
  let taskId = clip.existingTaskId;
  if (taskId) {
    console.log(`De-dup: reusing existing task ${taskId} (no re-index).`);
  } else {
    console.log("Creating indexing task…");
    const created = await client.tasks.create({
      indexId,
      videoUrl: clip.url,
      enableVideoStream: true,
      userMetadata: JSON.stringify({ external_id: videoIdArg ?? "eval" }),
    });
    taskId = created.id;
    console.log(`Created task ${taskId}.`);
  }

  console.log("Waiting for indexing to finish (polling every 5s)…");
  const done = await client.tasks.waitForDone(taskId, {
    sleepInterval: 5,
    callback: (t) => console.log(`  status: ${t.status}`),
  });
  if (done.status !== "ready") {
    check("indexing reached 'ready'", false, `status=${done.status}`);
    throw new Error(`Indexing did not succeed (status=${done.status})`);
  }
  const videoId = done.videoId;
  check("indexing reached 'ready'", true, `videoId=${videoId}`);

  console.log("\nRunning /analyze for auto-tags…");
  const tags = await analyzeJson(videoId, TAGS_PROMPT, TAGS_SCHEMA);
  console.log(JSON.stringify(tags, null, 2));

  console.log("\nRunning /analyze for clips…");
  const clipsOut = await analyzeJson(videoId, CLIPS_PROMPT, CLIPS_SCHEMA);
  console.log(JSON.stringify(clipsOut, null, 2));

  console.log("\nFetching transcript (spot-check)…");
  let transcript = null;
  try {
    const v = await client.indexes.videos.retrieve(indexId, videoId, {
      transcription: true,
    });
    transcript = v.transcription ?? null;
    console.log(
      `  transcript segments: ${Array.isArray(transcript) ? transcript.length : 0}`,
    );
  } catch (e) {
    console.log(`  transcript fetch skipped: ${e?.message ?? e}`);
  }

  /* ---------- assert every field the editor consumes ---------- */
  console.log("\nField checklist (what /upload/[id] renders):");
  check("synopsis (string)", isStr(tags.synopsis));
  check(
    "moodTags (string[])",
    isStrArr(tags.moodTags),
    `${tags.moodTags?.length ?? 0}`,
  );
  check("tags (string[])", isStrArr(tags.tags), `${tags.tags?.length ?? 0}`);

  const rawClips = Array.isArray(clipsOut.clips) ? clipsOut.clips : [];
  const validClips = rawClips.filter(
    (c) =>
      Number.isFinite(Number(c.startS)) &&
      Number.isFinite(Number(c.endS)) &&
      Number(c.startS) >= 0 &&
      Number(c.startS) < Number(c.endS),
  );
  check(
    "clips[] with valid 0<=start<end + label",
    validClips.length > 0 && validClips.every((c) => isStr(c.label)),
    `${validClips.length}/${rawClips.length} valid`,
  );

  console.log(
    failures === 0
      ? "\n✅ All required fields present — enrichment can populate the editor."
      : `\n❌ ${failures} required field(s) missing.`,
  );
  process.exit(failures === 0 ? 0 : 1);
} catch (e) {
  console.error("\nEval failed:", e?.message ?? e);
  process.exit(1);
}
