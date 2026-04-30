# Example: Orphan Rule

This mini-vault demonstrates the **orphan detector** in VaultMind.

An *orphan* is a note that no other note links to. Orphans are usually fine in moderation — but a vault full of them often signals notes you forgot to wire into your knowledge graph.

## Files in this example

```
orphan-rule/
├── README.md                  (this file — meta, ignored by lint)
├── Index.md                   ← entry note that links to "Connected Note"
├── Connected Note.md          ← receives a link from Index.md
├── Orphan Note.md             ← no inbound links — flagged
└── Another Orphan.md          ← no inbound links — flagged
```

## Input (vault state)

- `Index.md` body: `See [[Connected Note]] for details.`
- `Connected Note.md` body: standalone reference content
- `Orphan Note.md` body: standalone, never linked to
- `Another Orphan.md` body: standalone, never linked to

## Expected lint output

```
Connectivity: 2 orphan notes detected

  warning  "Orphan Note" has no inbound links
           orphan-rule/Orphan Note.md
           No other note links to this note. Consider linking it from
           a related note or archiving it.

  warning  "Another Orphan" has no inbound links
           orphan-rule/Another Orphan.md
           No other note links to this note. Consider linking it from
           a related note or archiving it.
```

`Index.md` and `Connected Note.md` are not flagged:
- `Index.md` is the linking root; orphans-of-the-root are expected entry points (in v0.2.0 the deduction is softened ~25% to reflect this).
- `Connected Note.md` has 1 inbound link from `Index.md`.

## How to reproduce

1. Copy this folder into any Obsidian vault.
2. Run **VaultMind: Run Lint**.
3. Filter the results modal by `type: orphan` or look for the `warning` severity rows.

## Suggestion shown inline

Each orphan issue ships with an actionable suggestion:

> No other note links to this note. Consider linking it from a related note or archiving it.

If you have an Anthropic API key configured, click **Generate suggestions** in the results modal for richer per-note recommendations (e.g. "Consider linking from `Index.md` under the Reference section").
