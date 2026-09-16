/**
 * Sets each article's `updated` date in lib/learn-articles.ts to the last git commit that touched
 * app/learn/<slug>/ (never earlier than `published`). Run after committing article edits:
 *   ./node_modules/.bin/tsx scripts/sync-learn-updated.ts
 * Vercel builds use a shallow clone, so the dates are stored in the file rather than read from git
 * at build time.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { LEARN_ARTICLES } from "../lib/learn-articles";

const FILE = "lib/learn-articles.ts";
let src = readFileSync(FILE, "utf8");
let changed = 0;

for (const a of LEARN_ARTICLES) {
  const gitDate = execFileSync("git", ["log", "-1", "--format=%cs", "--", `app/learn/${a.slug}/`], {
    encoding: "utf8",
  }).trim();
  const updated = gitDate && gitDate > a.published ? gitDate : a.published;
  if (updated === a.updated) continue;
  const block = new RegExp(`(slug: "${a.slug}",[\\s\\S]*?updated: ")\\d{4}-\\d{2}-\\d{2}(")`);
  if (!block.test(src)) throw new Error(`No updated field found for ${a.slug}`);
  src = src.replace(block, `$1${updated}$2`);
  console.log(`${a.slug}: ${a.updated} -> ${updated}`);
  changed++;
}

writeFileSync(FILE, src);
console.log(`${changed} article date(s) changed`);
