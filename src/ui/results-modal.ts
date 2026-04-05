import { App, Modal } from "obsidian";
import { LintIssue, HealthScore } from "../types";

export class ResultsModal extends Modal {
  constructor(
    app: App,
    private issues: LintIssue[],
    private score: HealthScore | null
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Header
    contentEl.createEl("h2", { text: "VaultMind Results" });

    // Health Score
    if (this.score) {
      const scoreEl = contentEl.createDiv({ cls: "vaultmind-score" });
      scoreEl.createEl("h3", {
        text: `Health Score: ${this.score.total}/100`,
      });

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

    contentEl.createEl("h3", {
      text: `Issues (${this.issues.length})`,
    });

    const grouped = new Map<string, LintIssue[]>();
    for (const issue of this.issues) {
      const list = grouped.get(issue.type) ?? [];
      list.push(issue);
      grouped.set(issue.type, list);
    }

    const typeLabels: Record<string, string> = {
      "broken-link": "Broken Links",
      orphan: "Orphan Notes",
      stale: "Stale Notes",
      "missing-overview": "Missing Overviews",
    };

    for (const [type, issues] of grouped) {
      const section = contentEl.createDiv();
      section.createEl("h4", {
        text: `${typeLabels[type] ?? type} (${issues.length})`,
      });

      const list = section.createEl("ul");
      for (const issue of issues.slice(0, 50)) {
        const li = list.createEl("li");
        const link = li.createEl("a", {
          text: issue.message,
          href: "#",
        });
        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(issue.notePath, "", false);
          this.close();
        });
      }
      if (issues.length > 50) {
        list.createEl("li", {
          text: `... and ${issues.length - 50} more`,
        });
      }
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
