import {
  levenshtein,
  findBestMatches,
  suggestOverviewTemplate,
} from "../src/core/fuzzy-matcher";
import { NoteMetadata, VaultSnapshot } from "../src/types";

function makeNote(path: string, outboundLinks: string[] = []): NoteMetadata {
  const name = path.split("/").pop()!.replace(".md", "");
  const folderPath = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
  return {
    path,
    name,
    mtime: Date.now(),
    outboundLinks,
    unresolvedLinks: [],
    isInProjectFolder: false,
    folderPath,
  };
}

function makeSnapshot(notes: NoteMetadata[]): VaultSnapshot {
  return {
    notes,
    notesByPath: new Map(notes.map((n) => [n.path, n])),
    notesByName: new Map(notes.map((n) => [n.name, n])),
    totalNotes: notes.length,
    scanTime: 0,
  };
}

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("returns length for empty-vs-non-empty", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("handles single char substitution", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });

  it("handles insertion + deletion", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("findBestMatches", () => {
  const snapshot = makeSnapshot([
    makeNote("2026-04-14 Threads Pipeline.md"),
    makeNote("2026-04-14 Threads Overview.md"),
    makeNote("2026-04-15 Claude Update.md"),
    makeNote("random unrelated note.md"),
    makeNote("2026-04-22 X Posts.md"),
  ]);

  it("finds close match for broken link with minor rename", () => {
    const matches = findBestMatches("2026-04-14 Threads", snapshot);
    expect(matches.length).toBeGreaterThan(0);
    // Either of the Threads notes should rank top
    expect(matches[0].candidate.name).toMatch(/Threads/);
  });

  it("respects topN cap", () => {
    const matches = findBestMatches("Threads", snapshot, 2);
    expect(matches.length).toBeLessThanOrEqual(2);
  });

  it("returns empty for gibberish target", () => {
    const matches = findBestMatches("zzzzzzzzz qqqqqqq", snapshot, 3, 0.5);
    expect(matches).toEqual([]);
  });

  it("returns empty when target is empty", () => {
    expect(findBestMatches("", snapshot)).toEqual([]);
  });

  it("prunes candidates with very different length", () => {
    // "a" (1 char) should not match "very long note name here" (24 chars)
    const matches = findBestMatches("a", snapshot, 3, 0.3);
    // Should return very few or zero matches due to length-ratio prune
    expect(matches.length).toBeLessThanOrEqual(1);
  });

  it("ranks tokenoverlap contributor high", () => {
    // Target: "Threads 2026-04-14" — token overlap with "2026-04-14 Threads Pipeline" = 2 tokens
    const matches = findBestMatches("Threads 2026-04-14", snapshot);
    expect(matches[0].candidate.name.toLowerCase()).toContain("threads");
  });
});

describe("findBestMatches — CJK bigram fallback", () => {
  // Pure CJK (no whitespace, no dashes) — token overlap on whitespace would
  // collapse each name into a single token and miss obvious near-duplicates.
  const snapshot = makeSnapshot([
    makeNote("業配腳本框架.md"),
    makeNote("業配腳本流程.md"),
    makeNote("社群貼文模板.md"),
    makeNote("完全冇關係嘅嘢.md"),
  ]);

  it("matches near-identical pure CJK names", () => {
    const matches = findBestMatches("業配腳本研究", snapshot);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].candidate.name).toMatch(/業配腳本/);
  });

  it("ranks the CJK candidate sharing more bigrams higher", () => {
    const matches = findBestMatches("業配腳本", snapshot, 3);
    // Both "業配腳本框架" and "業配腳本流程" share 3 bigrams (業配, 配腳, 腳本)
    // so either may rank #1 — assert both appear in top results.
    const topNames = matches.map((m) => m.candidate.name).join("|");
    expect(topNames).toMatch(/業配腳本框架/);
    expect(topNames).toMatch(/業配腳本流程/);
  });

  it("does not falsely match unrelated CJK names", () => {
    const matches = findBestMatches("完全唔同嘅關鍵字串", snapshot, 3, 0.5);
    // None of the candidate notes share enough bigrams with this target
    expect(matches).toEqual([]);
  });

  it("handles mixed CJK + Latin date prefix", () => {
    const mixed = makeSnapshot([
      makeNote("2026-04-30 業配腳本框架.md"),
      makeNote("2026-04-30 業配腳本流程.md"),
      makeNote("2026-04-22 X Posts.md"),
    ]);
    const matches = findBestMatches("2026-04-30 業配腳本研究", mixed);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].candidate.name).toMatch(/業配腳本/);
  });

  it("preserves Latin-only behavior (no regression)", () => {
    const latin = makeSnapshot([
      makeNote("2026-04-14 Threads Pipeline.md"),
      makeNote("random unrelated note.md"),
    ]);
    const matches = findBestMatches("2026-04-14 Threads", latin);
    expect(matches[0].candidate.name).toBe("2026-04-14 Threads Pipeline");
  });

  it("handles single-CJK-char target without throwing", () => {
    const tiny = makeSnapshot([makeNote("業.md"), makeNote("配.md"), makeNote("ABC.md")]);
    const matches = findBestMatches("業", tiny, 3, 0.3);
    // single-char bigram set falls back to {業}; matches itself
    expect(matches.some((m) => m.candidate.name === "業")).toBe(true);
  });
});

describe("suggestOverviewTemplate", () => {
  it("generates a template with folder name and bullets", () => {
    const snapshot = makeSnapshot([
      makeNote("10 - Projects/a.md"),
      makeNote("10 - Projects/b.md"),
      makeNote("10 - Projects/c.md"),
    ]);
    const { suggestion, sampleNotes } = suggestOverviewTemplate(
      "10 - Projects",
      snapshot
    );
    expect(suggestion).toContain("# 10 - Projects");
    expect(suggestion).toContain("[[a]]");
    expect(sampleNotes.length).toBe(3);
  });

  it("ranks notes with more inbound links first", () => {
    const notes = [
      makeNote("f/a.md"),
      makeNote("f/b.md"),
      makeNote("other/c.md", ["f/b.md", "f/b.md"]), // b linked twice (via outboundLinks)
    ];
    // inboundCount tracks each appearance in any note's outboundLinks, so b gets 2 hits
    const snapshot = makeSnapshot(notes);
    const { sampleNotes } = suggestOverviewTemplate("f", snapshot, 2);
    expect(sampleNotes[0].name).toBe("b");
  });

  it("handles empty folder gracefully", () => {
    const snapshot = makeSnapshot([]);
    const { suggestion } = suggestOverviewTemplate("empty", snapshot);
    expect(suggestion).toContain("folder is empty");
  });

  it("respects maxNotes cap", () => {
    const notes = Array.from({ length: 10 }, (_, i) =>
      makeNote(`f/note${i}.md`)
    );
    const snapshot = makeSnapshot(notes);
    const { sampleNotes } = suggestOverviewTemplate("f", snapshot, 3);
    expect(sampleNotes.length).toBe(3);
  });
});
