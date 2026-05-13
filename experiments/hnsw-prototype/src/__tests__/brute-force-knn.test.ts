/**
 * Tests for brute-force-knn.ts
 *
 * Runner: vitest (preferred, no need to compile first)
 *   npx vitest run src/__tests__/brute-force-knn.test.ts
 *
 * The describe/it/expect surface used here is compatible with both vitest
 * and jest, so either runner works once deps are installed.
 *
 * Strategy: pure-function tests only. No I/O, no model loading, no async.
 */

import { describe, it, expect } from "vitest";
import {
  cosineSim,
  l2Normalize,
  BruteForceIndex,
  type IndexedRow,
} from "../brute-force-knn";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Hand-built unit vectors that compose well for similarity assertions. */
const E1 = new Float32Array([1, 0, 0]);
const E2 = new Float32Array([0, 1, 0]);
const E3 = new Float32Array([0, 0, 1]);
/** 45-degree vector in xy-plane (unit length): cosine with E1 = E2 ≈ 0.7071 */
const DIAG_XY = new Float32Array([Math.SQRT1_2, Math.SQRT1_2, 0]);
/** Anti-parallel to E1 */
const NEG_E1 = new Float32Array([-1, 0, 0]);

const SQRT_HALF = Math.SQRT1_2; // ≈ 0.7071067811865476

function row(path: string, embedding: Float32Array, title?: string): IndexedRow {
  return { path, title: title ?? path.split("/").pop() ?? path, embedding };
}

// ─── cosineSim ──────────────────────────────────────────────────────────────

describe("cosineSim", () => {
  it("returns 1 for identical unit vectors", () => {
    expect(cosineSim(E1, E1)).toBeCloseTo(1, 6);
    expect(cosineSim(E2, E2)).toBeCloseTo(1, 6);
  });

  it("returns 0 for orthogonal unit vectors", () => {
    expect(cosineSim(E1, E2)).toBeCloseTo(0, 6);
    expect(cosineSim(E1, E3)).toBeCloseTo(0, 6);
    expect(cosineSim(E2, E3)).toBeCloseTo(0, 6);
  });

  it("returns -1 for anti-parallel unit vectors", () => {
    expect(cosineSim(E1, NEG_E1)).toBeCloseTo(-1, 6);
  });

  it("returns sqrt(0.5) for 45-degree unit vectors", () => {
    expect(cosineSim(E1, DIAG_XY)).toBeCloseTo(SQRT_HALF, 6);
    expect(cosineSim(E2, DIAG_XY)).toBeCloseTo(SQRT_HALF, 6);
  });

  it("is symmetric", () => {
    const a = new Float32Array([0.3, 0.4, 0.5]);
    const b = new Float32Array([0.6, -0.1, 0.2]);
    expect(cosineSim(a, b)).toBeCloseTo(cosineSim(b, a), 10);
  });

  it("throws on length mismatch", () => {
    const short = new Float32Array([1, 0]);
    const long = new Float32Array([1, 0, 0]);
    expect(() => cosineSim(short, long)).toThrow(/length mismatch/);
  });

  it("returns a number (not NaN) for zero vectors", () => {
    // Dot product of zero vectors is exactly 0 — no division involved here,
    // so we don't get NaN. The function's contract is that vectors are
    // pre-normalized, but it shouldn't blow up if a caller passes zeros.
    const zero = new Float32Array([0, 0, 0]);
    expect(cosineSim(zero, E1)).toBe(0);
    expect(cosineSim(zero, zero)).toBe(0);
  });
});

// ─── l2Normalize ────────────────────────────────────────────────────────────

