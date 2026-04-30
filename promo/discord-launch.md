# Discord launch announcements

Short, direct, one image. Different tone per server. **Read each server's #self-promo or #show-and-tell rules before posting** — most communities require posting in a specific channel and disallow multi-server cross-posting in the same hour.

**Image to attach:** the results-modal screenshot (clearest single visual). Filename: `vaultmind-results-modal.png`. Specs in `promo-checklist.md`.

---

## Version A — r/ObsidianMD Discord (#showcase or #plugin-dev)

**Tone:** community-native, low-key, builder-to-builder.

> Hey folks — just got VaultMind approved as a community plugin and wanted to share in case it's useful here.
>
> It's a vault linter: scans for orphan notes, broken `[[wikilinks]]`, stale content, and folders missing an overview, then gives you a 0–100 health score with a clickable issue list.
>
> Fully offline by default. Optional Anthropic AI layer is opt-in and BYOK (typical run <$0.01). 67 tests, 20 KB bundle, MIT.
>
> On my own 700+ note vault: 20 → 46 health score after tuning + fixes. Issue count 615 → 231.
>
> Search "VaultMind" in Community Plugins, or grab the source: <https://github.com/kennethlaw325/vaultmind>
>
> Genuinely curious what lint rule you'd want that this doesn't catch yet.
>
> [attach: vaultmind-results-modal.png]

---

## Version B — General AI / dev Discord (#projects or #show-your-work)

**Tone:** technical, framing the build for a non-Obsidian-native audience.

> Shipped VaultMind today — a community plugin for Obsidian (the markdown notes app) that audits your vault for structural rot.
>
> What it scans:
> • Broken wikilinks (with fuzzy-match "did you mean" suggestions, fully offline)
> • Orphan notes (no inbound links)
> • Staleness (per-folder thresholds, not one global rule)
> • Folders missing an `_index.md` overview (auto-generates a paste-ready template)
>
> Architecture: pure-TS core (zero Obsidian deps, 67 Jest tests) + adapter layer + Obsidian UI. Single 20 KB esbuild bundle.
>
> Optional Claude Haiku 4.5 layer for richer suggestions — opt-in, BYOK, button-triggered, no background calls. Typical 30-issue run is under $0.01.
>
> Public + MIT: <https://github.com/kennethlaw325/vaultmind>
>
> Happy to talk about the architecture decisions if anyone's building plugins themselves.
>
> [attach: vaultmind-results-modal.png]

---

## Version C — Smaller HK / Cantonese tech Discord (if relevant)

**Tone:** 粵語語感，輕鬆，唔 hype。

> 整咗個 Obsidian plugin 叫 VaultMind，啱啱被 Obsidian community plugin directory 收咗。
>
> 簡單講：掃你個 vault，搵出 broken `[[wikilink]]`、orphan note、太耐冇 update 嘅 stale note、同埋冇 `_index.md` 嘅 folder，畀你一個 0–100 嘅健康分。
>
> 預設 offline，唔需要 API key。如果想要更深入嘅 suggestion，可以 plug 自己嘅 Anthropic key（30 條 issue 跑一次唔使 $0.01）。
>
> 我自己 700+ note vault：20 → 46 分，issue 615 → 231。
>
> Source：<https://github.com/kennethlaw325/vaultmind>
>
> 如果有人都 maintain 緊大型 vault 歡迎試 + feedback。
>
> [attach: vaultmind-results-modal.png]

---

## Posting cadence

- Don't post all three within the same hour. Reddit + X + one Discord on day 1, second Discord day 2, third Discord day 3+.
- Reply to questions within 4–6 hours of posting in each server.
- If a moderator asks you to move the post to a different channel, do it without arguing.
