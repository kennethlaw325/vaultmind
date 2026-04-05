import { App, PluginSettingTab, Setting } from "obsidian";
import VaultMindPlugin from "./main";

export class VaultMindSettingTab extends PluginSettingTab {
  plugin: VaultMindPlugin;

  constructor(app: App, plugin: VaultMindPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "VaultMind Settings" });

    new Setting(containerEl)
      .setName("Staleness threshold (days)")
      .setDesc("Notes not modified for this many days will be flagged as stale.")
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
      .setDesc("Show VaultMind health score in the status bar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showStatusBar)
          .onChange(async (value) => {
            this.plugin.settings.showStatusBar = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Exclude folders")
      .setDesc("Comma-separated list of folders to exclude from scanning.")
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
  }
}