describe("l2Normalize", () => {
  it("turns [3, 4] into a unit vector", () => {
    const v = new Float32Array([3, 4]);
    l2Normalize(v);
    expect(v[0]).toBeCloseTo(0.6, 6);
    expect(v[1]).toBeCloseTo(0.8, 6);
    // post-normalize: ||v|| = 1
    const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    expect(norm).toBeCloseTo(1, 6);
  });

  it("leaves a unit vector unchanged (within float epsilon)", () => {
    const v = new Float32Array([1, 0, 0]);
    l2Normalize(v);
    expect(v[0]).toBeCloseTo(1, 6);
    expect(v[1]).toBeCloseTo(0, 6);
    expect(v[2]).toBeCloseTo(0, 6);
  });

  it("modifies in place and returns the same instance", () => {
    const v = new Float32Array([2, 0]);
    const result = l2Normalize(v);
    expect(result).toBe(v);
    expect(v[0]).toBeCloseTo(1, 6);
  });

  it("returns the zero vector unchanged for an all-zero input", () => {
    const v = new Float32Array([0, 0, 0]);
    l2Normalize(v);
    expect(v[0]).toBe(0);
    expect(v[1]).toBe(0);
    expect(v[2]).toBe(0);
  });

  it("handles negative components", () => {
    const v = new Float32Array([-3, -4]);
    l2Normalize(v);
    expect(v[0]).toBeCloseTo(-0.6, 6);
    expect(v[1]).toBeCloseTo(-0.8, 6);
  });

  it("normalizes high-dimensional vectors correctly", () => {
    // 384-dim mimics all-MiniLM-L6-v2 output
    const dim = 384;
    const v = new Float32Array(dim);
    for (let i = 0; i < dim; i++) v[i] = Math.random() - 0.5;
    l2Normalize(v);
    let sumSq = 0;
    for (let i = 0; i < dim; i++) sumSq += v[i] * v[i];
    expect(Math.sqrt(sumSq)).toBeCloseTo(1, 5);
  });
});

// ─── BruteForceIndex.add / bulk / size ─────────────────────────────────────

describe("BruteForceIndex.add / bulk / size", () => {
  it("starts empty", () => {
    const idx = new BruteForceIndex();
    expect(idx.size()).toBe(0);
  });

  it("add() increments size by one", () => {
    const idx = new BruteForceIndex();
    idx.add(row("a.md", E1));
    expect(idx.size()).toBe(1);
    idx.add(row("b.md", E2));
    expect(idx.size()).toBe(2);
  });

  it("bulk() inserts many rows in one call", () => {
    const idx = new BruteForceIndex();
    idx.bulk([row("a.md", E1), row("b.md", E2), row("c.md", E3)]);
    expect(idx.size()).toBe(3);
  });

  it("add() and bulk() can be mixed", () => {
    const idx = new BruteForceIndex();
    idx.add(row("a.md", E1));
    idx.bulk([row("b.md", E2), row("c.md", E3)]);
    idx.add(row("d.md", DIAG_XY));
    expect(idx.size()).toBe(4);
  });
});

// ─── BruteForceIndex.search ─────────────────────────────────────────────────

