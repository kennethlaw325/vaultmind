import { Plugin, Notice } from "obsidian";
import { VaultMindSettings, DEFAULT_SETTINGS, LintIssue, HealthScore } from "./types";
import { VaultAdapter } from "./adapters/vault-adapter";
import { detectOrphans } from "./core/orphan-detector";
import { detectBrokenLinks } from "./core/broken-link-detector";
import { detectStaleNotes } from "./core/staleness-checker";
import { detectMissingOverviews } from "./core/overview-checker";
import { calculateHealthScore } from "./core/health-scorer";
import { ResultsModal } from "./ui/results-modal";

export default class VaultMindPlugin extends Plugin {
  settings: VaultMindSettings = DEFAULT_SETTINGS;
  private statusBarEl: HTMLElement | null = null;
  private lastIssues: LintIssue[] = [];
  private lastScore: HealthScore | null = null;

  async onload() {
    await this.loadSettings();

    // Status bar
    if (this.settings.showStatusBar) {
      this.statusBarEl = this.addStatusBarItem();
      this.statusBarEl.setText("VaultMind: ready");
      this.statusBarEl.addEventListener("click", () => {
        if (this.lastIssues.length > 0 || this.lastScore) {
          new ResultsModal(this.app, this.lastIssues, this.lastScore).open();
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
          new ResultsModal(this.app, this.lastIssues, this.lastScore).open();
        } else {
          new Notice("No results yet. Run VaultMind: Lint first.");
        }
      },
    });

    // Auto-scan on startup
    if (this.settings.autoScanOnStartup) {
      // Wait for metadata cache to resolve
      this.app.workspace.onLayoutReady(() => {
        this.app.metadataCache.on("resolved", () => {
          this.runLint();
        });
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
        (done, total) => {
          if (this.statusBarEl) {
            this.statusBarEl.setText(`VaultMind: ${done}/${total}`);
          }
        }
      );

      // Run all lint rules
      const issues: LintIssue[] = [
        ...detectOrphans(snapshot),
        ...detectBrokenLinks(snapshot),
        ...detectStaleNotes(snapshot, this.settings.stalenessThresholdDays),
        ...detectMissingOverviews(snapshot, this.settings.projectFolders),
      ];

      const score = calculateHealthScore(issues, snapshot.totalNotes);

      this.lastIssues = issues;
      this.lastScore = score;

      // Update status bar
      if (this.statusBarEl) {
        const icon = score.total >= 90 ? "\u2705" : score.total >= 70 ? "\u26A0\uFE0F" : "\u274C";
        this.statusBarEl.setText(
          `VaultMind: ${score.total}/100 ${icon} (${issues.length} issues)`
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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {}
}
