// Copy the translations dataset from the backend repo into this repo's
// bundled snapshot (data/translations.json).
//
// Usage: npm run sync:data [-- path/to/Translations_with_sources.json]
// Default source: ../redcardapi/data/Translations_with_sources.json
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(
  process.argv[2] ||
    process.env.CARD_DATA_SOURCE ||
    resolve(root, "../redcardapi/data/Translations_with_sources.json")
);
const target = resolve(root, "data/translations.json");

if (!existsSync(source)) {
  console.error(`Source dataset not found: ${source}`);
  process.exit(1);
}

const parsed = JSON.parse(readFileSync(source, "utf8"));
const count = Object.keys(parsed.languages || {}).length;
if (!count) {
  console.error("Source dataset has no languages; refusing to overwrite snapshot.");
  process.exit(1);
}

copyFileSync(source, target);
console.log(`Synced ${count} languages from ${source}`);
