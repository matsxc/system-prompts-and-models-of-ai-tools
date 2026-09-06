# 02. Design system

Everything here becomes a custom property in `assets/css/tokens.css`. Builders use tokens, never raw values.

## Colour

| Token | Value | Use |
|---|---|---|
| `--ink` | `#2E2C2A` | Text, rules, the शिरोरेखा, dark sections |
| `--ink-2` | `#5F5B56` | Secondary text, captions |
| `--ink-3` | `#9A948C` | Placeholder text, disabled |
| `--bone` | `#F4F1EC` | Page ground |
| `--bone-2` | `#EAE5DD` | Cards, alternate bands |
| `--bone-3` | `#DED8CE` | Rules on bone, image fallback ground |
| `--line` | `currentColor` | Rules always take the text colour of their context |

Dark sections invert: ink ground, bone text. No third colour anywhere in the interface. Image placeholders may use sand `#C8A97E`, clay `#8B3A3A` and indigo `#2B3A55` at low saturation because they stand in for photography, never for UI.

## Type

| Token | Family | Fallback | Role |
|---|---|---|---|
| `--font-display` | Rozha One | Georgia, "Noto Serif Devanagari", serif | Headlines, wordmark, chapter titles, prices |
| `--font-body` | Mukta | "Helvetica Neue", Arial, "Noto Sans Devanagari", sans-serif | Body, nav, buttons |
| `--font-mono` | IBM Plex Mono | "SF Mono", Menlo, monospace | Chapter numbers, credits, edition counts, tags |

Google Fonts link (one request): `family=Rozha+One&family=Mukta:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap`

Fluid scale, `clamp()` from 390px to 1440px viewport:

| Token | Min | Max | Line height | Tracking |
|---|---|---|---|---|
| `--t-hero` | 56px | 152px | 0.92 | -0.02em |
| `--t-1` | 40px | 96px | 0.98 | -0.015em |
| `--t-2` | 28px | 56px | 1.05 | -0.01em |
| `--t-3` | 22px | 32px | 1.2 | 0 |
| `--t-body` | 16px | 19px | 1.55 | 0 |
| `--t-small` | 13px | 14px | 1.5 | 0 |
| `--t-mono` | 11px | 12px | 1.4 | 0.08em, uppercase |

Devanagari in Rozha One sits higher than Latin. When the wordmark Sinगली is set, add `.wordmark` which applies `font-feature-settings` defaults and a `-0.03em` letter spacing between Sin and गली so the शिरोरेखा of ग appears to continue the cap line of Sin. Never use font-weight synthesis on Rozha One; it has one weight.

## Space and grid

`--s-1` 4px, `--s-2` 8px, `--s-3` 16px, `--s-4` 24px, `--s-5` 40px, `--s-6` 64px, `--s-7` 104px, `--s-8` 168px.
Section vertical rhythm: `--s-7` mobile, `--s-8` desktop.
Grid: 12 columns, gutter `--s-4`, page padding `clamp(20px, 4vw, 64px)`. Max content width 1600px. Long copy measures at 34em.

## Radii, borders, shadows

Radius 0 everywhere. Borders are 1px `currentColor` at 100% opacity, never grey. No shadows. Ever.

## The शिरोरेखा as a component

`.shirorekha` is a 1px (mobile) or 1.5px (desktop) full width ink line. Variants: `--draw` animates `scaleX` from 0 to 1 with `transform-origin: left`. It is used as: the preloader, the header bottom rule, chapter dividers, the top rule of every card, the link underline, and the footer super rule that the giant wordmark hangs from. It is never curved, dotted, shortened, or floated away from what hangs beneath it.

## Components

| Component | Notes |
|---|---|
| Header | Fixed, bone, 64px. Left: wordmark Sinगली. Centre: nav (The Drop, The Hands, The House, Journal). Right: Bag (0) in mono. Bottom: शिरोरेखा at 1px. Hides on scroll down, returns on scroll up. Under dark sections it inverts via `mix-blend-mode: difference` on the wordmark and nav. |
| Chapter label | Sticky mono, `00 / Prologue`, left margin on desktop, above content on mobile. |
| Media frame | `.media` with `aspect-ratio`, `overflow: hidden`, bone-3 ground, `img` at `object-fit: cover`, `scale(1.08)` at rest for parallax. Reveal via ink curtain `.media::after` that translates up. |
| Hold frame | `.hold` wraps two stacked `.media` layers. Pointer down or space bar held crossfades and slides the top layer. Cursor label "hold". Progress ring in mono percentage optional, not required. |
| Lane card | Vertical card, top शिरोरेखा, place name in display, craft in mono, expands from 1fr to 2.2fr on hover inside a flex row. |
| Piece card | Edition item: media, name in display, artisan credit in mono ("Made with Rukhsana Begum, Purani Haveli"), price in display, edition count in mono ("Edition of 40. 12 remain."). No badges, no sale tags. |
| Button | Text plus शिरोरेखा underline that draws on hover. Primary variant inverts to ink fill. 48px tall min. |
| Marquee | Optional single line ticker in mono, slow (60s), reads place names and crafts, pauses on hover. |
| Footer | Ink ground. Giant wordmark hanging from a 2px bone line. Columns: House, Help, Legal, Instagram @singully.official. Legal line: House of Singully Private Limited, Hyderabad. |
