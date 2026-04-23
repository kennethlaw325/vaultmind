import { detectStaleNotes } from "../src/core/staleness-checker";
import { VaultSnapshot, NoteMetadata, FolderConfig } from "../src/types";

function makeNote(path: string, daysAgo: number): NoteMetadata {
  return {
    path,
    name: path.split("/").pop()!.replace(".md", ""),
    mtime: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    outboundLinks: [],
    unresolvedLinks: [],
    isInProjectFolder: false,
    folderPath: path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "",
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

describe("detectStaleNotes", () => {
  it("returns empty for fresh vault", () => {
    const snapshot = makeSnapshot([makeNote("a.md", 0), makeNote("b.md", 1)]);
    expect(detectStaleNotes(snapshot, 14)).toEqual([]);
  });

  it("flags notes older than threshold", () => {
    const snapshot = makeSnapshot([
      makeNote("fresh.md", 1),
      makeNote("stale.md", 30),
    ]);
    const issues = detectStaleNotes(snapshot, 14);
    expect(issues).toHaveLength(1);
    expect(issues[0].notePath).toBe("stale.md");
  });

  it("respects custom global threshold", () => {
    const snapshot = makeSnapshot([makeNote("a.md", 5)]);
    expect(detectStaleNotes(snapshot, 3)).toHaveLength(1);
    expect(detectStaleNotes(snapshot, 7)).toHaveLength(0);
  });

  it("returns empty for empty vault", () => {
    const snapshot = makeSnapshot([]);
    expect(detectStaleNotes(snapshot, 14)).toEqual([]);
  });

  it("handles notes exactly at threshold", () => {
    const snapshot = makeSnapshot([makeNote("edge.md", 14)]);
    const issues = detectStaleNotes(snapshot, 14);
    expect(issues.length).toBeLessThanOrEqual(1);
  });

  // === Phase 2a: folder config overrides ===

  it("skips folder when staleCheckEnabled is false", () => {
    const snapshot = makeSnapshot([
      makeNote("99 - Archive/old.md", 200),
      makeNote("active/fresh.md", 1),
      makeNote("active/old.md", 200),
    ]);
    const configs: FolderConfig[] = [
      { pattern: "99 - Archive", exclude: false, staleCheckEnabled: false, staleDays: 0 },
    ];
    const issues = detectStaleNotes(snapshot, 60, configs);
    expect(issues).toHaveLength(1);
    expect(issues[0].notePath).toBe("active/old.md");
  });

  it("uses folder-specific staleDays when set", () => {
    const snapshot = makeSnapshot([
      makeNote("10 - Projects/a.md", 45),
      makeNote("20 - Areas/b.md", 45),
    ]);
    const configs: FolderConfig[] = [
      { pattern: "10 - Projects", exclude: false, staleCheckEnabled: true, staleDays: 30 },
    ];
    // Global 60 — 20 - Areas passes (45 < 60), Projects fails (45 > 30)
    const issues = detectStaleNotes(snapshot, 60, configs);
    expect(issues).toHaveLength(1);
    expect(issues[0].notePath).toBe("10 - Projects/a.md");
  });

  it("falls back to global threshold when staleDays is 0", () => {
    const snapshot = makeSnapshot([
      makeNote("Notes/a.md", 70),
      makeNote("Notes/b.md", 30),
    ]);
    const configs: FolderConfig[] = [
      { pattern: "Notes", exclude: false, staleCheckEnabled: true, staleDays: 0 },
    ];
    // Global 60 days — a fails, b passes
    const issues = detectStaleNotes(snapshot, 60, configs);
    expect(issues).toHaveLength(1);
    expect(issues[0].notePath).toBe("Notes/a.md");
  });

  it("longest matching pattern wins (most specific rule)", () => {
    const snapshot = makeSnapshot([
      makeNote("40 - Daily/Daily Reviews/2026-04-22.md", 200),
      makeNote("40 - Daily/other.md", 200),
    ]);
    const configs: FolderConfig[] = [
      { pattern: "40 - Daily", exclude: false, staleCheckEnabled: true, staleDays: 90 },
      { pattern: "40 - Daily/Daily Reviews", exclude: false, staleCheckEnabled: false, staleDays: 0 },
    ];
    // Daily Reviews has staleCheckEnabled: false (more specific wins)
    // other.md stays under "40 - Daily" (90 day threshold, 200 > 90)
    const issues = detectStaleNotes(snapshot, 60, configs);
    expect(issues).toHaveLength(1);
    expect(issues[0].notePath).toBe("40 - Daily/other.md");
  });
});
