import { NoteMetadata, VaultSnapshot, LintIssue } from "../types";

export function detectOrphans(snapshot: VaultSnapshot): LintIssue[] {
  const inboundCount = new Map<string, number>();

  // Initialize all notes with 0 inbound links
  for (const note of snapshot.notes) {
    inboundCount.set(note.path, 0);
  }

  // Count inbound links
  for (const note of snapshot.notes) {
    for (const target of note.outboundLinks) {
      const current = inboundCount.get(target) ?? 0;
      inboundCount.set(target, current + 1);
    }
  }

  const issues: LintIssue[] = [];

  for (const note of snapshot.notes) {
    const count = inboundCount.get(note.path) ?? 0;
    if (count === 0) {
      issues.push({
        id: `orphan-${note.path}`,
        type: "orphan",
        severity: "warning",
        notePath: note.path,
        message: `"${note.name}" has no inbound links`,
        detail: `No other note links to this note. Consider linking it from a related note or archiving it.`,
      });
    }
  }

  return issues;
}
