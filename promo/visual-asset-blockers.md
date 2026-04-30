# Visual Asset Blockers — VaultMind Promo

**Status:** Blocked on manual capture. Obsidian plugins run inside the live Obsidian Electron app, which the headless tooling here cannot launch with a vault loaded *and* the plugin enabled. Tried + ruled out:

- Pure DOM screenshot via Puppeteer/Playwright — no, the modal lives inside Obsidian's renderer process and depends on `app.vault` / `metadataCache` being initialized.
- Mocked HTML harness — possible in theory, but the result would be a fake screenshot rather than the actual UI; rejected because we want truthful promo material.
- xvfb + headless Electron — fragile and Obsidian's licensing makes auto-launch in CI awkward.

So Kenneth needs to capture these manually on his Obsidian desktop install. Below is exactly what to capture, with target dimensions and recommended OS theme per shot.

---

## Capture list (4 shots minimum)

### 1. Settings tab — 4 lint rules toggle

- **What to show:** `Settings → Community plugins → VaultMind` open, scrolled so all four rule toggles are visible (orphan, broken link, staleness, missing overview), plus the per-folder overrides table.
- **Recommended theme:** **Dark** — matches Obsidian's most common default and the surrounding app chrome reads cleaner.
- **Output path:** `promo/screenshots/settings-tab.png`
- **Target dimensions:** 1600×1000 (retina). Crop tightly to the settings pane — exclude the OS window chrome.
- **Why it matters:** This is the screenshot that proves "configurable per folder" and answers the most-asked promo question.

### 2. Status bar emoji + score

- **What to show:** Bottom status bar showing `VaultMind: 46/100 | 231 issues` after a fresh scan. Zoom or crop so the badge is readable.
- **Recommended theme:** **Dark** (matches shot #1, keeps the promo set visually consistent).
- **Output path:** `promo/screenshots/status-bar.png`
- **Target dimensions:** 800×120 (or larger; can be cropped down). Tight horizontal strip is fine.
- **Why it matters:** Demonstrates the "always-on" health signal — one of the unique selling points vs. running a one-shot CLI lint.

### 3. Lint result panel (modal)

- **What to show:** `VaultMind: Show Results` modal open, ideally on the real 700-note vault so the issue list is non-trivial. Show ≥1 broken-link issue (with fuzzy-match suggestion inline) and ≥1 missing-overview issue (with paste-ready template visible).
- **Recommended theme:** **Dark** (consistency).
- **Output path:** `promo/screenshots/lint-results-modal.png`
- **Target dimensions:** 1600×1000.
- **Why it matters:** This is the main "money shot" — shows the offline fuzzy matcher + AI suggestion stacking that v0.2.0 introduced.

### 4. Health score badge (close-up)

- **What to show:** The score header at the top of the results modal (`46/100` plus the four-dimension breakdown: Consistency, Connectivity, Freshness, Completeness). Crop tight.
- **Recommended theme:** **Dark** (consistency).
- **Output path:** `promo/screenshots/health-score-badge.png`
- **Target dimensions:** 1200×400.
- **Why it matters:** The dimension breakdown is a key differentiator — most vault tools give one global score, VaultMind gives four. Worth its own shot.

---

## Optional extra shots (nice-to-have, not required for v0.2.1 launch)

### 5. Light-theme variant of #3

- Same composition as the lint result panel, but with Obsidian set to its default Light theme.
- **Output path:** `promo/screenshots/lint-results-modal-light.png`
- **Target dimensions:** 1600×1000.
- **Why:** Lets the README and landing page show both themes side-by-side, signals theme-awareness.

### 6. Per-folder overrides table — empty state vs. populated state

- Two crops: one with default rules only, one with custom user rules added.
- **Output paths:** `promo/screenshots/overrides-default.png`, `promo/screenshots/overrides-custom.png`
- **Target dimensions:** 1200×800 each.
- **Why:** Demonstrates the v0.2.0 customization story for power users.

---

## Recording GIFs / video (Phase 2, after v0.2.1 approval)

Defer these until plugin is approved and the landing page is live.

| Asset | Tool | Length | Purpose |
|---|---|---|---|
| 10s scan loop | Cleanshot / Kap / Loom | 8–12s | Hero animation on landing page |
| 30s walkthrough | Cleanshot / OBS | 25–35s | Twitter / Threads launch post |

---

## Pre-capture checklist

Before Kenneth captures, do these so the screenshots feel real and don't leak personal data:

- [ ] Run a fresh **VaultMind: Run Lint** on the real 700+ note vault so the score is current.
- [ ] Confirm the score reads `46/100` and `231 issues` (matches README claim). If the live vault has drifted, either re-rec on a snapshot vault or update README + this doc together.
- [ ] Disable any other status-bar plugins that would clutter shot #2 (e.g. word counters).
- [ ] Pick one consistent accent / theme — recommended: default dark. Don't mix custom CSS snippets between shots.
- [ ] Blur or rename any note titles that contain client / private content before submitting.
- [ ] Save all PNGs at retina (2x) resolution; Obsidian's UI is mostly text and benefits from sharp scaling.

Once captures land in `promo/screenshots/`, this doc can be deleted or archived under `promo/archive/`.
