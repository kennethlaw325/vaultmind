export interface NoteMetadata {
  path: string;
  name: string;
  mtime: number;
  outboundLinks: string[]; // resolved wikilink targets
  unresolvedLinks: string[]; // broken wikilinks
  isInProjectFolder: boolean;
  folderPath: string;
}

export interface VaultSnapshot {
  notes: NoteMetadata[];
  notesByPath: Map<string, NoteMetadata>;
  notesByName: Map<string, NoteMetadata>;
  totalNotes: number;
  scanTime: number;
}

export interface LintIssue {
  id: string;
  type: "orphan" | "broken-link" | "stale" | "missing-overview";
  severity: "warning" | "error" | "info";
  notePath: string;
  message: string;
  detail?: string;
  suggestedFix?: PendingAction;
}

export interface PendingAction {
  id: string;
  type: "fix-link" | "archive" | "add-link" | "create-overview";
  targetPath: string;
  expectedMtime: number;
  description: string;
  preview?: { before: string; after: string };
  status: "pending" | "approved" | "rejected" | "applied" | "conflict";
}

export interface HealthScore {
  total: number; // 0-100
  consistency: number; // 0-25 (broken links)
  connectivity: number; // 0-25 (orphans)
  freshness: number; // 0-25 (staleness)
  completeness: number; // 0-25 (missing overviews)
  issueCount: number;
}

export interface VaultMindSettings {
  stalenessThresholdDays: number;
  projectFolders: string[];
  excludeFolders: string[];
  autoScanOnStartup: boolean;
  showStatusBar: boolean;
}

export const DEFAULT_SETTINGS: VaultMindSettings = {
  stalenessThresholdDays: 14,
  projectFolders: [],
  excludeFolders: [".obsidian", ".trash"],
  autoScanOnStartup: true,
  showStatusBar: true,
};
