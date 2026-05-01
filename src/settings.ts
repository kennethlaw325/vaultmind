import { App, PluginSettingTab, Setting } from "obsidian";
import VaultMindPlugin from "./main";
import { DEFAULT_FOLDER_CONFIGS } from "./types";

export class VaultMindSettingTab extends PluginSettingTab {
  plugin: VaultMindPlugin;

  constructor(app: App, plugin: VaultMindPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const configDir = this.app.vault.configDir;
    containerEl.empty();

    // === Global settings ===
    new Setting(containerEl).setName("Global").setHeading();

    new Setting(containerEl)
      .setName("Staleness threshold (days)")
      .setDesc(
        "Default: notes not modified for this many days are flagged as stale. Per-folder overrides below."
      )
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.stalenessThresholdDays))
          .onChange(async (value) => {
            const days = parseInt(value);
            if (!isNaN(days) && days > 0) {
              this.plugin.settings.stalenessThresholdDays = days;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Auto-scan on startup")
      .setDesc("Automatically run lint when Obsidian opens.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoScanOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.autoScanOnStartup = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show status bar")
      .setDesc("Show health score in the status bar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showStatusBar)
          .onChange(async (value) => {
            this.plugin.settings.showStatusBar = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Exclude folders (global)")
      .setDesc(
        `Comma-separated list of folders to always exclude. \`${configDir}\` and \`.trash\` are implicit.`
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.excludeFolders.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.excludeFolders = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // === Per-folder configs ===
    new Setting(containerEl).setName("Per-folder overrides").setHeading();
    containerEl.createEl("p", {
      text:
        "Each row controls one folder prefix. `Exclude` skips scanning entirely. " +
        "`Stale check` toggles the staleness rule. `Stale days` overrides the global threshold (0 = use global).",
      cls: "setting-item-description",
    });

    if (!this.plugin.settings.folderConfigs) {
      this.plugin.settings.folderConfigs = [];
    }

    const listEl = containerEl.createDiv({ cls: "vaultmind-folder-configs" });
    this.renderFolderConfigs(listEl);

    new Setting(containerEl)
      .addButton((btn) =>
        btn
          .setButtonText("Add folder rule")
          .onClick(async () => {
            this.plugin.settings.folderConfigs.push({
              pattern: "",
              exclude: false,
              staleCheckEnabled: true,
              staleDays: 0,
            });
            await this.plugin.saveSettings();
            this.display();
          })
      )
      .addButton((btn) =>
        btn
          .setButtonText("Reset to defaults")
          .setWarning()
          .onClick(async () => {
            this.plugin.settings.folderConfigs = [...DEFAULT_FOLDER_CONFIGS];
            await this.plugin.saveSettings();
            this.display();
          })
      );

    // === AI recommendations (Phase 2b) ===
    new Setting(containerEl).setName("AI recommendations").setHeading();
    containerEl.createEl("p", {
      text:
        "Provide an Anthropic API key to generate actionable fix suggestions for broken links and missing overviews. A typical run of 30 issues costs under $0.01.",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Anthropic API key")
      .setDesc(
        `Stored in ${configDir}/plugins/vaultmind/data.json on your machine. Keys start with sk-ant-...`
      )
      .addText((text) => {
        text.inputEl.type = "password";
        return text
          .setPlaceholder("Sk-ant-...")
          .setValue(this.plugin.settings.anthropicApiKey)
          .onChange(async (value) => {
            this.plugin.settings.anthropicApiKey = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Model")
      .setDesc("Anthropic model identifier. The default is tuned for speed and low cost.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.aiModel)
          .onChange(async (value) => {
            this.plugin.settings.aiModel = value.trim() || "claude-haiku-4-5-20251001";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Max issues per run")
      .setDesc("Cap on how many issues get AI suggestions per generate click (cost control).")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.aiMaxIssues))
          .onChange(async (value) => {
            const n = parseInt(value);
            if (!isNaN(n) && n > 0) {
              this.plugin.settings.aiMaxIssues = n;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Batch size")
      .setDesc("Issues per API call. Higher = fewer calls, lower = faster first result.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.aiBatchSize))
          .onChange(async (value) => {
            const n = parseInt(value);
            if (!isNaN(n) && n > 0 && n <= 50) {
              this.plugin.settings.aiBatchSize = n;
              await this.plugin.saveSettings();
            }
          })
      );
  }

  private renderFolderConfigs(container: HTMLElement): void {
    container.empty();
    const configs = this.plugin.settings.folderConfigs;
    if (configs.length === 0) {
      container.createEl("p", {
        text: "No folder rules configured. Use the buttons below to add a rule or reset to defaults.",
        cls: "setting-item-description",
      });
      return;
    }

    configs.forEach((cfg, index) => {
      const row = new Setting(container).setName(cfg.pattern || "(empty pattern)");

      row.addText((text) =>
        text
          .setPlaceholder("Folder path, e.g. 10 - projects")
          .setValue(cfg.pattern)
          .onChange(async (value) => {
            cfg.pattern = value.trim();
            await this.plugin.saveSettings();
          })
      );

      row.addToggle((toggle) =>
        toggle
          .setTooltip("Exclude — skip folder entirely")
          .setValue(cfg.exclude)
          .onChange(async (value) => {
            cfg.exclude = value;
            await this.plugin.saveSettings();
          })
      );

      row.addToggle((toggle) =>
        toggle
          .setTooltip("Stale check — flag old notes")
          .setValue(cfg.staleCheckEnabled)
          .onChange(async (value) => {
            cfg.staleCheckEnabled = value;
            await this.plugin.saveSettings();
          })
      );

      row.addText((text) =>
        text
          .setPlaceholder("Days")
          .setValue(String(cfg.staleDays))
          .onChange(async (value) => {
            const n = parseInt(value);
            cfg.staleDays = isNaN(n) || n < 0 ? 0 : n;
            await this.plugin.saveSettings();
          })
      );

      row.addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("Remove this rule")
          .onClick(async () => {
            configs.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          })
      );
    });
  }
}
