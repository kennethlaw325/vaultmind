# OG Image — VaultMind

`og-image.svg` is a 1200×630 mock for the landing-page Open Graph / Twitter card.

## Why a mock + not a final PNG?

VaultMind has no formal brand kit yet. TechPulse HK's amber-on-near-black palette is intentionally **not** reused — the plugin needs its own visual identity. The current mock uses:

- Background: deep navy → violet gradient (`#0F1024` → `#2A1A5E`)
- Accent: violet (`#7C5CFF` / `#A78BFA`) — Obsidian-adjacent without copying it
- Typeface: system UI sans-serif for display, JetBrains Mono for meta — readable at the small Twitter-card crop
- Stat callout: the v0.2.0 real-vault numbers (`20 → 46/100`, `615 → 231 issues`) match the README claim verbatim

If Kenneth later commissions a logomark, swap the `<text>VaultMind</text>` element for an `<image>` reference.

## Render to PNG

Pick whichever tool is already installed:

```bash
# Option A — sharp-cli (cross-platform, npm)
npx sharp-cli -i og-image.svg -o og-image.png --width 1200 --height 630

# Option B — rsvg-convert (lightweight CLI)
rsvg-convert og-image.svg -w 1200 -h 630 -o og-image.png

# Option C — Inkscape
inkscape og-image.svg --export-type=png --export-filename=og-image.png -w 1200 -h 630
```

Verify the output is exactly **1200×630**. Twitter / LinkedIn / Threads all derive their card preview from this aspect ratio.

## Usage

Drop the rendered PNG at `/og-image.png` on the landing page domain and reference it in `<head>`:

```html
<meta property="og:image" content="https://vaultmind.dev/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://vaultmind.dev/og-image.png" />
```

## Validation

After deploy, paste the live URL into:
- https://www.opengraph.xyz/
- https://cards-dev.twitter.com/validator (legacy, may still work)
- https://www.linkedin.com/post-inspector/
