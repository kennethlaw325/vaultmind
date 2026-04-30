# Example: Staleness Rule

This mini-vault demonstrates the **staleness detector** in VaultMind.

A note is flagged as *stale* when its file modification time (`mtime`) is older than the configured threshold. The default global threshold is **60 days**, but this example uses a **14-day** override to show how per-folder rules work — useful for evergreens or active project folders where you want a tighter signal.

## Files in this example

```
staleness-rule/
├── README.md             (this file — meta, ignored by lint)
├── Fresh Evergreen.md    ← mtime within last 14 days — OK
└── Stale Evergreen.md    ← mtime > 14 days old — flagged
```

## Setup — per-folder override

In `Settings → VaultMind → Per-folder overrides`, add a rule:

| Pattern | Exclude | Stale check | Days |
|---|---|---|---|
| `staleness-rule` | off | on | **14** |

This overrides the 60-day default for any note whose path starts with `staleness-rule/`.

## Input (vault state)

After copying this folder into a vault, set file mtimes to simulate the scenario:

- `Fresh Evergreen.md` — touch it now (mtime = today)
- `Stale Evergreen.md` — set mtime to **30 days ago** (older than the 14-day threshold)

On macOS / Linux:
```bash
touch -d "30 days ago" "Stale Evergreen.md"
```

On Windows PowerShell:
```powershell
(Get-Item "Stale Evergreen.md").LastWriteTime = (Get-Date).AddDays(-30)
```

## Expected lint output

```
Freshness: 1 stale note detected

  info  "Stale Evergreen" not modified in 30 days
        staleness-rule/Stale Evergreen.md
        Last modified 30 days ago (threshold: 14 days for "staleness-rule").
        Consider updating or archiving.
```

`Fresh Evergreen.md` is not flagged — its age (~0 days) is well under 14.

## What the detail line tells you

The detail line includes the matched pattern in quotes (`for "staleness-rule"`), so when you tune per-folder rules you can see exactly which override fired. If no override matches, the detail line just shows `(threshold: 60 days)` from the global default.

## Severity

Stale notes are `info` severity (lowest impact), reflecting that many stale notes are legitimate reference material. v0.2.0 reduced the staleness deduction by ~33% to account for this.

## When to use a tighter threshold

- **Active project folders** (`10 - Projects/`) — 30 days is the shipped default.
- **Daily journal review folders** — usually excluded entirely (`Stale check: off`).
- **Reference / Archive folders** — keep at the global 60-day default or disable.
