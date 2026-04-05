# VaultMind — Obsidian Vault Health Checker Plugin

## Project
- **Repo:** kennethlaw325/vaultmind (private)
- **Tech:** TypeScript + esbuild → Obsidian community plugin
- **Target:** Obsidian desktop (isDesktopOnly: true)

## Architecture
- `src/core/` — Pure TypeScript lint logic, ZERO Obsidian dependency. Jest testable.
- `src/adapters/` — Bridge between Obsidian API and core logic.
- `src/ui/` — Modal, status bar, settings UI.
- `__tests__/` — Jest tests for core logic only.

## Key Rules
- **Use `app.vault` API only** — no `node:fs`, no `require('fs')`
- **Wait for `metadataCache` resolved event** before scanning
- **Chunk + yield** for large vaults: 200 notes per chunk, `setTimeout(0)` between
- **No SDK imports** — use `fetch()` directly for any future LLM calls
- **Bundle must be single `main.js`** — esbuild bundles everything

## Dev Commands
```bash
npm install          # Install deps
npm run dev          # Build (dev mode, with sourcemap)
npm run build        # Build (production, minified)
npm test             # Run Jest tests
```

## Testing
- Copy `main.js` + `manifest.json` + `styles.css` to vault's `.obsidian/plugins/obsidian-vaultmind/`
- Reload Obsidian (Ctrl+R)
- Enable plugin in Settings > Community Plugins

## Branch Workflow
- `main` — stable
- Feature branches → PR → merge to main
