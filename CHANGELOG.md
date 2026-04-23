# Changelog

All notable changes to VaultMind will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-04-23

### Added
- **Per-folder configs** — each folder can have its own staleness rules or be excluded entirely. Defaults: Archive disables staleness checks, Daily Reviews / Lint Reports / Templates are excluded, Projects uses a 30-day threshold, everything else uses 60 days.
- **Offline fuzzy-match suggestions** for broken links. Uses Levenshtein + token overlap to surface the top 3 likely-intended notes, inline in the results modal. Zero config, zero API calls.
- **Offline overview template generator** for folders flagged as missing an `_index.md`. Lists representative notes ranked by inbound link count, ready to paste.
- **Optional AI recommendations** via Anthropic API. Users who supply an API key get richer per-issue suggestions for broken links and missing overviews. Default model is `claude-haiku-4-5-20251001`; a typical 30-issue run costs under $0.01. Calls are on-demand from the results modal — no background API usage.
- **Severity field** on lint issues — `critical` (broken links), `warning` (orphans, missing overviews), `info` (stale).
- **Per-folder overrides UI** in the Settings tab (add / edit / remove / reset).

### Changed
- Global staleness threshold default raised from **14 → 60 days** — more realistic for reference-heavy knowledge vaults.
- Health score minimum floor per dimension is now **5/25** instead of 0 — avoids the demoralizing all-zero score on a first run.
- Penalty multipliers rebalanced by severity:
  - Broken-link deduction accelerated (critical).
  - Orphan deduction softened by ~25% (many are legitimate entry notes).
  - Stale deduction softened by ~33% (often legitimate reference material).
- Broken-link detector emits `severity: "critical"` (was `"error"`).
- Results modal shows inline suggestions per issue; AI suggestions appear above offline ones when available.

### Infrastructure
- New test suites: `folder-config.test.ts`, `fuzzy-matcher.test.ts`, `ai-recommender.test.ts`.
- Total test count: 23 → **67** (+44).
- Bundle size: 8.7 KB → 20.3 KB.

### Real-vault validation
Scan on a 700+ note Obsidian vault:

| Metric | v0.1.0 | v0.2.0 |
|--------|-------:|-------:|
| Health score | 20/100 | 46/100 |
| Total issues | 615 | 231 |
| Freshness dimension | 0/25 | 22/25 |

Issue reduction driven primarily by excluding auto-generated Daily Reviews and Archive from staleness checks, where they caused false-positive noise.

---

## [0.1.0] — 2026-04-05

### Added
- Initial plugin scaffold with four lint rules: orphans, broken links, stale notes (14-day default), missing overview notes.
- Health score across 4 dimensions: Consistency, Connectivity, Freshness, Completeness.
- Results modal with clickable links back to source notes.
- Status-bar integration showing the last score and issue count.
- Settings for staleness threshold, auto-scan on startup, status-bar toggle, and exclude folders.
- Chunked scanning (200 notes per chunk) for large vaults.
- 23 unit tests covering the four core detectors and scorer.

[0.2.0]: https://github.com/kennethlaw325/vaultmind/releases/tag/v0.2.0
[0.1.0]: https://github.com/kennethlaw325/vaultmind/releases/tag/v0.1.0
