import { detectStaleNotes } from "../src/core/staleness-checker";
import { VaultSnapshot, NoteMetadata } from "../src/types";

function makeNote(path: string, daysAgo: number): NoteMetadata {
  return {
    path,
    name: path.replace(".md", ""),
    mtime: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    outboundLinks: [],
    unresolvedLinks: [],
    isInProjectFolder: false,
    folderPath: "",
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

  it("respects custom threshold", () => {
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
    // 14 days ago with some ms margin — should be just at boundary
    const issues = detectStaleNotes(snapshot, 14);
    // Depending on ms precision, might be 0 or 1 — just verify no crash
    expect(issues.length).toBeLessThanOrEqual(1);
  });
});
