# Example: Missing Overview Rule

This mini-vault demonstrates the **missing-overview detector** in VaultMind.

A *project folder* with 2 or more notes but no `_index.md` / `Overview.md` / `Index.md` file gets flagged. The idea: if a folder is big enough to be a project, you should have one note that summarizes what's in it.

## Files in this example

```
missing-overview/
├── README.md                       (this file — meta, ignored by lint)
├── With Overview/
│   ├── _index.md                   ← satisfies the rule
│   ├── Note A.md
│   └── Note B.md
└── Without Overview/
    ├── Note X.md
    ├── Note Y.md
    └── Note Z.md                   ← no overview present — flagged
```

## Setup — register project folders

The detector only fires on folders you've registered as project folders. In `Settings → VaultMind`, add the two folders to the **Project folders** list (or use the per-folder rules to mark them as projects).

For this example, register:
- `missing-overview/With Overview`
- `missing-overview/Without Overview`

## Input (vault state)

- `With Overview/_index.md` exists with a summary of the folder. Detector matches by name (case-insensitive contains: `index`, `overview`, or exact `_index`), so `_index.md`, `Overview.md`, and `Folder Index.md` all satisfy it.
- `Without Overview/` has 3 content notes but no overview-shaped file.

## Expected lint output

```
Completeness: 1 folder missing an overview

  warning  No overview note in "missing-overview/Without Overview"
           missing-overview/Without Overview
           Folder "missing-overview/Without Overview" has 3 notes but
           no overview or index file.
```

`With Overview/` is not flagged — it has `_index.md`.

## Suggestion: paste-ready overview template

Click the issue in the results modal and VaultMind ships an offline-generated template you can paste straight into a new `_index.md`. The template lists the top notes in the folder ranked by inbound link count, so the most-referenced notes surface first:

```markdown
# Without Overview — Overview

## Notes

- [[Note X]]
- [[Note Y]]
- [[Note Z]]

## Summary

(Add a 1–2 sentence summary of what this folder contains.)
```

If you have an Anthropic API key configured, the AI recommendation pass produces a richer per-folder summary informed by the actual note titles.

## Why 2-note minimum?

A folder with just one note is usually a category-of-one — a single reference, a recipe, a contact. Forcing an overview on those creates noise. The detector waits until a folder has 2+ notes before flagging.

(Older copies of the README mentioned a 3-note threshold; the implementation uses 2 — see `src/core/overview-checker.ts`. This example reflects the actual behavior.)