describe("BruteForceIndex.search", () => {
  it("returns the most similar row first", () => {
    const idx = new BruteForceIndex();
    idx.bulk([
      row("orthogonal.md", E2),
      row("identical.md", E1),
      row("antiparallel.md", NEG_E1),
    ]);
    const results = idx.search(E1, 3);
    expect(results.map(r => r.path)).toEqual([
      "identical.md",
      "orthogonal.md",
      "antiparallel.md",
    ]);
    expect(results[0].score).toBeCloseTo(1, 6);
    expect(results[1].score).toBeCloseTo(0, 6);
    expect(results[2].score).toBeCloseTo(-1, 6);
  });

  it("respects topK truncation", () => {
    const idx = new BruteForceIndex();
    for (let i = 0; i < 5; i++) {
      idx.add(row(`note-${i}.md`, E1));
    }
    const results = idx.search(E1, 2);
    expect(results).toHaveLength(2);
  });

  it("topK > size returns all rows", () => {
    const idx = new BruteForceIndex();
    idx.bulk([row("a.md", E1), row("b.md", E2)]);
    const results = idx.search(E1, 100);
    expect(results).toHaveLength(2);
  });

  it("respects minScore floor", () => {
    const idx = new BruteForceIndex();
    idx.bulk([
      row("perfect.md", E1),       // sim = 1
      row("orthogonal.md", E2),    // sim = 0
      row("partial.md", DIAG_XY),  // sim ≈ 0.707
    ]);
    const results = idx.search(E1, 10, 0.5);
    expect(results.map(r => r.path)).toEqual(["perfect.md", "partial.md"]);
  });

  it("minScore = 0 includes orthogonal but excludes anti-parallel", () => {
    const idx = new BruteForceIndex();
    idx.bulk([
      row("orth.md", E2),       // sim = 0 — included (≥ 0)
      row("anti.md", NEG_E1),   // sim = -1 — excluded
    ]);
    const results = idx.search(E1, 10, 0);
    expect(results.map(r => r.path)).toEqual(["orth.md"]);
  });

  it("returns empty array when no row meets minScore", () => {
    const idx = new BruteForceIndex();
    idx.bulk([row("a.md", NEG_E1), row("b.md", E2)]);
    const results = idx.search(E1, 10, 0.99);
    expect(results).toEqual([]);
  });

  it("applies folder filter", () => {
    const idx = new BruteForceIndex();
    idx.bulk([
      row("10 - Projects/a.md", E1),
      row("99 - Archive/b.md", E1),  // identical sim — but archived
      row("20 - Areas/c.md", E1),
    ]);
    const results = idx.search(
      E1,
      10,
      0,
      path => !path.startsWith("99 - Archive")
    );
    expect(results.map(r => r.path)).not.toContain("99 - Archive/b.md");
    expect(results).toHaveLength(2);
  });

  it("preserves stable ordering when scores tie (by insertion order)", () => {
    // sort() in JS is now spec-stable (since 2019), so equal-score rows
    // appear in the order they were inserted.
    const idx = new BruteForceIndex();
    idx.bulk([
      row("first.md", E1),
      row("second.md", E1),
      row("third.md", E1),
    ]);
    const results = idx.search(E1, 3);
    expect(results.map(r => r.path)).toEqual([
      "first.md",
      "second.md",
      "third.md",
    ]);
  });

  it("returns search results with the title field populated", () => {
    const idx = new BruteForceIndex();
    idx.add(row("path/with/slashes/My Note.md", E1, "My Note"));
    const results = idx.search(E1, 1);
    expect(results[0].title).toBe("My Note");
  });

  it("returns empty array for an empty index", () => {
    const idx = new BruteForceIndex();
    const results = idx.search(E1, 10);
    expect(results).toEqual([]);
  });
});

// ─── BruteForceIndex.remove ─────────────────────────────────────────────────

describe("BruteForceIndex.remove", () => {
  it("removes rows matching the predicate and returns count removed", () => {
    const idx = new BruteForceIndex();
    idx.bulk([
      row("99 - Archive/old1.md", E1),
      row("99 - Archive/old2.md", E2),
      row("10 - Projects/new.md", E3),
    ]);
    const removed = idx.remove(p => p.startsWith("99 - Archive"));
    expect(removed).toBe(2);
    expect(idx.size()).toBe(1);
  });

  it("returns 0 when no row matches", () => {
    const idx = new BruteForceIndex();
    idx.bulk([row("a.md", E1), row("b.md", E2)]);
    const removed = idx.remove(p => p.endsWith(".pdf"));
    expect(removed).toBe(0);
    expect(idx.size()).toBe(2);
  });

  it("can clear the index by removing all", () => {
    const idx = new BruteForceIndex();
    idx.bulk([row("a.md", E1), row("b.md", E2), row("c.md", E3)]);
    const removed = idx.remove(() => true);
    expect(removed).toBe(3);
    expect(idx.size()).toBe(0);
  });

  it("survivors retain correct ordering after remove", () => {
    const idx = new BruteForceIndex();
    idx.bulk([
      row("a.md", E1),
      row("b-archive.md", E2),
      row("c.md", E3),
      row("d-archive.md", DIAG_XY),
      row("e.md", NEG_E1),
    ]);
    idx.remove(p => p.includes("archive"));
    expect(idx.size()).toBe(3);
    // After removal, ranking E1 should put a.md first (sim=1), then c.md
    // (sim=0), then e.md (sim=-1).
    const results = idx.search(E1, 5);
    expect(results.map(r => r.path)).toEqual(["a.md", "c.md", "e.md"]);
  });
});

