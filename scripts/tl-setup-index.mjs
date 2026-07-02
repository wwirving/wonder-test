// Create (once) the shared Twelve Labs index this app indexes every video into,
// then print its id to paste into TWELVE_LABS_INDEX_ID. Idempotent: if an index
// named `wonder-tv` already exists, it prints that id instead of creating a new
// one.
//
//   node --env-file=.env.local scripts/tl-setup-index.mjs
import { TwelveLabs } from "twelvelabs-js";

const INDEX_NAME = "wonder-tv";
// Pegasus powers /analyze (auto-tags + clips). Marengo (search/embeddings) is a
// "with more time" upgrade — omitted to keep indexing fast and cheap.
const MODELS = [{ modelName: "pegasus1.2", modelOptions: ["visual", "audio"] }];

const apiKey = process.env.TWELVE_LABS_API_KEY;
if (!apiKey) {
  console.error("TWELVE_LABS_API_KEY is not set");
  process.exit(1);
}

const client = new TwelveLabs({ apiKey });

async function findByName(name) {
  const page = await client.indexes.list({ pageLimit: 50 });
  for await (const idx of page) {
    if (idx.indexName === name) return idx;
  }
  return null;
}

try {
  const existing = await findByName(INDEX_NAME);
  if (existing) {
    console.log(`Index "${INDEX_NAME}" already exists.`);
    console.log(`\nTWELVE_LABS_INDEX_ID=${existing.id}`);
  } else {
    const created = await client.indexes.create({
      indexName: INDEX_NAME,
      models: MODELS,
    });
    console.log(`Created index "${INDEX_NAME}".`);
    console.log(`\nTWELVE_LABS_INDEX_ID=${created.id}`);
  }
  console.log("\nPaste the line above into wonder-test/.env.local");
} catch (e) {
  console.error("Index setup failed:", e?.message ?? e);
  process.exitCode = 1;
}
