import { detectBrokenLinks } from "../src/core/broken-link-detector";
import { VaultSnapshot, NoteMetadata } from "../src/types";

function makeNote(
  path: string,
  unresolvedLinks: string[] = []
): NoteMetadata {
  return {
    path,
    name: path.replace(".md", ""),
    mtime: Date.now(),
    outboundLinks: [],
    unresolvedLinks,
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

describe("detectBrokenLinks", () => {
  it("returns empty when no broken links", () => {
    const snapshot = makeSnapshot([makeNote("a.md")]);
    expect(detectBrokenLinks(snapshot)).toEqual([]);
  });

  it("detects broken links", () => {
    const snapshot = makeSnapshot([
      makeNote("a.md", ["nonexistent"]),
    ]);
    const issues = detectBrokenLinks(snapshot);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("broken-link");
    expect(issues[0].message).toContain("nonexistent");
  });

  it("detects multiple broken links in one note", () => {
    const snapshot = makeSnapshot([
      makeNote("a.md", ["ghost1", "ghost2"]),
    ]);
    const issues = detectBrokenLinks(snapshot);
    expect(issues).toHaveLength(2);
  });
});
