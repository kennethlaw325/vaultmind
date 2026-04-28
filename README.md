# VaultMind

> Vault health checker for Obsidian — find orphan notes, broken links, stale content, and missing overviews in seconds.

Tested on a 700+ note vault. Zero config, no API key needed.

---

## What it does

VaultMind scans your Obsidian vault and scores it across four dimensions, then surfaces concrete issues you can fix:

| Dimension | What it checks |
|---|---|
| **Consistency** | Broken `[[wikilinks]]` pointing to notes that don't exist |
| **Connectivity** | Orphan notes with no inbound links |
| **Freshness** | Notes that haven't been modified in a long time (per-folder thresholds) |
| **Completeness** | Folders with 3+ notes but no `_index.md` / overview |

Each issue comes with an inline **actionable suggestion**:
- Broken link → "Did you mean `[[X]]` (78% match)?" (offline fuzzy matcher)
- Missing overview → ready-to-paste `_index.md` template listing the folder's top notes
- With an optional Anthropic API key: richer AI-generated fix recommendations

Click any issue to jump directly to the source note.

---

## Install

### Manual (until Community Plugins listing is approved)

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/kennethlaw325/vaultmind/releases/latest).
2. Copy the three files into your vault's `.obsidian/plugins/vaultmind/` folder (create the folder if it doesn't exist).
3. In Obsidian: **Settings → Community plugins → Reload installed plugins**.
4. Enable **VaultMind** in the Installed plugins list.

### From source

```bash
git clone https://github.com/kennethlaw325/vaultmind.git
cd vaultmind
npm install
npm run build
# Copy main.js + manifest.json + styles.css into your vault's plugin folder as above
```

---

## Usage

- **Ctrl/Cmd+P → `VaultMind: Run Lint`** — scans the vault, updates the status bar with your score.
- **Ctrl/Cmd+P → `VaultMind: Show Results`** — opens the detailed modal.
- Or click the `VaultMind: XX/100 | Y issues` status-bar item to open results.
- Auto-scan on startup is enabled by default (toggle in Settings).

---

## Per-folder configuration

v0.2.0 introduced per-folder overrides so VaultMind fits how you actually organize your vault instead of forcing one global rule.

Each rule has a **pattern** (folder prefix), an **Exclude** toggle, a **Stale check** toggle, and a **Stale days** override (0 = use the global default).

Default rules shipped out of the box (`Settings → VaultMind → Per-folder overrides`):

| Pattern | Exclude | Stale check | Days |
|---|---|---|---|
| `99 - Archive` | off | **off** | — |
| `40 - Daily/Daily Reviews` | **on** | — | — |
| `40 - Daily/Lint Reports` | **on** | — | — |
| `Templates` | **on** | — | — |
| `10 - Projects` | off | on | 30 |
| *(any other folder)* | off | on | **60** (global default) |

These reflect a common PARA-ish layout. Override them or add your own — the longest-matching pattern wins for any given note, so you can layer specific rules on top of broad ones.

---

## AI recommendations (optional)

If you want richer suggestions than the built-in fuzzy matcher, drop your [Anthropic API key](https://console.anthropic.com/) into **Settings → VaultMind → AI recommendations**.

- Default model: `claude-haiku-4-5-20251001` (fastest + cheapest).
- Typical cost: **under $0.01** for a 30-issue run.
- Explicit opt-in: only runs when you click **Generate suggestions** in the results modal. No background API calls.
- Offline suggestions still show even if no key is set — AI is layered on top (green `✨ AI:` prefix).

---

## Architecture

- `src/core/` — pure TypeScript lint logic, zero Obsidian dependency. Jest-testable.
- `src/adapters/` — bridge between Obsidian's `app.vault` / `metadataCache` API and the core.
- `src/ui/` — modal, settings, status-bar.

67 unit tests cover the detectors, scoring, fuzzy matching, and AI parser.

Build produces a single 20 KB `main.js` bundle via esbuild.

---

## Development

```bash
npm install
npm run dev      # Build with sourcemap (watch-ready)
npm run build    # Production build (minified)
npm test         # Run Jest test suite
```

See `CLAUDE.md` for project conventions (no `node:fs`, wait for `metadataCache` resolved, chunk-and-yield for large vaults).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT
