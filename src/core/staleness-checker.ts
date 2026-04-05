import { VaultSnapshot, LintIssue } from "../types";

export function detectStaleNotes(
  snapshot: VaultSnapshot,
  thresholdDays: number = 14
): LintIssue[] {
  const issues: LintIssue[] = [];
  const now = Date.now();
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;

  for (const note of snapshot.notes) {
    const age = now - note.mtime;
    if (age > thresholdMs) {
      const daysSinceModified = Math.floor(age / (24 * 60 * 60 * 1000));
      issues.push({
        id: `stale-${note.path}`,
        type: "stale",
        severity: "info",
        notePath: note.path,
        message: `Not modified in ${daysSinceModified} days`,
        detail: `"${note.name}" was last modified ${daysSinceModified} days ago. Consider updating or archiving.`,
      });
    }
  }

  return issues;
}
