# X / Twitter launch thread — VaultMind

8 tweets. Hook → problem → 4 features → social proof → CTA. Use the EN version for the main launch tweet under @kennethlaw325 / TechPulse HK; the 中文 version is a parallel post for the HK / Cantonese audience.

**Posting notes:**
- Schedule for a Tue–Thu morning HKT (better dev-twitter overlap with US evening).
- Reply to your own tweets to build the thread (don't use disconnected posts).
- Add screenshots / GIFs to tweets 1, 4, 5, 6 (marked below).
- Pin tweet 1 for ~1 week.
- Final tweet ends with the GitHub link — keep it on the last tweet so the thread reads as value-first.

---

## English version

### 1/8 — Hook
Your Obsidian vault is rotting in places you can't see.

Broken wikilinks. Orphan notes nothing points to. Folders that lost their overview months ago.

I built VaultMind — a community plugin that finds them and gives you one health score from 0 to 100.

[GIF: status bar updates → modal opens with issues grouped]

### 2/8 — Problem
A 700-note vault grew over a year and I had no idea how broken it was.

Quick audit:
• 47 broken `[[wikilinks]]`
• 84 orphan notes
• 12 folders with 5+ notes, zero overview

You don't notice until you click a dead link 6 months later.

### 3/8 — Feature: Health score
VaultMind scans 4 dimensions, 25 points each:

✦ Consistency (broken links)
✦ Connectivity (orphans)
✦ Freshness (staleness)
✦ Completeness (missing overviews)

Total: 0–100. With a 5-pt floor per dimension so first runs don't demoralize.

### 4/8 — Feature: Inline suggestions
Every issue is clickable + comes with an offline suggestion:

• Broken link → "Did you mean `[[Project Alpha]]` (78% match)?" via fuzzy matcher
• Missing overview → paste-ready `_index.md` template listing top notes

No API key needed.

[Screenshot: broken link with fuzzy suggestion expanded]

### 5/8 — Feature: Per-folder configs
A vault is not one thing.

Archive, Daily Reviews, Templates, active Projects all need different staleness rules. VaultMind ships defaults calibrated for a PARA-ish layout, and you can layer your own — longest pattern wins.

[Screenshot: per-folder overrides table in settings]

### 6/8 — Feature: Optional AI
If you want richer suggestions, drop in your own Anthropic API key.

• Opt-in only, button-triggered
• Default model: Claude Haiku 4.5
• Typical 30-issue run: under $0.01
• Zero background calls, zero telemetry

Offline always works without it.

[Screenshot: AI suggestion inline with `✦ AI:` prefix]

### 7/8 — What it actually moved
On my own 700+ note vault, tuning per-folder rules + fixing the worst broken links:

Health score: 20 → 46
Total issues: 615 → 231
Freshness dimension: 0/25 → 22/25

The score moves when you fix things. Not when you mute rules.

### 8/8 — CTA
VaultMind is live: search "VaultMind" in Obsidian Community Plugins.

Free. Open source. MIT. Single 20 KB bundle. 67 tests.

Source + issues: github.com/kennethlaw325/vaultmind

If you run a larger vault or non-PARA layout, I'd love to hear which lint rule is missing.

---

## 中文版本（粵語語感 / 繁體）

### 1/8 — Hook
你個 Obsidian vault 其實爛緊，但你睇唔到。

Broken wikilink、orphan notes、無人 link 嘅孤兒、folder 冇 overview——日積月累。

我整咗個 plugin 叫 VaultMind，幫你掃晒呢啲問題，畀你一個 0–100 分嘅 vault 健康分。

[GIF: status bar 更新 + 結果 modal 彈出]

### 2/8 — Problem
我自己個 vault 700+ 篇 note，行咗一年，唔知爛成點。

跑咗一次 audit：
• 47 條斷咗嘅 `[[wikilink]]`
• 84 篇冇人 link 嘅 orphan
• 12 個 folder 5+ 篇 note 但完全冇 `_index.md`

你唔會發現，直到 6 個月後撳個 dead link。

### 3/8 — Feature：健康分
VaultMind 掃 4 個維度，每個 25 分：

✦ 一致性（broken link）
✦ 連結性（orphan）
✦ 新鮮度（staleness）
✦ 完整性（missing overview）

總分 0–100。每個維度有 5 分底限，第一次跑唔會直接 0 分嚇死你。

### 4/8 — Feature：內嵌建議
每個 issue 撳得入去，仲附 offline suggestion：

• Broken link → 「係咪 `[[Project Alpha]]`（78% match）？」用 fuzzy matcher
• Missing overview → 直接生成 `_index.md` template，list 出 folder 入面最多 link 嘅 note

唔使任何 API key。

[Screenshot]

### 5/8 — Feature：每 folder 自訂規則
Vault 唔係單一嘢。

Archive、Daily Reviews、Templates、活躍 Projects 各有各嘅 staleness 規則。VaultMind 出廠 default 跟 PARA 風 layout，你可以加自己嘅 rule，最長 match 贏。

[Screenshot]

### 6/8 — Feature：選用 AI
想要更深入嘅 suggestion？放你自己嘅 Anthropic API key 入去。

• Opt-in，要撳掣先 fire
• 預設用 Claude Haiku 4.5
• 30 條 issue 一次跑：唔使 $0.01 美金
• 完全冇 background call，冇 telemetry

唔放 key 都照用，offline mode 永遠 work。

[Screenshot]

### 7/8 — 實際幫我改善咗幾多
我自己個 700+ note vault，tune 完 per-folder rule + 執走最爛嘅 broken link：

健康分：20 → 46
總 issue：615 → 231
Freshness 維度：0/25 → 22/25

分數係執嘢時先升，唔係靜音 rule 時。

### 8/8 — CTA
VaultMind 上架啦：Obsidian Community Plugins 入面 search「VaultMind」。

免費、open source、MIT、20 KB bundle、67 個 test。

Source + issue tracker：github.com/kennethlaw325/vaultmind

如果你 vault 更大或者唔係 PARA 結構，最想聽你覺得仲缺咩 lint rule。
