import { Plugin, Notice } from "obsidian";
import { VaultMindSettings, DEFAULT_SETTINGS, LintIssue, HealthScore, VaultSnapshot } from "./types";
import { VaultAdapter } from "./adapters/vault-adapter";
import { detectOrphans } from "./core/orphan-detector";
import { detectBrokenLinks } from "./core/broken-link-detector";
import { detectStaleNotes } from "./core/staleness-checker";
import { detectMissingOverviews } from "./core/overview-checker";
import { calculateHealthScore } from "./core/health-scorer";
import { findBestMatches, suggestOverviewTemplate } from "./core/fuzzy-matcher";
import { ResultsModal } from "./ui/results-modal";
import { VaultMindSettingTab } from "./settings";

export default class VaultMindPlugin extends Plugin {
  settings: VaultMindSettings = DEFAULT_SETTINGS;
  private statusBarEl: HTMLElement | null = null;
  private lastIssues: LintIssue[] = [];
  private lastScore: HealthScore | null = null;
  private lastSnapshot: VaultSnapshot | null = null;
  private hasAutoScanned = false;

  async onload() {
    await this.loadSettings();

    // Settings tab
    this.addSettingTab(new VaultMindSettingTab(this.app, this));

    // Status bar
    if (this.settings.showStatusBar) {
      this.statusBarEl = this.addStatusBarItem();
      this.statusBarEl.setText("VaultMind: ready");
      this.statusBarEl.addClass("mod-clickable");
      this.statusBarEl.addEventListener("click", () => {
        if (this.lastIssues.length > 0 || this.lastScore) {
          new ResultsModal(this.app, this.lastIssues, this.lastScore, this.settings).open();
        } else {
          new Notice("Run VaultMind: Lint first");
        }
      });
    }

    // Commands
    this.addCommand({
      id: "run-lint",
      name: "Run Lint",
      callback: () => this.runLint(),
    });

    this.addCommand({
      id: "show-results",
      name: "Show Results",
      callback: () => {
        if (this.lastIssues.length > 0 || this.lastScore) {
          new ResultsModal(this.app, this.lastIssues, this.lastScore, this.settings).open();
        } else {
          new Notice("No results yet. Run VaultMind: Lint first.");
        }
      },
    });

    // Auto-scan on startup (once only)
    if (this.settings.autoScanOnStartup) {
      this.app.workspace.onLayoutReady(() => {
        const handler = () => {
          if (!this.hasAutoScanned) {
            this.hasAutoScanned = true;
            this.runLint();
          }
        };
        // If metadata cache is already resolved, run immediately
        if ((this.app.metadataCache as any).initialized) {
          handler();
        } else {
          this.registerEvent(this.app.metadataCache.on("resolved", handler));
        }
      });
    }
  }

  async runLint() {
    const adapter = new VaultAdapter(this.app);

    if (this.statusBarEl) {
      this.statusBarEl.setText("VaultMind: scanning...");
    }

    try {
      const snapshot = await adapter.buildSnapshot(
        this.settings.excludeFolders,
        this.settings.folderConfigs ?? [],
        (done, total) => {
          if (this.statusBarEl) {
            this.statusBarEl.setText(`VaultMind: ${done}/${total}`);
          }
        }
      );

      // Auto-detect project folders if not configured
      let projectFolders = this.settings.projectFolders;
      if (projectFolders.length === 0) {
        // Detect folders with 3+ notes as potential project folders
        const folderCounts = new Map<string, number>();
        for (const note of snapshot.notes) {
          if (note.folderPath) {
            folderCounts.set(note.folderPath, (folderCounts.get(note.folderPath) ?? 0) + 1);
          }
        }
        projectFolders = [...folderCounts.entries()]
          .filter(([, count]) => count >= 3)
          .map(([folder]) => folder);
      }

      // Run all lint rules
      const issues: LintIssue[] = [
        ...detectOrphans(snapshot),
        ...detectBrokenLinks(snapshot),
        ...detectStaleNotes(
          snapshot,
          this.settings.stalenessThresholdDays,
          this.settings.folderConfigs ?? []
        ),
        ...detectMissingOverviews(snapshot, projectFolders),
      ];

      const score = calculateHealthScore(issues, snapshot.totalNotes);

      // Phase 2b offline: attach deterministic suggestions via fuzzy matching.
      this.attachOfflineSuggestions(issues, snapshot);

      this.lastIssues = issues;
      this.lastScore = score;
      this.lastSnapshot = snapshot;

      // Update status bar
      if (this.statusBarEl) {
        this.statusBarEl.setText(
          `VaultMind: ${score.total}/100 | ${issues.length} issues`
        );
      }

      // Show notice
      new Notice(
        `VaultMind: ${score.total}/100 — ${issues.length} issues found (${snapshot.scanTime}ms)`
      );
    } catch (err) {
      console.error("VaultMind lint error:", err);
      new Notice("VaultMind: Scan failed. Check console.");
      if (this.statusBarEl) {
        this.statusBarEl.setText("VaultMind: error");
      }
    }
  }

  /**
   * Enrich issues with offline fuzzy-match suggestions (no API call).
   * Broken links get "Did you mean..." top 3 candidates.
   * Missing overviews get a template ready to paste.
   */
  private attachOfflineSuggestions(issues: LintIssue[], snapshot: VaultSnapshot) {
    for (const issue of issues) {
      if (issue.type === "broken-link") {
        // Extract target from message "Broken link: [[target]]"
        const match = issue.message.match(/\[\[(.+?)\]\]/);
        if (!match) continue;
        const target = match[1];
        const candidates = findBestMatches(target, snapshot, 3, 0.4);
        if (candidates.length > 0) {
          const lines = candidates.map(
            (c) => `  • [[${c.candidate.name}]] (${Math.round(c.score * 100)}% match)`
          );
          (issue as any).offlineSuggestion = `Did you mean:\n${lines.join("\n")}`;
        }
      } else if (issue.type === "missing-overview") {
        const { suggestion } = suggestOverviewTemplate(issue.notePath, snapshot, 5);
        (issue as any).offlineSuggestion = suggestion;
      }
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {}
}
