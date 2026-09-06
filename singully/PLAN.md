# Sinगली website. Master plan

Owner: Fable 5.1 (orchestration, design direction, review). Builders: Opus (foundation, home page, motion), Sonnet (research, secondary pages, QA scripts). Nothing ships without a Fable review pass.

## 1. Brief in one paragraph

A direct to consumer site for Sinगली, an Indian artisan fashion house from Hyderabad: limited runs of handcrafted apparel and accessories at roughly ₹3,000 to ₹5,000, made with undiscovered local craftspeople who are credited on the tag and paid a share of revenue per piece. The site borrows the cinematic, chapter driven storytelling grammar of sondaven.com (Webflow, GSAP, scroll driven chapters, hold to compare, interactive cards, a loader that sets the tone) and re-roots every one of those devices in Indian material culture, without ever performing Indianness. Reference behaviour: A24. Register: Blaorange, Urban Monkey, Snitch. Soul: Knowing. Still. Generous.

## 2. Decisions taken (do not relitigate inside a build task)

| Area | Decision | Why |
|---|---|---|
| Approach | Rebuild from the direction, not a clone | Son Daven is a hotel investment site; its structure does not map to a drop based fashion brand. We keep its motion grammar and chapter rhythm, and design our own sections. |
| Stack | Static HTML, CSS, vanilla JS. GSAP 3.12 + ScrollTrigger + Lenis, vendored in `assets/vendor`. No framework, no build step for the site itself. | Fastest path to "get a feel of it". Portable to Shopify theme sections or Webflow later. Only registry.npmjs.org and fonts.googleapis.com are reachable from the build sandbox. |
| Fonts | Rozha One (display, Latin + Devanagari Didone, one hand for both scripts). Mukta (body, Latin + Devanagari sans). IBM Plex Mono (credits, tags, chapter numbers). Loaded from Google Fonts with real fallback stacks. | The wordmark logic is a Didone S ligated to a Didone ग. Rozha One is the closest open typeface that cuts both scripts with one contrast model. |
| Palette | Ink `#2E2C2A` on bone `#F4F1EC` as the only chrome colours, plus tints of those two. Photography carries all warmth. No accent colour in UI. Tokens `--red` and `--rose` from the September 2026 Indian Heritage kit are defined in tokens.css but reserved and unused until the creative director assigns them a job. | The identity brief locks ink on bone; the newer five colour kit functionally keeps near black and ivory and flags red for replacement. Two colours ship, the rest wait. |
| Signature device | The शिरोरेखा as a literal line: preloader, header rule, section dividers, hover underlines, the product tag. | The one graphic the brand owns. |
| Images | Generated placeholder art (SVG, procedural weave, twill, block grid, indigo wash) in `assets/img`, with a manifest of slots and stock search terms in `docs/04-image-manifest.md`. | The sandbox cannot reach Unsplash or Pexels. Placeholders are built to be swapped one file at a time. |
| Copy rules | Always Sinगली in dual script. Never Singali, Sin Gali, SinGali. Never translated, subtitled or explained. Legal entity: House of Singully Private Limited. No em dashes or en dashes in any copy. No urgency language. Banned words: luxury, exclusive, curated, premium, artisanal, handcrafted, limited edition. Founder stays faceless. | Brand rules and the brief. |
| Motif rules | No rangoli, paisley, mandala, lotus, chakra, diya, Taj, tube light, henna. Indianness lives in material, light, language and place names. | Identity brief instant rejection list. |
| Accessibility | `prefers-reduced-motion` disables scrub animations and the preloader; every hold interaction has a click and keyboard equivalent; contrast is ink on bone everywhere. | Non negotiable. |

## 3. Phases

| Phase | Deliverable | Builder | Gate |
|---|---|---|---|
| 0 Research | `docs/00-brand-brief.md` from Drive and Notion sources | Sonnet | Fable reads it, pulls copy into the architecture doc |
| 1 Plan | `PLAN.md`, `docs/01-site-architecture.md`, `docs/02-design-system.md`, `docs/03-motion-spec.md`, `docs/04-image-manifest.md` | Fable | This file |
| 2 Foundation | `assets/css/tokens.css`, `assets/css/base.css`, `assets/css/components.css`, `assets/js/motion.js`, `assets/js/site.js`, `scripts/generate-placeholders.mjs`, `scripts/build-artifact.mjs`, shared header and footer markup | Opus | Fable review against 02 and 03 |
| 3 Home | `index.html` complete with every section in 01, wired to motion.js | Opus | Playwright screenshots at 390, 1024, 1440; Fable review |
| 4 Pages | `drop.html`, `product.html`, `artisans.html`, `house.html`, `journal.html`, `folk.html` | Sonnet | Same QA |
| 5 Review | Fix list, second pass, final screenshots | Fable directs, builders fix | Sign off |
| 6 Ship | Commit, push to `claude/singully-indian-website-9cmf83`, artifact preview | Fable | Link delivered |

## 4. How to work on this repo

```
cd singully
npm install            # Playwright only, for QA screenshots
npm run placeholders   # regenerates assets/img/*.svg
npm run serve          # static server on :4173
npm run qa             # screenshots to qa/
npm run artifact       # single file dist/singully-preview.html
```

## 5. Sondaven grammar we are keeping, translated

| Son Daven device | Sinगली translation |
|---|---|
| Cinematic loader with a counter and curtain | The शिरोरेखा draws across the screen left to right; the wordmark drops from it; the line rises to become the header rule. 1.6s, skipped under reduced motion or on return visits. |
| Poetic prologue, lines revealing on scroll | Chapter 00, "Prologue": four lines of manifesto pinned, each line inking in as you scroll. |
| Scroll driven chapters with numbering | Five numbered chapters. Sticky mono chapter label in the left margin on desktop. |
| Seasonal renders, hold to compare summer and winter | Hold to see the hands. Press and hold a product image to reveal the making layer: the artisan, the lane, the stitch. Release and the garment returns. |
| Interactive location cards | Lane cards. A row of places (Charminar lanes, Lucknow, Kutch, Kanchipuram, Bhagalpur) that expand on hover to show the craft and the maker. |
| Apartment typology sections | The Drop. Edition pieces as a horizontal scrubbed row with edition count and artisan credit. |
| Infrastructure map | The Tag. An anatomy diagram of the woven tag with callouts that draw in: maker's name, piece number, mark, wordmark. Credit made physical, no money figures, because the share is not yet settled. |
| Image parallax and clip reveals | Kept. Ink curtains wipe up to reveal photography. |
| Custom cursor labels | Kept. Cursor reads "hold", "open", "enter" over interactive media. |
| Footer with large wordmark | Kept. The largest शिरोरेखा on the site runs across the footer with Sinगली hanging from it. |