// ─── BruteForceIndex.upsert ─────────────────────────────────────────────────

describe("BruteForceIndex.upsert", () => {
  it("inserts a new row when path is absent", () => {
    const idx = new BruteForceIndex();
    idx.upsert(row("a.md", E1));
    expect(idx.size()).toBe(1);
  });

  it("updates the existing row when path matches", () => {
    const idx = new BruteForceIndex();
    idx.add(row("a.md", E1));
    idx.upsert(row("a.md", E2));
    expect(idx.size()).toBe(1);
    // After upsert, the embedding changed: query E1 should now score 0
    // against a.md (it was rewritten with E2 which is orthogonal to E1).
    const results = idx.search(E1, 1);
    expect(results[0].score).toBeCloseTo(0, 6);
  });

  it("does not duplicate rows when called repeatedly with the same path", () => {
    const idx = new BruteForceIndex();
    for (let i = 0; i < 5; i++) {
      idx.upsert(row("a.md", new Float32Array([i, 0, 0])));
    }
    expect(idx.size()).toBe(1);
  });

  it("preserves other rows when upserting a non-matching path", () => {
    const idx = new BruteForceIndex();
    idx.bulk([row("a.md", E1), row("b.md", E2)]);
    idx.upsert(row("c.md", E3));
    expect(idx.size()).toBe(3);
  });

  it("preserves position of updated row (still in original insertion order)", () => {
    const idx = new BruteForceIndex();
    idx.bulk([row("first.md", E1), row("second.md", E1), row("third.md", E1)]);
    idx.upsert(row("second.md", E1)); // re-upsert same content
    // Stable-sort means insertion order survives equal scores
    const results = idx.search(E1, 3);
    expect(results.map(r => r.path)).toEqual([
      "first.md",
      "second.md",
      "third.md",
    ]);
  });
});

// ─── End-to-end smoke ───────────────────────────────────────────────────────

describe("end-to-end smoke", () => {
  it("scenario: build → query → upsert → query reflects update", () => {
    const idx = new BruteForceIndex();
    idx.bulk([
      row("notes/finance.md", E1),
      row("notes/recipes.md", E2),
      row("notes/projects.md", E3),
    ]);

    // Query 1: closest to E1
    const r1 = idx.search(E1, 1);
    expect(r1[0].path).toBe("notes/finance.md");

    // Edit: rewrite finance.md to be more like E2 instead
    idx.upsert(row("notes/finance.md", E2));

    // Query 2: closest to E1 should NOT be finance.md anymore
    const r2 = idx.search(E1, 3, -1);
    // All three rows are present, and finance.md (now E2) ties with
    // recipes.md (also E2). Both are orthogonal to E1; projects.md (E3)
    // is also orthogonal. With stable sort, insertion order tiebreak.
    // The point of the test: finance.md must not be the unique top hit
    // anymore.
    expect(r2[0].path).not.toBe("notes/finance.md");
  });

  it("scenario: filter out archive folder during semantic search", () => {
    const idx = new BruteForceIndex();
    idx.bulk([
      row("99 - Archive/old-finance.md", E1),
      row("10 - Projects/finance.md", E1),
    ]);

    // Same embedding for both — without filter, archive could win on
    // insertion order. With filter, only the project hit returns.
    const filtered = idx.search(E1, 5, 0, p => !p.startsWith("99 - Archive"));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].path).toBe("10 - Projects/finance.md");
  });
});
