/**
 * Build an in-memory semantic index from a directory of markdown notes.
 *
 * Standalone Node script (NOT inside Obsidian). Validates the embedding
 * model + retrieval shape end-to-end before integrating into the plugin.
 *
 * Usage (after `npm install` from the experiment dir):
 *   ts-node src/build-index.ts --vault /path/to/vault --query "投資"
 *
 * Output: ranked list of top-k notes with cosine scores.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { createHash } from "node:crypto";
import { BruteForceIndex } from "./brute-force-knn";
import { createEmbedder, truncateForEmbed } from "./embed";
import type { NoteRecord } from "./types";

async function* walkMarkdown(root: string): AsyncGenerator<string> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // skip .obsidian, .git, etc.
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdown(full);
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      yield full;
    }
  }
}

async function loadNotes(vaultPath: string): Promise<NoteRecord[]> {
  const records: NoteRecord[] = [];
  for await (const file of walkMarkdown(vaultPath)) {
    const body = await readFile(file, "utf-8");
    const stats = await stat(file);
    const path = relative(vaultPath, file).replace(/\\/g, "/");
    const title = path.split("/").pop()!.replace(/\.md$/i, "");
    const contentHash = createHash("sha256").update(body).digest("hex").slice(0, 16);
    records.push({ path, title, body, mtime: stats.mtimeMs, contentHash });
  }
  return records;
}

interface BuildResult {
  index: BruteForceIndex;
  noteCount: number;
  durationMs: number;
}

export async function buildIndex(vaultPath: string): Promise<BuildResult> {
  const t0 = Date.now();
  console.log(`[hnsw-prototype] Loading notes from ${vaultPath}`);
  const notes = await loadNotes(vaultPath);
  console.log(`[hnsw-prototype] Found ${notes.length} markdown files`);

  console.log(`[hnsw-prototype] Initializing embedder (first call downloads model ~80MB)`);
  const embed = await createEmbedder();

  const index = new BruteForceIndex();
  let i = 0;
  for (const note of notes) {
    const text = `${note.title}\n\n${truncateForEmbed(note.body)}`;
    const embedding = await embed(text);
    index.add({ path: note.path, title: note.title, embedding });
    i++;
    if (i % 50 === 0) console.log(`[hnsw-prototype]   embedded ${i}/${notes.length}`);
  }

  const durationMs = Date.now() - t0;
  console.log(`[hnsw-prototype] Index built: ${notes.length} notes in ${(durationMs / 1000).toFixed(1)}s`);
  return { index, noteCount: notes.length, durationMs };
}

export async function searchVault(
  vaultPath: string,
  query: string,
  topK: number = 10
): Promise<void> {
  const { index } = await buildIndex(vaultPath);
  const embed = await createEmbedder();
  const queryVec = await embed(query);
  const results = index.search(queryVec, topK, 0.3);

  console.log(`\n[hnsw-prototype] Top ${topK} for query: ${JSON.stringify(query)}\n`);
  if (results.length === 0) {
    console.log("  (no results above min-score 0.3)");
    return;
  }
  for (const r of results) {
    const score = r.score.toFixed(3);
    console.log(`  ${score}  ${r.path}`);
  }
}

// CLI entrypoint (only when run directly via ts-node / tsx)
if (require.main === module) {
  const args = process.argv.slice(2);
  let vaultPath = "";
  let query = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--vault") vaultPath = args[++i];
    else if (args[i] === "--query") query = args[++i];
  }
  if (!vaultPath || !query) {
    console.error("usage: ts-node build-index.ts --vault <path> --query <text>");
    process.exit(1);
  }
  searchVault(vaultPath, query).catch(err => {
    console.error("[hnsw-prototype] error:", err);
    process.exit(1);
  });
}
