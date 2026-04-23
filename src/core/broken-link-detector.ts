import { VaultSnapshot, LintIssue } from "../types";

export function detectBrokenLinks(snapshot: VaultSnapshot): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const note of snapshot.notes) {
    for (const unresolvedLink of note.unresolvedLinks) {
      issues.push({
        id: `broken-${note.path}-${unresolvedLink}`,
        type: "broken-link",
        severity: "critical",
        notePath: note.path,
        message: `Broken link: [[${unresolvedLink}]]`,
        detail: `"${note.name}" links to "${unresolvedLink}" which does not exist.`,
      });
    }
  }

  return issues;
}
