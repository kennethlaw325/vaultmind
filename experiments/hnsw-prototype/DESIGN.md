# HNSW Semantic Search for VaultMind — Prototype Design

> Status: prototype / experiment. **Not integrated into main plugin.**
> Drafted by overnight autopilot 2026-05-04 iter 4.
> See `project_ruflo_cherry_pick.md` for the cherry-pick rationale.

---

## Problem

Current VaultMind retrieval is keyword-based (Levenshtein + token overlap on note names). This works for "did you mean X" suggestions but doesn't surface conceptually-related notes.

Concrete miss: a query like `投資` (Chinese for "investment") would not surface notes titled `股票分析`, `ETF 配置`, or `資金規劃` even though they're the right answer. Users typing one word in their head are stuck enumerating every synonym.

Goal: add an optional semantic search layer that maps queries to meaning vectors, so "投資" → all the related notes by cosine similarity.

---

## Constraints

VaultMind runs as an Obsidian community plugin → Electron renderer process. Three hard constraints:

1. **No native binaries that aren't pre-built for all platforms.** `hnswlib-node` ships a native addon. It works on Node but installing it inside Electron's renderer is fragile (electron-rebuild dance, version skew, signing on macOS). Avoid unless we bundle pre-built binaries for win/mac/linux.
2. **No `node:fs`, no `require('fs')`.** Per `CLAUDE.md`: use `app.vault` API only. The index file has to live under the vault's plugin folder via `app.vault.adapter.write/read`.
3. **No background API calls.** The plugin's offline-first promise extends to embeddings — local model only, or explicit user opt-in.

These rule out:
- `hnswlib-node` directly (native addon ergonomics)
- OpenAI / Cohere embeddings (API call without explicit consent)
- Any solution that writes outside the vault

---

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌────────────────┐
│ Note bodies │ →  │ Embedding model  │ →  │ HNSW index     │
│ (vault.read)│    │ (transformers.js)│    │ (in-memory     │
│             │    │ all-MiniLM-L6-v2 │    │  + serialized  │
└─────────────┘    │ 384-dim, WASM    │    │  to vault file)│
                   └──────────────────┘    └────────────────┘
                                                   │
                                                   ▼
                            ┌─────────────────────────────────┐
                            │ search(query, k=10)             │
                            │   embed(query) → cosine kNN     │
                            │   → top-k {path, score}         │
                            └─────────────────────────────────┘
```

### Library choices

| Component | Choice | Why |
|---|---|---|
| Embedding model | **all-MiniLM-L6-v2** (384-dim) via `@xenova/transformers` | Same model the ruflo cherry-pick references. Runs in-browser via WASM, no native binary, no API key, ~80MB one-time download cached in browser. |
| HNSW library | **`hnswlib-wasm`** OR pure-TS port (TBD — see "Library viability" below) | Avoids native binary problem. Falls back to brute-force kNN at small scale (under ~5K notes). |
| Storage | **`app.vault.adapter`** writing to `.obsidian/plugins/vaultmind/cache/` | Stays inside the vault. Survives plugin reinstalls. User can delete to force rebuild. |

### Library viability check (TODO before MVP)

Both candidates need empirical validation:

1. `hnswlib-wasm` — verify it's maintained, check WASM bundle size, test in Electron renderer. Issue: many WASM ports of HNSW are unmaintained or missing critical features (e.g. delete-by-id, persistence).
2. Pure-TS HNSW — could write our own. ~300 LOC for the simplified algorithm. Pro: no third-party dependency, full control. Con: maintenance burden, performance vs C++ baseline.

**Pragmatic fallback for MVP:** brute-force kNN over the embedding matrix. Cosine similarity in pure JS with SIMD-friendly Float32Array. Works fine up to ~5,000 notes (well above the median Obsidian vault). Build HNSW only after confirming user demand and vault-size pressure.

---

## Storage layout

```
vault/.obsidian/plugins/vaultmind/cache/
  ├── embeddings.bin         # Float32Array: N × 384 dims, packed
  ├── manifest.json          # { noteId → row index, mtime, contentHash }
  └── model-version.json     # { model: "all-MiniLM-L6-v2", dim: 384, version: "..." }
```

**Incremental update strategy:**

On each scan:
1. Read `manifest.json`.
2. For each note in vault:
   - Hash content → if matches manifest, skip (cached).
   - If new or hash changed, embed and update row.
3. Drop rows for deleted notes.
4. Persist `embeddings.bin` + updated manifest.

This lets the first scan take minutes (one-time cost), subsequent scans take seconds.

---

## API surface (proposed)

```typescript
interface SemanticSearchOptions {
  query: string;
  topK?: number;              // default 10
  minScore?: number;          // cosine similarity threshold, default 0.5
  filterFolders?: string[];   // optional folder prefixes to restrict
}

