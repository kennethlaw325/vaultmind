import { detectOrphans } from "../src/core/orphan-detector";
import { VaultSnapshot, NoteMetadata } from "../src/types";

function makeNote(path: string, outbound: string[] = []): NoteMetadata {
  return {
    path,
    name: path.replace(".md", ""),
    mtime: Date.now(),
    outboundLinks: outbound,
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

describe("detectOrphans", () => {
  it("returns empty for empty vault", () => {
    const snapshot = makeSnapshot([]);
    expect(detectOrphans(snapshot)).toEqual([]);
  });

  it("detects single orphan note", () => {
    const snapshot = makeSnapshot([makeNote("a.md"), makeNote("b.md")]);
    const issues = detectOrphans(snapshot);
    expect(issues).toHaveLength(2); // both orphans
  });

  it("does not flag notes with inbound links", () => {
    const snapshot = makeSnapshot([
      makeNote("a.md", ["b.md"]),
      makeNote("b.md", ["a.md"]),
    ]);
    const issues = detectOrphans(snapshot);
    expect(issues).toHaveLength(0);
  });

  it("flags only the orphan in a mixed set", () => {
    const snapshot = makeSnapshot([
      makeNote("a.md", ["b.md"]),
      makeNote("b.md"),
      makeNote("c.md"), // orphan — no one links to c
    ]);
    const issues = detectOrphans(snapshot);
    const orphanPaths = issues.map((i) => i.notePath);
    expect(orphanPaths).toContain("a.md"); // a has no inbound
    expect(orphanPaths).not.toContain("b.md"); // b has inbound from a
    expect(orphanPaths).toContain("c.md"); // c has no inbound
  });
});
