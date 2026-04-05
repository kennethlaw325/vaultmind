import { detectMissingOverviews } from "../src/core/overview-checker";
import { VaultSnapshot, NoteMetadata } from "../src/types";

function makeNote(path: string, folder: string, name?: string): NoteMetadata {
  return {
    path,
    name: name ?? path.split("/").pop()?.replace(".md", "") ?? "",
    mtime: Date.now(),
    outboundLinks: [],
    unresolvedLinks: [],
    isInProjectFolder: true,
    folderPath: folder,
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

describe("detectMissingOverviews", () => {
  it("returns empty when no project folders specified", () => {
    const snapshot = makeSnapshot([makeNote("a.md", "projects")]);
    expect(detectMissingOverviews(snapshot, [])).toEqual([]);
  });

  it("flags folder missing overview", () => {
    const snapshot = makeSnapshot([
      makeNote("projects/a.md", "projects"),
      makeNote("projects/b.md", "projects"),
      makeNote("projects/c.md", "projects"),
    ]);
    const issues = detectMissingOverviews(snapshot, ["projects"]);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("missing-overview");
  });

  it("does not flag folder with overview note", () => {
    const snapshot = makeSnapshot([
      makeNote("projects/overview.md", "projects", "Overview"),
      makeNote("projects/a.md", "projects"),
      makeNote("projects/b.md", "projects"),
    ]);
    expect(detectMissingOverviews(snapshot, ["projects"])).toEqual([]);
  });

  it("does not flag folder with _index note", () => {
    const snapshot = makeSnapshot([
      makeNote("projects/_index.md", "projects", "_index"),
      makeNote("projects/a.md", "projects"),
      makeNote("projects/b.md", "projects"),
    ]);
    expect(detectMissingOverviews(snapshot, ["projects"])).toEqual([]);
  });

  it("skips folders with fewer than 2 notes", () => {
    const snapshot = makeSnapshot([
      makeNote("tiny/a.md", "tiny"),
    ]);
    expect(detectMissingOverviews(snapshot, ["tiny"])).toEqual([]);
  });
});