interface SemanticSearchResult {
  notePath: string;
  title: string;
  score: number;              // 0..1, higher = closer
  excerpt?: string;           // optional 200-char excerpt around highest-scoring chunk
}

async function searchSemantic(opts: SemanticSearchOptions): Promise<SemanticSearchResult[]>;
async function rebuildIndex(): Promise<{ noteCount: number; durationMs: number }>;
async function indexStatus(): Promise<{ noteCount: number; lastBuilt: number; staleCount: number }>;
```

These are the boundary functions the main plugin would import. The rest stays internal to `experiments/hnsw-prototype/src/`.

---

## Embedding granularity

Two options:

| Option | Pro | Con |
|---|---|---|
| **One vector per note** (whole-note embedding, truncated to 512 tokens) | Simple, small index, fast queries | Loses signal in long notes, gets confused by mixed-topic notes |
| **One vector per chunk** (split notes into ~256-token chunks, embed each) | Surfaces specific passages, better recall on long notes | 5-10x storage, requires chunk-to-note resolution at result time |

**Decision for MVP:** whole-note. Defer chunking until the simpler approach proves limiting. all-MiniLM truncates at 512 tokens which covers most notes and degrades gracefully.

---

## Privacy + safety

1. **No data leaves the device.** Embeddings happen in-browser via WASM. Index lives under the vault. No telemetry.
2. **Opt-in via settings.** The semantic search feature ships disabled. User toggles on, accepts ~80MB model download.
3. **Disable kill switch.** A single `Disable semantic search` button in settings deletes the cache directory and unloads the model.
4. **No re-embedding sensitive vaults silently.** First-time index build pops a confirmation modal showing model name, size, expected duration.

---

## Open questions

1. Does `@xenova/transformers` work cleanly in Obsidian's Electron renderer with offline-first guarantees? (Needs empirical test — may need to bundle the model file rather than fetch from HuggingFace CDN at runtime.)
2. Is the model worth bundling into `main.js` or should it download on first enable? Bundling adds ~80MB to the plugin payload — almost certainly fails Obsidian community-plugins size review. **Recommend: download on first enable, with explicit consent UI.**
3. CJK token coverage: all-MiniLM-L6-v2 was trained primarily on English. Need to spot-check that 投資/股票/ETF actually cluster correctly. May need a multilingual model (paraphrase-multilingual-MiniLM-L12-v2, 384-dim, similar size) which would handle CJK better.
4. How to integrate with VaultMind's existing 4-dimension scoring? Semantic search is a different mode (query-driven). Likely a new modal command rather than another lint dimension.

---

## Phasing

### Phase A: prototype (this experiment, isolated under `experiments/`)
- POC script that embeds a vault, builds an in-memory index, runs queries
- Run from CLI (Node) — not yet inside Obsidian. Validates the model + library choice.
- Smoke test on Kenneth's actual ~700-note vault.

### Phase B: Obsidian integration scaffold (next session)
- Move embedding pipeline behind `app.vault.adapter` API
- Implement persistence to `.obsidian/plugins/vaultmind/cache/`
- Behind a feature flag, default off

### Phase C: UI surface
- New command: `VaultMind: Semantic search`
- Modal with query input + top-K results
- Settings: enable/disable, choose monolingual vs multilingual model

### Phase D: harden
- Worker thread to keep UI responsive during indexing
- Incremental updates on note save
- Multi-folder filters in the search UI

**Don't build anything past Phase A in this overnight session.** Phase B+ requires user-in-loop decisions on UX and resource budgets.

---

## Decision log

| Decision | Choice | Reason |
|---|---|---|
| Embedding model | all-MiniLM-L6-v2 | Matches ruflo cherry-pick reference; small; in-browser via transformers.js |
| Vector dim | 384 | Model output |
| HNSW lib | TBD (wasm or pure-TS) — brute-force fallback for MVP | Avoid native addon; pragmatic at expected vault sizes |
| Storage | `app.vault.adapter` under plugin cache dir | Stays inside vault, survives reinstall |
| Granularity | Whole-note for MVP | Simpler; chunk later if needed |
| Default | Disabled until user enables | Offline-first promise + 80MB model size |

---

## Why HNSW at all if brute-force is fine?

Brute-force kNN on a 5,000 × 384 Float32 matrix is ~7.7 MB of memory and ~5ms per query. That's fine for most vaults.

HNSW becomes valuable when:
- Vault > 20,000 notes (rare for personal vaults but possible for company/org wikis)
- Query latency budget < 1ms
- Multiple concurrent searches (not relevant for a single-user plugin)

For a personal-vault plugin: **default to brute-force**, treat HNSW as future optimization. The cherry-pick from ruflo was the *concept* (semantic search beats keyword); the *algorithm* is implementation detail.
