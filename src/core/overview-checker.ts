import { VaultSnapshot, LintIssue } from "../types";

export function detectMissingOverviews(
  snapshot: VaultSnapshot,
  projectFolders: string[]
): LintIssue[] {
  const issues: LintIssue[] = [];

  // Group notes by folder
  const folderNotes = new Map<string, number>();
  for (const note of snapshot.notes) {
    const folder = note.folderPath;
    folderNotes.set(folder, (folderNotes.get(folder) ?? 0) + 1);
  }

  // Check each project folder for overview/index
  for (const folder of projectFolders) {
    const noteCount = folderNotes.get(folder) ?? 0;
    if (noteCount < 2) continue; // Skip folders with 0-1 notes

    const hasOverview = snapshot.notes.some(
      (n) =>
        n.folderPath === folder &&
        (n.name.toLowerCase().includes("overview") ||
          n.name.toLowerCase().includes("index") ||
          n.name === "_index")
    );

    if (!hasOverview) {
      issues.push({
        id: `missing-overview-${folder}`,
        type: "missing-overview",
        severity: "warning",
        notePath: folder,
        message: `No overview note in "${folder}"`,
        detail: `Folder "${folder}" has ${noteCount} notes but no overview or index file.`,
      });
    }
  }

  return issues;
}
