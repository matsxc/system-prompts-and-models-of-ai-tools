# 01. Site architecture

Reconciled against docs/00-brand-brief.md. Seven pages. Every page shares header, footer, preloader (home only on first visit), transition curtain, and the motion engine.

## Copy law (from the brief)

- Sinगली is always dual script. Never romanised, never translated. Legal entity, Latin only: House of Singully Private Limited, Hyderabad.
- Banned words anywhere on the site: luxury, exclusive, curated, premium, artisanal, handcrafted, "limited edition", "get yours before it's gone", "dropping soon". Use maker, hands, piece, run, drop, edition number.
- No discounts, no sale language, no urgency. No exclamation marks.
- The founder is faceless. No founder name, portrait or first person founder copy anywhere. The maker is the face.
- No em dashes or en dashes.
- Unresolved facts are written around, not invented: artisan share figure, exact price tiers, trademark status, named makers. Placeholders are the deck's own illustrative tag, `Sinगली × MATS, 3/10`.
- Prices shown sit in the ₹3,500 to ₹5,000 band, the one band every source agrees on.

## Sitemap and nav

| Page | File | Nav label | Purpose |
|---|---|---|---|
| Home | `index.html` | wordmark | The film. Prologue, the hands, the canvas, the drop, the tag, the folk |
| The Drop | `drop.html` | The Drop | Edition 01, ten pieces, numbered, then gone |
| Piece | `product.html` | (from cards) | One piece, hold to see the hands, sizing, the tag |
| The Hands | `artisans.html` | The Hands | The makers and The Search |
| The House | `house.html` | The House | Why this exists, what it is not, the filters, the company |
| Journal | `journal.html` | Journal | Behind the build |
| गली Folk | `folk.html` | (footer and home strip) | The founding record of the first five hundred |

Header right: `Bag (0)`. Footer columns: House (The Drop, The Hands, The House, Journal, गली Folk), Help (Sizing, Shipping and returns, Care), Legal (Privacy, Terms), Write (hello@singully.com). Legal line: House of Singully Private Limited, Hyderabad. Nothing in the header or footer explains the name.

## Home, section by section

Chapter labels are mono, `NN / Title`.

### H0 Preloader
शिरोरेखा draws, Sinगली hangs from it, both rise into the header. docs/03 M1.

### H1 Hero
Headline (display, three masked lines): `Some things are found,` / `not advertised.` / `गली में मिला।`
Sub (body, 34em): `Pieces made in small numbered drops, by a maker who is named on the tag as co-creator and paid for what they made. Ten pieces. Numbered. Then gone.`
Buttons: `Enter the drop` (primary, drop.html), `See the hands` (artisans.html).
Media: `hero-lane.svg`, curtain lift, parallax. Mono line under media: `Hyderabad. Edition 01. First stitch.`

### H2 Chapter 00 / Prologue (pinned)
Four lines, ink in on scroll:
1. `You have been wearing someone's work your whole life.`
2. `You just never knew who.`
3. `Not the high street. Not the heritage house.`
4. `The lane nobody turned into.`
Backdrop `prologue-cloth.svg` at 8% opacity.

### H3 Chapter 01 / The Hands
Intro (t-2): `The maker is not our labour. The maker is our co-creator.`
Body: `Every piece carries a woven tag with a name that is not ours, a number, and a mark. A salary first. Then a share of what they made. The tag is where credit becomes physical.`
Hold frame A: front `piece-01.svg`, label `Hold to see the hands`; back `hands-01.svg`, held label `Sinगली × MATS, 3/10`.
Hold frame B (desktop only): `piece-02.svg` and `hands-02.svg`, held label `Sinगली × MATS, 7/10`.

### H4 Chapter 02 / The Canvas
Intro: `We do not manufacture. We transform.`
Sub (body): `Roughly thirty percent of a piece is the canvas. Seventy percent is the soul.`
Cards (M6 expanding row), name in display, mono line, one line body on expand:
1. `Denim` / `second life` / `Old jackets and jeans, opened at the seams and rebuilt by one hand.`
2. `Carpet` / `transformed` / `A carpet that had a floor becomes a coat that has a person.`
3. `Thread` / `heavy embroidery` / `Hands that have done something a thousand times.`
4. `Leather` / `tattooed` / `Ink into hide. Footwear and bags that carry a drawing, not a logo.`
5. `The next one` / `the search` / `We are out looking. When we find the hand, you will meet it here first.` (links artisans.html)
Media `lane-01.svg` to `lane-05.svg`.

