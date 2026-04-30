# Obsidian Forum announcement post

**Subforum:** Share & showcase → Plugins (confirm current taxonomy at https://forum.obsidian.md/ before posting; the forum occasionally restructures)

**Post type:** New topic

**Tags suggested:** `plugin`, `community-plugin`, `linter`, `vault-health`

---

## Title

VaultMind — vault health checker (orphans, broken links, staleness, missing overviews)

---

## Short description (3 sentences — top of post)

VaultMind is a community plugin that scans your vault for orphan notes, broken wikilinks, stale content, and folders missing an overview, then gives you a 0–100 health score and a clickable list of every issue. It runs fully offline by default; an optional AI recommendation layer is opt-in and uses your own Anthropic API key. Tested on a 700+ note vault, MIT licensed, single 20 KB bundle.

---

## Detailed feature breakdown

### What it scans

| Dimension | Rule | Severity |
|---|---|---|
| Consistency | Broken `[[wikilinks]]` pointing to notes that don't exist | critical |
| Connectivity | Orphan notes with no inbound links | warning |
| Freshness | Notes untouched beyond a per-folder threshold | info |
| Completeness | Folders with 3+ notes but no `_index.md` overview | warning |

Each dimension contributes 0–25 points to the health score, with a 5-point floor per dimension so a first-run score isn't demoralizing.

### Inline suggestions per issue

- **Broken links** — offline fuzzy matcher (Levenshtein + token overlap) surfaces the top 3 likely-intended notes inline. "Did you mean `[[Project Alpha]]` (78% match)?"
- **Missing overview** — auto-generated paste-ready `_index.md` template, listing the folder's most-linked notes.
- **Optional AI** — drop in an Anthropic API key for richer per-issue suggestions. Typical 30-issue run costs under $0.01. Calls are explicit (button click, not background).

### Per-folder configuration

Each folder pattern can have its own staleness rules or be excluded entirely. Defaults shipped out of the box reflect a PARA-ish layout:

| Pattern | Exclude | Stale check | Days |
|---|---|---|---|
| `99 - Archive` | off | off | — |
| `40 - Daily/Daily Reviews` | on | — | — |
| `40 - Daily/Lint Reports` | on | — | — |
| `Templates` | on | — | — |
| `10 - Projects` | off | on | 30 |
| *(other folders)* | off | on | 60 |

Longest-matching pattern wins, so you can layer specific rules on top of broad ones.

### Privacy

- No telemetry.
- No background API calls.
- AI suggestions only run when you explicitly click "Generate suggestions."
- All offline functionality works without any keys or accounts.

### Real-vault validation

Scan on a 700+ note Obsidian vault before/after tuning per-folder rules:

| Metric | v0.1.0 | v0.2.1 |
|---|---:|---:|
| Health score | 20/100 | 46/100 |
| Total issues | 615 | 231 |
| Freshness dimension | 0/25 | 22/25 |

The reduction came mostly from excluding auto-generated Daily Reviews and Archive from staleness checks, where they were producing noise rather than signal.

### Architecture

- `src/core/` — pure TypeScript, zero Obsidian dependency. 67 Jest tests, runs in <2s.
- `src/adapters/` — bridges Obsidian's `app.vault` and `metadataCache` to the core.
- `src/ui/` — modal, settings, status bar.
- Single 20 KB minified `main.js` bundle via esbuild.

Desktop-only (`isDesktopOnly: true`) because the core scan iterates the full vault and chunks at 200 notes per `setTimeout(0)` yield, which is friendlier on desktop than on mobile.

---

## Screenshots

[Screenshot 1: Status bar — `VaultMind: 46/100 | 231 issues`, hover state showing breakdown]
[Screenshot 2: Results modal — issues grouped by category with severity badges and clickable file paths]
[Screenshot 3: Broken link expanded with fuzzy-match suggestions inline]
[Screenshot 4: Settings tab — per-folder overrides table with add/edit/remove]
[Screenshot 5: Optional AI recommendations panel with `Generate suggestions` button]

---

## Links

- GitHub: https://github.com/kennethlaw325/vaultmind
- Issue tracker: https://github.com/kennethlaw325/vaultmind/issues
- Latest release: https://github.com/kennethlaw325/vaultmind/releases/latest
- License: MIT

---

## Feedback wanted

This is v0.2.1 and I'd genuinely like to hear from people running larger or differently-organized vaults:

- What lint rule is missing? (Empty notes? Untagged notes? Notes with only a title?)
- Are the default per-folder patterns reasonable for non-PARA layouts?
- Where does the health score feel wrong — too forgiving, too punishing, weighted oddly?
- Is the AI integration valuable or noise?

Bug reports and feature requests on the GitHub tracker are best, but I'll watch this thread too.

Thanks to the Obsidian team for maintaining the community plugin ecosystem and to everyone who tested early builds.
