# VaultMind HNSW Prototype

> Standalone semantic-search experiment for VaultMind. **Not part of the published plugin.**
> Lives under `experiments/hnsw-prototype/` so it can be run, measured, and thrown away without touching the plugin source.

## What this is

A minimal proof of concept for adding semantic search to VaultMind. See `DESIGN.md` for the full reasoning.

Given the cherry-pick context (ruflo's HNSW + 384-dim embeddings concept, but rejecting their package chain) the core questions this prototype answers:

1. Does `@xenova/transformers` produce good embeddings for a real Obsidian vault, including CJK content?
2. Is brute-force kNN fast enough to ship as MVP, deferring HNSW until proven necessary?
3. What's the actual indexing time on a ~700-note vault?

## What this is NOT

- Not a `hnswlib-node` integration. The prototype defaults to brute-force; HNSW is implementation detail. See `DESIGN.md` § "Why HNSW at all if brute-force is fine?".
- Not Obsidian-integrated. Runs as a Node CLI. Phase B (next session, if validated) wires it through `app.vault.adapter`.
- Not under test coverage. This is exploratory; tests come once the API stabilizes and we move into the plugin.

## Setup

```bash
cd C:/Users/Kenneth/Claude/vaultmind/experiments/hnsw-prototype
npm install
```

First install: pulls `@xenova/transformers` (~50 MB on disk, includes ONNX runtime).

## Run

```bash
npm run search -- --vault "C:/Users/Kenneth/Desktop/Obsidian" --query "投資"
```

First run: downloads the model (~80 MB) into `~/.cache/huggingface/transformers`. Subsequent runs use the cache.

Expected output:

```
[hnsw-prototype] Loading notes from C:/Users/Kenneth/Desktop/Obsidian
[hnsw-prototype] Found 712 markdown files
[hnsw-prototype] Initializing embedder (first call downloads model ~80MB)
[hnsw-prototype]   embedded 50/712
...
[hnsw-prototype] Index built: 712 notes in 38.4s

[hnsw-prototype] Top 10 for query: "投資"

  0.612  10 - Projects/Investing/...
  0.578  20 - Areas/Finance/...
  ...
```

## Files

```
DESIGN.md                          — full design rationale, constraints, phasing, decision log
src/types.ts                       — shared interfaces
src/brute-force-knn.ts             — pure-TS cosine kNN (the actual retrieval layer for MVP)
src/embed.ts                       — @xenova/transformers wrapper, lazy-loaded
src/build-index.ts                 — Node CLI: walk vault → embed → build index → query
src/bench.ts                       — synthetic-vector bench: validates brute-force latency claim
src/__tests__/brute-force-knn.test.ts — vitest tests for the retrieval layer (38 cases)
package.json
tsconfig.json
README.md                          — this file
```

## Tests

The retrieval layer (brute-force-knn.ts) has unit tests under `src/__tests__/`. After `npm install`, run:

```bash
npm test
```

The tests cover `cosineSim`, `l2Normalize`, and the full `BruteForceIndex` API (add / bulk / size / search with filters and minScore floor / remove / upsert). 38 cases, all pure-function, no I/O.

The embedding pipeline (`embed.ts`, `build-index.ts`) is intentionally untested at unit level — it's an integration layer over `@xenova/transformers`, validated by running the CLI against a real vault (see "Validation checklist" below).

## Bench

```bash
npm run bench                    # default sizes: 100 / 500 / 1K / 2.5K / 5K / 10K / 20K
npm run bench -- 700 5000        # custom sizes
```

Generates synthetic L2-normalized random 384-dim vectors, warms the JIT with 20 queries, then measures 200 queries per size. Outputs a markdown table with mean / p50 / p95 / p99 query latency and approximate heap footprint.

Decision thresholds embedded in the output:
- **p95 < 50ms** at expected vault size → brute-force is fine, ship as MVP, defer HNSW
- **p95 50-150ms** → add 200ms search debounce in the UI
- **p95 > 150ms** → HNSW earns its bundle + native-binary cost

The bench uses synthetic uniform-random vectors; real embeddings cluster, which makes brute-force slightly faster (cache-friendlier). Treat the numbers as an upper bound, not a representative average.

## Validation checklist (run before recommending Phase B)

- [ ] Index builds end-to-end on Kenneth's actual ~700-note vault
- [ ] `投資` query surfaces at least 3 finance-related notes that don't contain the literal string
- [ ] `Claude Code` query surfaces dev-related notes
- [ ] Build time < 2 min on first run
- [ ] Cached re-build < 30s (after incremental update logic — Phase B)
- [ ] Spot-check: does `Xenova/all-MiniLM-L6-v2` handle CJK well, or do we need to swap to `Xenova/paraphrase-multilingual-MiniLM-L12-v2`?

## What's next (only if validation passes)

Phase B: wire embeddings through `app.vault.adapter`, add persistence to `.obsidian/plugins/vaultmind/cache/`, expose behind a feature flag. Tracker entry under iter 9 ("VaultMind Phase 2 — spec deepen") should pick this up.

If validation fails (e.g. CJK retrieval is poor, or model download is unworkable in Electron), fall back: keyword search with synonym expansion via the existing AI recommendations API call. Cheaper, simpler, no embedding pipeline at all.
