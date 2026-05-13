/**
 * Embedding via @xenova/transformers (in-browser WASM, no API).
 *
 * In Node (this prototype), the same package works — `pipeline()` downloads
 * the model on first call and caches under ~/.cache/huggingface/transformers.
 * In Obsidian's renderer, the same code path runs unchanged but we'd want
 * to bundle the model file or download it once with explicit user consent.
 */

import type { EmbeddingFn } from "./types";
import { l2Normalize } from "./brute-force-knn";

/**
 * Lazy-loaded embedder. Returns a function that takes text and returns a
 * 384-dim L2-normalized Float32Array.
 *
 * Model: Xenova/all-MiniLM-L6-v2 (multi-language coverage is mediocre on
 * CJK; if the prototype shows poor 投資 → 股票 retrieval, swap to
 * Xenova/paraphrase-multilingual-MiniLM-L12-v2 — same dim, similar latency).
 */
export async function createEmbedder(
  modelName: string = "Xenova/all-MiniLM-L6-v2"
): Promise<EmbeddingFn> {
  // Dynamic import so this file can be type-checked without the dep installed
  // in pure-design walkthroughs.
  const { pipeline } = await import("@xenova/transformers" as string);
  const extractor = await pipeline("feature-extraction", modelName);

  return async (text: string): Promise<Float32Array> => {
    // pooling: 'mean' over token embeddings; normalize: true returns unit vec
    const output = await extractor(text, { pooling: "mean", normalize: true });
    // Output is a Tensor; .data is a Float32Array of length 384
    const vec = new Float32Array(output.data);
    // Defensive: re-normalize in case the model didn't (different versions)
    return l2Normalize(vec);
  };
}

/**
 * Truncate text for the model context window.
 *
 * all-MiniLM-L6-v2 has a 512-token limit. We approximate with a generous
 * char limit (~2000 chars covers ~512 tokens for English; CJK is denser
 * but the tokenizer handles it). Truncation drops the tail; for long
 * mixed-topic notes this loses signal — chunk-and-pool comes in Phase B.
 */
export function truncateForEmbed(text: string, maxChars: number = 2000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}
