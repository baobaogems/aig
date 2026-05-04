# AIG Logo Assets

Brand logo files for ARC Invisible Gateway (AIG).

## Concept

- **Wordmark:** "AIG" in JetBrains Mono Bold + orange `#FF8400` accent dot
- **Icon mark:** Square frame containing orange dot — symbolizes the "invisible gateway" with value passing through
- **Dot meaning:** terminal cursor / continuation marker / payload passthrough — builder DNA

## Variants

| File | Use case |
|------|----------|
| `aig-wordmark-horizontal.svg` | Default wordmark on light backgrounds (`#F2F3F0` / white) |
| `aig-wordmark-darkmode.svg` | Wordmark on dark backgrounds (text becomes `#F2F3F0`) |
| `aig-wordmark-monochrome.svg` | Single-color contexts (print, single-color embroidery, fax) |
| `aig-icon-mark.svg` | Standalone icon — app icons, social avatars, Twitter/X profile |
| `aig-favicon.svg` | Heavier-stroke variant optimized for 16-32px browser favicons |

## PNG exports (`png/`)

Pre-rendered raster fallbacks at common sizes. Generated via `rsvg-convert` (librsvg).

| File | Size | Use |
|------|------|-----|
| `aig-wordmark-horizontal-800.png` | 800w | Web hero, README, slides |
| `aig-wordmark-darkmode-800.png` | 800w | Dark slide decks (rendered on `#0E0E0E`) |
| `aig-wordmark-monochrome-800.png` | 800w | Single-color contexts |
| `aig-icon-mark-512.png` / `-256.png` | 512 / 256 | App icons, social avatars |
| `aig-favicon-64.png` / `-32.png` / `-16.png` | 64 / 32 / 16 | Browser favicons |

## Color spec

- Text dark: `#111111`
- Text light (dark mode): `#F2F3F0`
- Accent dot: `#FF8400`
- Background safe zone: light `#F2F3F0`–`#FFFFFF`, dark `#0E0E0E`–`#111111`

## Typography spec

- Family: **JetBrains Mono Bold (700)**
- Fallback chain: `'JetBrains Mono', 'Menlo', 'Consolas', monospace`
- Letter-spacing: `-0.5` (slightly tightened)

## Re-render PNGs

```bash
# Requires librsvg installed: brew install librsvg
cd assets/brand/logo

rsvg-convert -w 800 aig-wordmark-horizontal.svg -o png/aig-wordmark-horizontal-800.png
rsvg-convert -w 800 -b "#0E0E0E" aig-wordmark-darkmode.svg -o png/aig-wordmark-darkmode-800.png
rsvg-convert -w 800 aig-wordmark-monochrome.svg -o png/aig-wordmark-monochrome-800.png
rsvg-convert -w 512 aig-icon-mark.svg -o png/aig-icon-mark-512.png
rsvg-convert -w 64 aig-favicon.svg -o png/aig-favicon-64.png
rsvg-convert -w 32 aig-favicon.svg -o png/aig-favicon-32.png
rsvg-convert -w 16 aig-favicon.svg -o png/aig-favicon-16.png
```

> **Note:** SVG `<text>` elements depend on the renderer having JetBrains Mono installed.
> For maximum portability (e.g., embedding in 3rd-party tools that lack the font),
> convert text to outlined paths via Inkscape (`Path → Object to Path`) before distribution.

## Usage rules

See `.claude/brand-guidelines.md` Section 2 (Visual Identity) and 2.4 (Logo Usage Rules) for:
- Clear space requirements
- Minimum sizes
- Approved color combinations
- What NOT to do (no rotation, no recoloring outside palette, no shadows/effects)
