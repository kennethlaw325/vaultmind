# VaultMind Examples

Three sanitized mini-vaults that demonstrate each VaultMind lint rule in isolation. Drop any of these folders into an Obsidian vault, run **VaultMind: Run Lint**, and you'll see exactly the issue described in the per-folder README.

| Example | Rule | Severity |
|---|---|---|
| [`orphan-rule/`](orphan-rule/) | Notes with no inbound links | `warning` |
| [`staleness-rule/`](staleness-rule/) | Notes older than the threshold | `info` |
| [`missing-overview/`](missing-overview/) | Project folders without `_index.md` | `warning` |

These exist primarily for documentation and promo screenshots. They are intentionally tiny (~3–5 notes each) so the lint output stays readable.

## Notes

- The `README.md` file inside each example is meta — it explains the setup but is not part of the demonstration. In a real vault you would delete it after copying.
- The fourth lint rule (broken links — `severity: critical`) is implicit in the orphan and overview examples (try wiring `[[Nonexistent Note]]` into any of them to see it fire).
- Health score for each tiny example will be a low number — that's expected; the score is a percentage of *possible* deductions, and these vaults are deliberately small + flawed.
