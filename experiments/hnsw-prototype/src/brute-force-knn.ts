/**
 * Brute-force cosine-similarity kNN over a Float32 embedding matrix.
 *
 * Pragmatic choice for vaults under ~10,000 notes. Replace with HNSW only
 * after empirical proof that brute-force latency is unacceptable.
 *
 * Independence: pure TypeScript, no third-party deps.
 */

import type { SearchResult } from "./types";

/**
 * Cosine similarity between two equal-length Float32Arrays.
 *
 * Assumes both vectors are already L2-normalized (unit length). When that's
 * true, cosine sim is just the dot product. all-MiniLM-L6-v2 outputs
 * normalize cleanly with a single pass post-embed (see embed.ts).
 */
export function cosineSim(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

/** L2-normalize a vector in place. */
export function l2Normalize(v: Float32Array): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < v.length; i++) sumSq += v[i] * v[i];
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return v;
  for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

export interface IndexedRow {
  path: string;
  title: string;
  embedding: Float32Array;
}

export class BruteForceIndex {
  private rows: IndexedRow[] = [];

  add(row: IndexedRow): void {
    this.rows.push(row);
  }

  bulk(rows: IndexedRow[]): void {
    this.rows.push(...rows);
  }

  size(): number {
    return this.rows.length;
  }

  /**
   * Top-k nearest neighbors by cosine similarity.
   *
   * Implementation: O(N) scan, maintain a min-heap of size k. For typical
   * vault sizes (under 10k) and k under 50, this is faster than the heap
   * machinery — so we use a plain sort-and-slice.
   */
  search(
    queryEmbedding: Float32Array,
    topK: number = 10,
    minScore: number = 0,
    folderFilter?: (path: string) => boolean
  ): SearchResult[] {
    const scored: Array<{ path: string; title: string; score: number }> = [];

    for (const row of this.rows) {
      if (folderFilter && !folderFilter(row.path)) continue;
      const score = cosineSim(queryEmbedding, row.embedding);
      if (score < minScore) continue;
      scored.push({ path: row.path, title: row.title, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /** Remove all rows whose path matches the predicate. */
  remove(predicate: (path: string) => boolean): number {
    const before = this.rows.length;
    this.rows = this.rows.filter(r => !predicate(r.path));
    return before - this.rows.length;
  }

  /** Update an existing row (by path) or add it if absent. */
  upsert(row: IndexedRow): void {
    const i = this.rows.findIndex(r => r.path === row.path);
    if (i >= 0) this.rows[i] = row;
    else this.rows.push(row);
  }
}
