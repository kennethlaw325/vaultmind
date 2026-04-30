# VaultMind landing page copy

Refresh / source-of-truth copy for the VaultMind landing page. Drop into your existing template (Astro / Next / plain HTML — same copy works). All claims here are honest and verifiable from the README, CHANGELOG, and real-vault numbers.

---

## Hero

**Headline (H1):**
Know how healthy your Obsidian vault actually is.

**Sub-head:**
VaultMind scans your vault for orphan notes, broken wikilinks, stale content, and missing folder overviews — then gives you one number from 0 to 100 and a clickable list of every issue.

**Primary CTA button:**
Install from Community Plugins

**Secondary CTA link:**
View on GitHub →

**Hero visual placeholder:**
[Animated GIF: Cmd+P → "VaultMind: Run Lint" → status bar updates `46/100 | 231 issues` → modal opens grouped by category. ~6 seconds, looped.]

---

## Problem statement (3 sentences)

Your vault grows. Notes get renamed, projects fade out, folders pile up — and every silent broken `[[wikilink]]` is a future you who clicks a dead reference and wonders what it was supposed to point to. VaultMind finds those before you do.

---

## Feature highlights (4 cards)

### 1. Four lint rules out of the box

- **Broken wikilinks** — links pointing to notes that don't exist (severity: critical)
- **Orphan notes** — notes with no inbound links (severity: warning)
- **Stale content** — notes untouched beyond a per-folder threshold (severity: info)
- **Missing overviews** — folders with 3+ notes but no `_index.md` (severity: warning)

[GIF placeholder: results modal scrolling through all four issue categories]

### 2. One number: 0–100 health score

Four dimensions, 25 points each, with a 5-point floor per dimension so your first run isn't demoralizing. The score moves when you actually fix things — not when you mute the rules. On a real 700+ note vault, tuning + fixing took the score from 20 → 46.

[GIF placeholder: status bar score climbing as issues get resolved]

### 3. Per-folder configs that match how you actually organize

A vault is not one thing. Archive, Daily Reviews, Templates, and active Projects all need different staleness rules — or none at all. Default rules ship calibrated to a PARA-ish layout, and the longest-matching pattern wins so you can layer specific overrides on top of broad ones.

[Screenshot placeholder: per-folder overrides table in settings]

### 4. Optional AI recommendations (BYOK, opt-in)

Default mode is fully offline — fuzzy matcher for broken links, auto-generated `_index.md` templates for missing overviews. If you want richer suggestions, drop in your own Anthropic API key. Calls are explicit (button click), use Claude Haiku 4.5 by default, and a typical 30-issue run costs under $0.01. No background calls. No telemetry.

[Screenshot placeholder: AI recommendation expanded inline with green `✨ AI:` prefix]

---

## How it works (3 steps)

1. **Install** — One click from Obsidian Community Plugins, or copy three files into `.obsidian/plugins/vaultmind/`.
2. **Run** — `Cmd+P → VaultMind: Run Lint`. Auto-scan on startup is on by default.
3. **Fix** — Click any issue in the results modal to jump to the source note. Apply the inline suggestion. Re-run.

---

## Technical specs (one-liner row)

`20 KB bundle` · `67 unit tests` · `Desktop only` · `Obsidian 1.5.0+` · `Single main.js` · `Zero telemetry` · `MIT licensed`

---

## Pricing

**Free. Forever. Open source.**

VaultMind is MIT licensed and will stay that way. There is no paid tier, no subscription, no telemetry, no upsell. The optional AI layer uses your own Anthropic API key — you pay Anthropic directly (under $0.01 for a typical run), nothing routes through us.

[CTA button: Install from Community Plugins]
[Secondary: Star on GitHub]

---

## FAQ

**Does VaultMind send anything to a server?**
No. Default mode is fully offline. The optional AI layer makes a direct call from your machine to Anthropic's API using your own key, and only when you click "Generate suggestions." There is no VaultMind server.

**Will it slow down my vault?**
The scan chunks at 200 notes per yield, so even on a 700+ note vault the UI stays responsive. Auto-scan runs on startup once and on demand thereafter.

**Does it modify my notes?**
No. VaultMind only reads. Fixes are suggestions you apply yourself.

**Why desktop only?**
Vault-wide scans are friendlier on desktop. Mobile support is on the roadmap if there's demand.

**What if the rules don't fit my vault?**
That's expected. Use per-folder overrides to exclude folders or change staleness thresholds. The defaults reflect a PARA-ish layout — your vault is your vault.

---

## Footer

| Resources | Community |
|---|---|
| [Documentation (README)](https://github.com/kennethlaw325/vaultmind#readme) | [Obsidian Forum thread](#) |
| [Changelog](https://github.com/kennethlaw325/vaultmind/blob/main/CHANGELOG.md) | [GitHub issues](https://github.com/kennethlaw325/vaultmind/issues) |
| [Latest release](https://github.com/kennethlaw325/vaultmind/releases/latest) | [r/ObsidianMD post](#) |
| [MIT License](https://github.com/kennethlaw325/vaultmind/blob/main/LICENSE) | [Built by Kenneth Law](https://github.com/kennethlaw325) |

---

## Meta tags (drop into `<head>`)

```html
<title>VaultMind — Obsidian vault health checker</title>
<meta name="description" content="Find orphan notes, broken wikilinks, stale content, and missing overviews in your Obsidian vault. One health score, clickable issue list, fully offline. Free, open source, MIT.">
<meta property="og:title" content="VaultMind — Know how healthy your Obsidian vault actually is.">
<meta property="og:description" content="Vault linter for Obsidian. Four rules, one health score, per-folder configs, optional BYOK AI. Free + MIT.">
<meta property="og:image" content="/og-image.png">
<meta property="og:url" content="https://vaultmind.dev/">
<meta name="twitter:card" content="summary_large_image">
```
