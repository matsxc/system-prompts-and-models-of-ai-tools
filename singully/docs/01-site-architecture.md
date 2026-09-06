# 01. Site architecture

Six pages. Every page shares header, footer, preloader (home only on first visit), transition curtain, and the motion engine. Copy below is the working draft; lines marked (brief) are to be reconciled with docs/00-brand-brief.md before build sign off.

## Sitemap and nav

| Page | File | Nav label | Purpose |
|---|---|---|---|
| Home | `index.html` | wordmark | The film. Prologue, the hands, the lane, the drop, the house |
| The Drop | `drop.html` | The Drop | Current edition, all pieces, filter by craft |
| Piece | `product.html` | (from cards) | One piece, hold to see the hands, sizing, the tag, the artisan share |
| The Hands | `artisans.html` | The Hands | The craftspeople, by lane. Credit, craft, share paid to date |
| The House | `house.html` | The House | Why Sinगली exists, how money moves, the founder, the company |
| Journal | `journal.html` | Journal | Behind the build. Trademark, price testing, first drop, packaging |

Header right: `Bag (0)`. Footer: House (The Drop, The Hands, The House, Journal), Help (Sizing, Shipping and returns, Care), Legal (Privacy, Terms, House of Singully Private Limited, Hyderabad), Instagram @singully.official. Nothing in the header or footer explains the name.

## Home, section by section

Chapter labels are mono, format `NN / Title`.

### H0 Preloader
शिरोरेखा draws, Sinगली hangs from it, both rise into the header. See docs/03 M1.

### H1 Hero
Headline (display, three masked lines):
`A sinful lane.` / `You find it.` / `It does not find you.`
Sub (body, 34em max): `Limited runs of handcrafted apparel and accessories, made with craftspeople you have not heard of yet. Their name is on the tag. A share of every piece goes back to them.`
Buttons: `Enter the drop` (primary, to drop.html), `See the hands` (to artisans.html).
Media: `hero-lane.svg`, curtain lift, parallax.
A single mono line under the media: `Hyderabad. Edition 01. Autumn 2026.` (brief: confirm drop name and date)

### H2 Chapter 00 / Prologue (pinned)
Four manifesto lines, ink in on scroll:
1. `Not a luxury house. Not fast fashion.`
2. `A culture brand that was already in the room.`
3. `Made with hands that were never credited.`
4. `Until now.`
Backdrop `prologue-cloth.svg` at 8% opacity.

### H3 Chapter 01 / The Hands
Intro (display t-2): `Every piece carries a name that is not ours.`
Body: `We look for craftspeople who are very good and not yet found. They work with us on a run. Their name goes on the woven tag. They are paid a share of revenue on every piece sold, not a one time fee.` (brief: confirm the share figure and use it here as a plain sentence)
Hold frame: front `piece-01.svg` labelled `Hold to see the hands`, back `hands-01.svg` labelled `Rukhsana Begum. Zardozi. Purani Haveli, Hyderabad.` (brief: replace with a real or clearly fictional placeholder name; keep fictional until releases are signed)
Second hold frame on desktop only: `piece-02.svg` and `hands-02.svg`.

### H4 Chapter 02 / The Lane
Intro: `Five lanes. Five crafts. One house.`
Lane cards (place in display, craft in mono, one line body on expand):
1. Hyderabad. Zardozi and karchobi. `Metal thread on velvet, worked in a room off Pathergatti.`
2. Lucknow. Chikankari. `White on white, thirty two stitches, none of them in a hurry.`
3. Kutch. Ajrakh and bandhani. `Sixteen steps of resist and river water.`
4. Kanchipuram. Silk. `Korvai borders, joined by hand, not by machine.`
5. Bhagalpur. Tussar. `Wild silk, uneven on purpose.`
(brief: reconcile with the crafts actually named in the sources, for example upcycled denim and tattooed leather, and swap lanes accordingly)

### H5 Chapter 03 / The Drop
Intro: `Edition 01.` Sub in mono: `Six pieces. Small runs. When they are gone the run is closed and the tag is retired.`
Horizontal scrubbed row of six piece cards (`piece-01.svg` to `piece-06.svg`). Each: name, artisan credit, price in ₹ between 3,000 and 5,000, edition line. Working names: `The Lane Shirt`, `Purani Haveli Jacket`, `Tussar Overshirt`, `Chowk Kurta`, `Ajrakh Tote`, `Denim, Second Life`. Link each to product.html.
Row ends with a card that reads `See the whole drop` linking to drop.html.

### H6 Chapter 04 / The House
Intro: `Where the money goes.`
Diagram (SVG, M8): one piece at ₹4,000 split into artisan share, materials, making, house. (brief: use real percentages if the sources give them, otherwise mark the diagram "illustrative")
Body: `We would rather show you the arithmetic than tell you we care.`
Media: `house-studio.svg`.
Button: `Read the house notes` to house.html.

### H7 Journal strip
Three journal cards (`journal-01.svg` to `-03.svg`) with mono date, display title, one line standfirst. Working titles: `Filing the mark.`, `Testing ₹3,400.`, `The tag is the product.`

### H8 Footer
Super rule, giant wordmark, columns, marquee of place names and crafts in mono. Legal line.

## Secondary pages, section lists

### drop.html
Hero line `Edition 01.` with mono meta. Filter row (mono): All, Apparel, Accessories, by craft. Grid of piece cards, 2 up mobile, 3 up desktop, curtain reveals. Closing band: `When a run closes, the tag is retired.` and a quiet email field `Hear about the next edition.` No urgency copy.

### product.html
Two column. Left: sticky gallery, first frame is a hold frame. Right: name, artisan credit, price, edition line, size row (XS to XL as text buttons), `Add to bag` primary, then accordions: The piece, The hands (artisan paragraph and share), The tag, Care, Shipping. Below: `From the same lane` row of three pieces.

### artisans.html
Intro `The Hands.` Lane groups, each with a portrait (`artisan-portrait-0N.svg`), name in display, craft and place in mono, a paragraph, and a mono line `Share paid to date: ₹ ...` marked illustrative until real.

### house.html
Long form. Sections: Why this exists, What it is not, The arithmetic (reuse M8), The founder (Maitrabh Chauhan, one paragraph in first person, brief), The company (House of Singully Private Limited, Hyderabad), Contact.

### journal.html
List of entries, mono date, display title, standfirst, reading time. Six entries seeded from the brief's Behind the Build pillar.

## Rules every builder checks before finishing a page
1. Sinगली appears only in dual script. Search the file for `Singali`, `Sin Gali`, `SinGali`, `Singully` outside the legal line and the Instagram handle.
2. No em dashes or en dashes in copy or comments.
3. No motif from the rejection list in any SVG or illustration.
4. Every image has alt text that describes the image, never the brand.
5. Every interactive element is reachable by keyboard and works with reduced motion.
6. No urgency copy: no "only", "hurry", "last chance", countdowns or badges.
