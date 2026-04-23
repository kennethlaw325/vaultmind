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
  severity: "critical" | "warning" | "info";
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
  consistency: number; // 5-25 (broken links)
  connectivity: number; // 5-25 (orphans)
  freshness: number; // 5-25 (staleness)
  completeness: number; // 5-25 (missing overviews)
  issueCount: number;
}

export interface FolderConfig {
  pattern: string;           // folder path prefix, e.g. "99 - Archive"
  exclude: boolean;          // completely skip scanning in this folder
  staleCheckEnabled: boolean; // enable staleness check
  staleDays: number;         // threshold days (0 = use global default)
}

export interface VaultMindSettings {
  stalenessThresholdDays: number; // global default
  projectFolders: string[];
  excludeFolders: string[];    // legacy, still honored
  folderConfigs: FolderConfig[]; // per-folder overrides (Phase 2a)
  autoScanOnStartup: boolean;
  showStatusBar: boolean;
}

export const DEFAULT_FOLDER_CONFIGS: FolderConfig[] = [
  // User-configured policy (2026-04-23)
  { pattern: "99 - Archive", exclude: false, staleCheckEnabled: false, staleDays: 0 },
  { pattern: "40 - Daily/Daily Reviews", exclude: true, staleCheckEnabled: false, staleDays: 0 },
  { pattern: "10 - Projects", exclude: false, staleCheckEnabled: true, staleDays: 30 },
  // Safe defaults for auto-generated / template folders
  { pattern: "40 - Daily/Lint Reports", exclude: true, staleCheckEnabled: false, staleDays: 0 },
  { pattern: "Templates", exclude: true, staleCheckEnabled: false, staleDays: 0 },
];

export const DEFAULT_SETTINGS: VaultMindSettings = {
  stalenessThresholdDays: 60, // raised from 14 to 60 (more realistic for knowledge vault)
  projectFolders: [],
  excludeFolders: [".obsidian", ".trash"],
  folderConfigs: DEFAULT_FOLDER_CONFIGS,
  autoScanOnStartup: true,
  showStatusBar: true,
};

/**
 * Returns the matching folder config for a note path, or null if no match.
 * Longest pattern wins (most specific rule takes precedence).
 */
export function findFolderConfig(
  notePath: string,
  configs: FolderConfig[]
): FolderConfig | null {
  const matches = configs.filter(
    (c) => notePath.startsWith(c.pattern + "/") || notePath === c.pattern
  );
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.pattern.length - a.pattern.length)[0];
}
