# VaultMind Phase 2 promo asset checklist

All visual + supporting assets needed before any of the launch channels go live. Status options: `todo` / `in progress` / `done` / `not needed`.

Working folder for assets: `C:\Users\Kenneth\Claude\vaultmind\promo\assets\` (create when first asset is captured).

---

## Screenshots (PNG, 2x retina)

| # | Asset | Filename | Spec | Where used | Status |
|---|---|---|---|---|---|
| S1 | Status bar showing health score | `vaultmind-statusbar.png` | 1200×120 (crop tight to status bar), 2x | Reddit, Forum, Landing, X tweet 1 | todo |
| S2 | Results modal — all 4 issue categories grouped, severity badges visible | `vaultmind-results-modal.png` | 1600×1200, 2x, light theme | All channels (hero shot) | todo |
| S3 | Broken link issue expanded with fuzzy-match "Did you mean..." inline | `vaultmind-fuzzy-suggestion.png` | 1600×900, 2x, light theme | Reddit B, Forum, Landing, X tweet 4 | todo |
| S4 | Settings tab — per-folder overrides table with add/edit/remove | `vaultmind-settings-folders.png` | 1600×1200, 2x, light theme | Reddit C, Forum, Landing, X tweet 5 | todo |
| S5 | AI recommendation panel with "Generate suggestions" button + AI suggestion expanded | `vaultmind-ai-suggestion.png` | 1600×900, 2x, light theme | Forum, Landing, X tweet 6 | todo |
| S6 | Score-improvement before/after split (20/100 vs 46/100) | `vaultmind-before-after.png` | 1600×800, side-by-side composite | Landing, X tweet 7 | todo |
| S7 | Dark-theme variant of S2 (results modal) | `vaultmind-results-modal-dark.png` | 1600×1200, 2x, dark theme | Forum (alt), Discord embed | todo |

**Capture notes:**
- Use a clean test vault (the included `test-vault/` works) so PII doesn't leak.
- Hide your real folder names if recording on a real vault — rename to generic equivalents.
- Light theme for all marketing shots; dark theme as alt only.
- Compress with `pngcrush` or similar before publishing — target <300 KB each.

---

## Animated GIFs / MP4s

| # | Asset | Filename | Spec | Where used | Status |
|---|---|---|---|---|---|
| G1 | Run lint flow: Cmd+P → "Run Lint" → status bar updates → modal opens | `vaultmind-runlint.gif` | 800×500, 6–8 seconds, looped, <2 MB | X tweet 1 (hero), Landing hero | todo |
| G2 | Score climbing as issues are resolved (sped-up demo) | `vaultmind-score-climb.gif` | 600×120 (status bar only), 4 seconds | Landing feature card 2 | todo |
| G3 | Results modal scrolling through all 4 issue categories | `vaultmind-modal-scroll.gif` | 800×600, 5 seconds | Landing feature card 1 | todo |

**Capture tool:** ScreenToGif (Windows) or LICEcap. Export at 15 fps to keep file size down. If file size exceeds 2 MB, convert to MP4 + autoplay-muted on landing page.

---

## Brand / icon assets

| # | Asset | Filename | Spec | Where used | Status |
|---|---|---|---|---|---|
| B1 | Plugin logo (square) | `vaultmind-logo.svg` | SVG, scalable | All channels | todo |
| B2 | Plugin logo (raster fallback) | `vaultmind-logo-512.png` | 512×512 PNG, transparent | Discord avatar, X profile use | todo |
| B3 | Favicon | `favicon.ico` + `favicon.svg` | 32×32 ICO + SVG | Landing page | todo |
| B4 | OG image (social share preview) | `og-image.png` | 1200×630 PNG, includes "VaultMind — vault health checker" + sample score | Landing `<meta og:image>` | todo |
| B5 | Twitter / X header | `x-header.png` | 1500×500 | Optional, profile refresh | not needed |

**Logo direction:** keep it boring. A vault icon (filing cabinet / safe-door / brain-in-a-box) with a check-mark or score gauge. Don't overdesign — this is a utility plugin, not a lifestyle brand. If unsure, pull a clean Lucide / Tabler icon and use it as the lockup.

---

## Copy / text assets (already drafted in this folder)

| File | Status |
|---|---|
| `reddit-r-obsidianmd.md` (3 hook variants) | drafted |
| `obsidian-forum-announce.md` | drafted |
| `landing-page-copy.md` | drafted |
| `x-launch-thread.md` (EN + 中文) | drafted |
| `discord-launch.md` (3 server variants) | drafted |
| `promo-checklist.md` (this file) | drafted |

---

## Pre-launch verification

- [ ] PR #12375 has been approved by the Obsidian team
- [ ] Plugin is searchable as "VaultMind" in Community Plugins
- [ ] Latest GitHub release tag `v0.2.1` is published with `main.js`, `manifest.json`, `styles.css` attached
- [ ] README install instructions tested on a fresh vault by someone who isn't you
- [ ] Issue tracker is enabled and a "report a bug" template exists
- [ ] All screenshots captured from the **approved + installed** version (not a dev build)
- [ ] OG image renders correctly on Twitter/X card validator and Slack/Discord link previews

---

## Launch sequence (suggested, once approval lands)

| Day | Channel | Asset |
|---|---|---|
| 0 (approval day) | Obsidian Forum announce post | Forum copy + S1, S2, S3, S4, S5 |
| +1 | Reddit r/ObsidianMD (pick one variant) | Reddit copy + S1, S2, S3, S4 |
| +1 | X launch thread (EN) | X copy + G1, S3, S4, S5, S6 |
| +2 | X 中文 thread | 中文 copy + same visuals |
| +2 | r/ObsidianMD Discord | Version A + S2 |
| +3 | AI / dev Discord | Version B + S2 |
| +4 onwards | Reply to questions, watch issue tracker |

Don't fire all channels at once. Stagger so feedback from each can inform the next.

---

## Post-launch monitoring

- [ ] GitHub Stars, Issues, PRs — daily check first week
- [ ] Reddit post karma + comments — reply within 4–6 hours
- [ ] Forum thread replies — reply within 24 hours
- [ ] X mentions / quote-tweets — engage where useful
- [ ] Search "VaultMind" weekly to catch off-channel mentions

---

## What this checklist deliberately does not include

- Press outreach (not at this scale; let organic adoption happen first)
- Paid ads (a free OSS utility plugin shouldn't run paid ads)
- Influencer / creator gifting (audience too niche; would feel forced)
- Email newsletter (no list; not the goal of Phase 2)

Phase 2 is about getting the plugin in front of people who actually use Obsidian. Phase 3 (if it happens) can think about broader reach.
