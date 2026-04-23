import { VaultSnapshot, LintIssue, FolderConfig, findFolderConfig } from "../types";

export function detectStaleNotes(
  snapshot: VaultSnapshot,
  globalThresholdDays: number = 60,
  folderConfigs: FolderConfig[] = []
): LintIssue[] {
  const issues: LintIssue[] = [];
  const now = Date.now();

  for (const note of snapshot.notes) {
    // Resolve per-folder config
    const cfg = findFolderConfig(note.path, folderConfigs);
    if (cfg && !cfg.staleCheckEnabled) continue; // folder opted out
    const thresholdDays =
      cfg && cfg.staleCheckEnabled && cfg.staleDays > 0
        ? cfg.staleDays
        : globalThresholdDays;

    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
    const age = now - note.mtime;
    if (age > thresholdMs) {
      const daysSinceModified = Math.floor(age / (24 * 60 * 60 * 1000));
      issues.push({
        id: `stale-${note.path}`,
        type: "stale",
        severity: "info",
        notePath: note.path,
        message: `"${note.name}" not modified in ${daysSinceModified} days`,
        detail: `Last modified ${daysSinceModified} days ago (threshold: ${thresholdDays} days${cfg ? ` for "${cfg.pattern}"` : ""}). Consider updating or archiving.`,
      });
    }
  }

  return issues;
}