### H5 Chapter 03 / The Drop
Intro: `Edition 01.` Mono: `Ten pieces. Numbered. Then gone. A run is never restocked.`
Horizontal scrubbed row of six piece cards (`piece-01.svg` to `piece-06.svg`), each with name, credit `Sinगली × MATS, n/10`, price, mono `Piece n of 10`. Working names: `Denim, Second Life 01`, `Carpet Coat`, `Thread Overshirt`, `Tattooed Loafer`, `Denim, Second Life 02`, `Carpet Tote`. Prices: 4,200 / 5,000 / 3,800 / 4,600 / 3,500 / 3,900. Each links product.html. End card: `See all ten` to drop.html.

### H6 Chapter 04 / The Tag
Intro: `The tag is not packaging. It is part of the piece.`
Diagram (M8, SVG): a woven tag drawn at scale with four callout lines that draw in: `Maker's name`, `Piece number`, `Maker's mark`, `Sinगली`. No money figures.
Body: `Credit as the product. Dignity is the operating model, not the marketing.`
Media: `house-studio.svg`. Button: `Read the house notes` (house.html).

### H7 गली Folk strip (dark section)
Line (t-1): `The first five hundred.`
Body: `The first five hundred people to buy a piece get a permanent page on this site. A record, not a loyalty programme. Names, piece numbers, the year.`
Button: `See the record` (folk.html). Mono counter: `Founding places taken: 0 of 500` (static, not animated).

### H8 Journal strip
Three cards (`journal-01.svg` to `-03.svg`), mono date, display title, one line standfirst. Titles: `First stitch.`, `Testing ₹3,500.`, `The tag is the product.`

### H9 Footer
Super rule, giant wordmark, columns, marquee in mono: `Denim, second life. Carpet, transformed. Thread. Leather, tattooed. Hyderabad. Edition 01.` Legal line.

## Secondary pages

### drop.html
Hero `Edition 01.` with mono `Ten pieces. One maker. Numbered, then gone.` Filter row (mono): All, Apparel, Footwear, Bags, by canvas (Denim, Carpet, Thread, Leather). Grid of ten piece cards, 2 up mobile, 3 up desktop, curtain reveals. Closing band: `When a run closes, the tag is retired.` and an email field labelled `Hear about Edition 02.` Nothing else.

### product.html
Two column. Left: sticky gallery, first frame a hold frame. Right: name, credit, price, `Piece 3 of 10`, size row (XS to XL text buttons), `Add to bag` primary, accordions: The piece, The hands, The tag, Care, Shipping and returns. Below: `From the same hand` row of three.

### artisans.html
Intro `The Hands.` then `The Search` block: `We look for makers who are very good and not yet found. This page fills as the search does.` One maker block for Edition 01 using the illustrative credit, portrait `artisan-portrait-01.svg`, craft and canvas in mono, one paragraph. Three further blocks marked in mono `Edition 02, in search` with `artisan-portrait-02.svg` to `-04.svg` shown as ink curtains not yet lifted (a deliberate design state, the curtain stays down).

### house.html
Long form, no founder. Sections: Why this exists (the empty middle between fast fashion and the heritage shelf), What it is not (Not the high street. Not the heritage house.), The six filters (a named human always; human creative ownership; made with integrity; the canvas earns its place; priced with conviction; a story worth wearing), Three rules (no replicas, no discounts ever, no anonymous pieces), The tag (reuse M8), The company (House of Singully Private Limited, Hyderabad, hello@singully.com).

### journal.html
Six entries, mono date, display title, standfirst, reading time: `First stitch.`, `Testing ₹3,500.`, `The tag is the product.`, `Finding the hand.`, `Why we will never discount.`, `A carpet becomes a coat.` Bodies are two short paragraphs each, written in the brief's voice.

### folk.html
Intro `गली Folk.` then `The founding record.` Body from H7. A numbered list 001 to 500, all empty rows rendered as a hairline and a mono number, with `001` to `010` reserved for Edition 01 buyers. A single line at the end: `Come stand at the front of the lane.`

## Rules every builder checks before finishing a page
1. Search the file for `Singali`, `Sin Gali`, `SinGali`. Zero hits. `Singully` appears only in the legal line, email and file paths.
2. Search for the banned word list above. Zero hits.
3. No em dashes or en dashes in copy or comments.
4. No motif from the rejection list in any SVG.
5. Every image has alt text that describes the image, never the brand.
6. Every interactive element works by keyboard and under reduced motion.
7. No founder name anywhere.
