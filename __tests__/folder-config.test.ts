import { findFolderConfig, FolderConfig } from "../src/types";

describe("findFolderConfig", () => {
  const configs: FolderConfig[] = [
    { pattern: "99 - Archive", exclude: false, staleCheckEnabled: false, staleDays: 0 },
    { pattern: "40 - Daily/Daily Reviews", exclude: true, staleCheckEnabled: false, staleDays: 0 },
    { pattern: "40 - Daily", exclude: false, staleCheckEnabled: true, staleDays: 90 },
    { pattern: "10 - Projects", exclude: false, staleCheckEnabled: true, staleDays: 30 },
  ];

  it("returns null when no pattern matches", () => {
    expect(findFolderConfig("some/other/path.md", configs)).toBeNull();
  });

  it("matches exact folder prefix", () => {
    const cfg = findFolderConfig("99 - Archive/Sessions/old.md", configs);
    expect(cfg?.pattern).toBe("99 - Archive");
  });

  it("longest pattern wins for overlapping rules", () => {
    const cfg = findFolderConfig(
      "40 - Daily/Daily Reviews/2026-04-22.md",
      configs
    );
    expect(cfg?.pattern).toBe("40 - Daily/Daily Reviews");
  });

  it("shorter pattern matches when no deeper pattern applies", () => {
    const cfg = findFolderConfig("40 - Daily/misc-note.md", configs);
    expect(cfg?.pattern).toBe("40 - Daily");
  });

  it("matches when note path exactly equals pattern", () => {
    // Edge case: pattern is a file path itself
    const cfg = findFolderConfig("10 - Projects", configs);
    expect(cfg?.pattern).toBe("10 - Projects");
  });

  it("does not match partial folder name prefix", () => {
    // "10 - Projects" should NOT match "10 - ProjectsArchived/..."
    const cfg = findFolderConfig("10 - ProjectsArchived/note.md", configs);
    expect(cfg).toBeNull();
  });

  it("returns null for empty config list", () => {
    expect(findFolderConfig("any/path.md", [])).toBeNull();
  });
});
