# Reddit r/ObsidianMD post drafts

Three hook variants for the VaultMind launch. Pick one based on which angle feels most authentic the day you post. **Do not post all three.** Reddit's spam filters and the subreddit moderators will notice.

**Self-promotion disclosure:** r/ObsidianMD allows plugin announcements but expects a clear `[Plugin]` flair (or similar — confirm current rules before posting) and an honest disclosure that you built it. Each draft below includes that disclosure inline.

**Posting checklist before you hit submit:**
- [ ] Plugin is approved and live in Community Plugins (Settings → Browse)
- [ ] Subreddit rules re-read (rules change; the last thing you want is a removal)
- [ ] Flair set correctly (likely `Plugin` or `Showcase`)
- [ ] Screenshots uploaded as a Reddit gallery (don't link to imgur if avoidable)
- [ ] First comment ready with the GitHub link (top-level link can look spammy)
- [ ] You're around for the next 4–6 hours to answer questions

---

## Variant A — Show-and-tell

**Title:** I built a plugin that audits your vault — orphan notes, broken wikilinks, stale notes, missing folder overviews

**Body:**

Hey r/ObsidianMD,

Builder here. I just got VaultMind approved as a community plugin and wanted to share what it does in case it's useful to anyone else with a vault that's grown messy over time.

**What it checks**

VaultMind scans your vault and gives you a health score (0–100) across four dimensions:

- **Consistency** — broken `[[wikilinks]]` pointing to notes that don't exist
- **Connectivity** — orphan notes with no inbound links
- **Freshness** — notes that haven't been touched in a long time (configurable per folder)
- **Completeness** — folders with 3+ notes but no `_index.md` overview

Each issue is clickable — jump straight to the source note. Broken links also get an offline fuzzy-match suggestion: "Did you mean `[[Project Alpha]]` (78% match)?"

**Why I built it**

My own vault was at 700+ notes and I'd lost track of what was where. I'd open a daily note, write a wikilink to a project, and only find out months later that the link was broken because I'd renamed the project. Multiply that by a year of daily notes and you get a slow-rotting vault.

I tried treating it manually — searching for `[[` and eyeballing — and it didn't scale. So I built a linter.

**Screenshots**

[Screenshot 1: Status bar showing `VaultMind: 46/100 | 231 issues`]
[Screenshot 2: Results modal grouped by category with severity badges]
[Screenshot 3: Broken link with fuzzy match suggestion inline]
[Screenshot 4: Settings panel with per-folder rule overrides]

**What it actually moved on my own vault**

Going from v0.1.0 to v0.2.1 plus tuning the defaults to my PARA-ish layout took my health score from 20/100 to 46/100, and the issue count from 615 down to 231. A lot of that was excluding Daily Reviews and Archive from staleness checks (they're auto-generated / intentionally cold). Your numbers will obviously vary — the point is the score moves when you actually fix things, not when you change the rules.

**Privacy / cost**

- Zero config to use — works fully offline.
- AI suggestions are optional, opt-in, and only fire when you click "Generate suggestions" in the results modal. Uses your own Anthropic API key. Typical cost: under $0.01 for a 30-issue run.
- No telemetry, no background calls, no analytics.

**Disclosure:** I'm the author. Source is MIT, code is on GitHub (link in first comment). Genuinely open to feedback — what would you want a vault linter to catch that this doesn't?

---

## Variant B — Pain-driven

**Title:** My vault had 200+ orphan notes and broken wikilinks I'd forgotten about — built a plugin to surface them

**Body:**

A confession: I have a 700+ note Obsidian vault and until recently I had no idea how broken it was.

Then I ran a quick audit script over it and the numbers were ugly:

- 84 orphan notes (nothing linked to them)
- 47 broken wikilinks (the target was renamed or deleted)
- ~300 notes flagged "stale" (untouched for 14+ days — though most of those were Archive / Daily Reviews, which is fine)
- ~12 folders with 5+ notes and no `_index.md` to navigate

The problem isn't that any single one of these is bad. The problem is they accumulate silently. You don't notice the broken `[[Project Alpha]]` link until you click it in 6 months and Obsidian creates a blank stub. By then you can't even remember what Project Alpha was.

So I built **VaultMind**, a plugin that runs that audit in-vault and gives you a health score plus a clickable list of every issue.

**The four lint rules**

1. **Broken links** — flagged as `critical`. Includes a fuzzy-match suggestion ("Did you mean...?") so you can fix in one click instead of remembering what the link was supposed to point to.
2. **Orphans** — `warning`. Some orphans are legitimate entry notes (your MOC, your inbox), so v0.2 softened the orphan penalty by 25% and lets you exclude folders.
3. **Stale notes** — `info`. Per-folder thresholds because "30 days without a touch" means very different things in `10 - Projects` vs `99 - Archive`.
4. **Missing overview** — `warning`. Auto-generates a paste-ready `_index.md` template listing the folder's most-linked notes.

**It's free, MIT, no cloud**

Default offline. AI recommendations are optional (BYOK Anthropic key, runs only when you click the button, costs pennies). No telemetry.

[Screenshot: results modal showing all four issue categories grouped]
[Screenshot: broken link with fuzzy suggestion expanded]
[Screenshot: per-folder override settings panel]

**What it changed for me**

Health score went from 20 → 46 after I tuned the per-folder rules and fixed the worst broken links. More importantly: I now know my vault is rotten in specific spots, instead of vaguely feeling guilty about it.

**Disclosure:** I built it. Plugin ID is `vaultmind` in Community Plugins. GitHub source in first comment. Curious what other failure modes people see in their own vaults — what would you add to the lint rules?

---

## Variant C — Builder story

**Title:** 3 weeks from idea to community plugin — what I learned shipping VaultMind to the Obsidian directory

**Body:**

Quick builder retrospective in case it's useful to others thinking about shipping a plugin.

**The idea (week 0)**

My vault was at 700+ notes and I'd lost the ability to feel whether it was healthy. I wanted a number — like a credit score for a vault — plus a list of specific things to fix. I checked the existing plugins, didn't find quite this combination, decided to build it myself.

**Week 1 — v0.1.0 scaffold**

Four lint rules, one health score. Architecture decision that paid off immediately: split `src/core/` (pure TypeScript, no Obsidian imports) from `src/adapters/` (the bridge). That meant 23 unit tests in Jest with zero Obsidian mocking — the core only sees a list of `{path, content, links, mtime}` objects.

What didn't go well in v0.1: the default 14-day staleness threshold flagged ~300 notes on my vault, most of them legitimate (Daily Reviews, Archive, reference material). The first health score I got was 20/100. Demoralizing, mostly because the ruleset was wrong, not the vault.

**Week 2 — v0.2.0 listening to my own data**

Added per-folder configs so each folder could have its own staleness rules or be excluded entirely. Defaults were calibrated to a PARA-ish layout: Archive disables staleness checks, Daily Reviews / Lint Reports / Templates are excluded, Projects uses 30 days, everything else uses 60.

Also added an offline fuzzy matcher for broken links (Levenshtein + token overlap, top 3 candidates) and a paste-ready `_index.md` generator for missing overviews. Both fully offline. Then layered on optional AI recommendations via Anthropic — opt-in, BYOK, button-triggered, no background calls.

Test count went 23 → 67. Bundle went 8.7 KB → 20.3 KB.

After tuning: health score on my own vault went from 20 → 46. Total issues 615 → 231. Most of the reduction came from excluding the folders that were never the problem.

**Week 3 — submission**

Dropped the PR into `obsidianmd/obsidian-releases`. ObsidianReviewBot caught two minor issues on the first pass (took those seriously — they reflect taste, not just compliance). Currently labelled "Ready for review" and waiting for human approval.

**Things I'd tell past-me**

- **Don't trust your default thresholds until you've run them on a real vault.** v0.1's 14-day staleness was reasonable in a vacuum and wrong in practice.
- **Per-folder config is non-negotiable for vault tools.** A vault is not one thing; treating it as one is the whole problem.
- **A 5-minimum floor per dimension matters psychologically.** A first-run score of 0/25 makes people uninstall. 5/25 says "we see you, here's where to improve."
- **Pure-core / adapter split is worth the upfront cost.** 67 Jest tests run in <2 seconds with no Obsidian mocking.

[Screenshot: status bar score]
[Screenshot: results modal grouped by severity]
[Screenshot: per-folder rules table in settings]

**Disclosure:** plugin is `vaultmind`, MIT, source on GitHub (first comment). Happy to answer questions about the build, the architecture decisions, or why specific defaults are what they are.

---

## First-comment template (use under whichever variant you post)

> GitHub: https://github.com/kennethlaw325/vaultmind
>
> If the plugin doesn't show up in Community Plugins yet, it's still in the approval queue. Manual install instructions are in the README until then.
>
> Bug reports, feature requests, "this rule should also catch X" — all welcome on the issue tracker.
