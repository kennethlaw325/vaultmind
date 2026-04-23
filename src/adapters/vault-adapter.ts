import { App, TFile } from "obsidian";
import { NoteMetadata, VaultSnapshot, FolderConfig, findFolderConfig } from "../types";

export class VaultAdapter {
  constructor(private app: App) {}

  async buildSnapshot(
    excludeFolders: string[],
    folderConfigs: FolderConfig[] = [],
    onProgress?: (done: number, total: number) => void
  ): Promise<VaultSnapshot> {
    const startTime = Date.now();

    const files = this.app.vault
      .getMarkdownFiles()
      .filter((f) => {
        // Legacy excludeFolders list
        if (
          excludeFolders.some(
            (ex) => f.path.startsWith(ex + "/") || f.path.startsWith(ex)
          )
        ) {
          return false;
        }
        // Folder configs with exclude: true
        const cfg = findFolderConfig(f.path, folderConfigs);
        if (cfg?.exclude) return false;
        return true;
      });

    const notes: NoteMetadata[] = [];
    const chunkSize = 200;

    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      for (const file of chunk) {
        notes.push(this.extractMetadata(file));
      }
      onProgress?.(Math.min(i + chunkSize, files.length), files.length);
      // Yield to UI thread
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const notesByPath = new Map(notes.map((n) => [n.path, n]));
    const notesByName = new Map(notes.map((n) => [n.name, n]));

    return {
      notes,
      notesByPath,
      notesByName,
      totalNotes: notes.length,
      scanTime: Date.now() - startTime,
    };
  }

  private extractMetadata(file: TFile): NoteMetadata {
    const cache = this.app.metadataCache;
    const resolvedLinks = cache.resolvedLinks[file.path] ?? {};
    const unresolvedLinks = cache.unresolvedLinks[file.path] ?? {};

    const folderPath = file.parent?.path ?? "";

    return {
      path: file.path,
      name: file.basename,
      mtime: file.stat.mtime,
      outboundLinks: Object.keys(resolvedLinks),
      unresolvedLinks: Object.keys(unresolvedLinks),
      isInProjectFolder: false, // set by caller
      folderPath,
    };
  }
}
