import { App, Modal, Notice, ButtonComponent, Setting } from "obsidian";
import { LintIssue, HealthScore, VaultMindSettings } from "../types";
import {
  estimateCost,
  generateRecommendations,
  selectRecommendableIssues,
} from "../core/ai-recommender";

export class ResultsModal extends Modal {
  private recommendations = new Map<string, string>(); // issueId -> suggestion

  constructor(
    app: App,
    private issues: LintIssue[],
    private score: HealthScore | null,
    private settings?: VaultMindSettings
  ) {
    super(app);
  }

  onOpen() {
    this.render();
  }

  private render() {
    const { contentEl } = this;
    contentEl.empty();

    // Header — Obsidian renders this as the modal title
    this.titleEl?.setText("Results");

    // Health score
    if (this.score) {
      const scoreEl = contentEl.createDiv({ cls: "vaultmind-score" });
      new Setting(scoreEl)
        .setName(`Health score: ${this.score.total}/100`)
        .setHeading();

      const table = scoreEl.createEl("table");
      const header = table.createEl("tr");
      header.createEl("th", { text: "Dimension" });
      header.createEl("th", { text: "Score" });
      header.createEl("th", { text: "Max" });

      const dims = [
        ["Consistency (broken links)", this.score.consistency],
        ["Connectivity (orphans)", this.score.connectivity],
        ["Freshness (staleness)", this.score.freshness],
        ["Completeness (overviews)", this.score.completeness],
      ];

      for (const [name, value] of dims) {
        const row = table.createEl("tr");
        row.createEl("td", { text: name as string });
        row.createEl("td", { text: String(value) });
        row.createEl("td", { text: "25" });
      }
    }

    // Issues grouped by type
    if (this.issues.length === 0) {
      contentEl.createEl("p", {
        text: "No issues found. Your vault is healthy!",
      });
      return;
    }

    // AI Recommendations controls (Phase 2b)
    this.renderAIControls(contentEl);

    new Setting(contentEl)
      .setName(`Issues (${this.issues.length})`)
      .setHeading();

    const grouped = new Map<string, LintIssue[]>();
    for (const issue of this.issues) {
      const list = grouped.get(issue.type) ?? [];
      list.push(issue);
      grouped.set(issue.type, list);
    }

    const typeLabels: Record<string, string> = {
      "broken-link": "Broken links",
      orphan: "Orphan notes",
      stale: "Stale notes",
      "missing-overview": "Missing overviews",
    };

    for (const [type, issues] of grouped) {
      const section = contentEl.createDiv();
      new Setting(section)
        .setName(`${typeLabels[type] ?? type} (${issues.length})`)
        .setHeading();

      const list = section.createEl("ul");
      for (const issue of issues.slice(0, 50)) {
        const li = list.createEl("li");
        const link = li.createEl("a", {
          text: issue.message,
          href: "#",
        });
        link.addEventListener("click", (e) => {
          e.preventDefault();
          void this.app.workspace.openLinkText(issue.notePath, "", false);
          this.close();
        });
        // Inline offline (fuzzy-match / template) suggestion — no API needed
        if (issue.offlineSuggestion) {
          const sugEl = li.createEl("pre", { cls: "vaultmind-suggestion" });
          sugEl.setText(issue.offlineSuggestion);
        }
        // AI suggestion (if user ran Generate) — overrides/appends offline one
        const aiSuggestion = this.recommendations.get(issue.id);
        if (aiSuggestion) {
          const aiEl = li.createDiv({ cls: "vaultmind-ai-suggestion" });
          aiEl.setText("✨ AI: " + aiSuggestion);
        }
      }
      if (issues.length > 50) {
        list.createEl("li", {
          text: `... and ${issues.length - 50} more`,
        });
      }
    }
  }

  private renderAIControls(containerEl: HTMLElement) {
    const s = this.settings;
    const recommendable = selectRecommendableIssues(this.issues, s?.aiMaxIssues ?? 30);
    if (recommendable.length === 0) return;

    const aiBox = containerEl.createDiv({ cls: "vaultmind-ai-box" });
    new Setting(aiBox).setName("AI recommendations").setHeading();

    const hasKey = !!s?.anthropicApiKey;
    if (!hasKey) {
      aiBox.createEl("p", {
        text: "Add an API key in plugin settings to enable fix suggestions for broken links and missing overviews.",
        cls: "setting-item-description",
      });
      return;
    }

    const est = estimateCost(recommendable.length, s?.aiBatchSize ?? 10);
    const costStr = est.costUSD < 0.01 ? "< $0.01" : `~$${est.costUSD.toFixed(3)}`;

    const info = aiBox.createEl("p", { cls: "setting-item-description" });
    info.setText(
      `${recommendable.length} actionable issue(s) selected. Estimated cost ${costStr} (${est.inputTokens} in + ${est.outputTokens} out tokens, ${s?.aiModel ?? "haiku"}).`
    );

    const btnRow = aiBox.createDiv({ cls: "vaultmind-ai-row" });
    const status = btnRow.createEl("span", { cls: "vaultmind-ai-status" });

    new ButtonComponent(btnRow)
      .setButtonText(
        this.recommendations.size > 0 ? "Regenerate" : "Generate suggestions"
      )
      .setCta()
      .onClick(() => {
        void this.runRecommendations(status);
      });
  }

  private async runRecommendations(statusEl: HTMLElement) {
    const s = this.settings;
    if (!s?.anthropicApiKey) {
      new Notice("API key missing");
      return;
    }

    statusEl.setText("Generating suggestions...");
    try {
      const { recommendations, stats } = await generateRecommendations(
        this.issues,
        {
          apiKey: s.anthropicApiKey,
          model: s.aiModel,
          maxIssues: s.aiMaxIssues,
          batchSize: s.aiBatchSize,
        }
      );
      // Merge into local map
      for (const rec of recommendations) {
        this.recommendations.set(rec.issueId, rec.suggestion);
      }
      statusEl.setText(
        `Done. ${recommendations.length}/${stats.issuesProcessed} suggestions. Cost $${stats.estimatedCostUSD.toFixed(4)} (${stats.batchesCalled} calls).`
      );
      new Notice(
        `Generated ${recommendations.length} AI suggestions for $${stats.estimatedCostUSD.toFixed(4)}`
      );
      // Re-render to show suggestions inline
      this.render();
    } catch (err: unknown) {
      console.error("VaultMind AI error:", err);
      const message = err instanceof Error ? err.message : String(err);
      statusEl.setText(`Error: ${message}`);
      new Notice("AI suggestions failed, see console for details");
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
