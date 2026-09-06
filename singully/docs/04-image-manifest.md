# 04. Image manifest

The build sandbox cannot reach Unsplash, Pexels or Pixabay, so every slot below ships with a generated placeholder in `assets/img/` (SVG, procedural texture, ink, bone, sand, clay and indigo tones at low saturation). Swap by dropping a photo with the same file name (`.jpg` accepted, update the `src`).

Generation: `npm run placeholders` runs `scripts/generate-placeholders.mjs`, which writes one SVG per slot using `feTurbulence` grain, warp and weft line fields, twill diagonals and a block print grid. Seeds are fixed so output is deterministic.

| File | Slot | Aspect | Placeholder motif | Stock search terms (free, credit not required: Unsplash, Pexels) |
|---|---|---|---|---|
| `hero-lane.svg` | Home hero | 4:5 mobile, 16:9 desktop | Indigo wash with a single bone horizon line | "old city lane Hyderabad evening", "narrow street India dusk film" |
| `prologue-cloth.svg` | Prologue backdrop | 3:2 | Bone weave, warp and weft | "handloom cotton texture close up", "khadi fabric macro" |
| `hands-01.svg` | Hold back layer, piece 1 | 4:5 | Sand block grid | "embroidery hands close up India", "chikankari artisan hands" |
| `hands-02.svg` | Hold back layer, piece 2 | 4:5 | Clay twill | "leather tooling hands workshop", "hand stitching leather" |
| `piece-01.svg` to `piece-06.svg` | Drop pieces | 4:5 | Alternating ink twill, bone weave, indigo denim | "upcycled denim jacket flat lay neutral", "embroidered shirt on hanger studio", "handmade tote canvas studio" |
| `lane-01.svg` to `lane-05.svg` | Lane cards | 3:4 | Place tinted washes: Hyderabad indigo, Lucknow bone, Kutch clay, Kanchipuram sand, Bhagalpur ink | "Charminar lane", "Lucknow chowk", "Kutch village craft", "Kanchipuram silk loom", "Bhagalpur tussar silk weaver" |
| `house-studio.svg` | The House | 16:9 | Ink with bone grid | "small fashion studio table cutting", "atelier workbench neutral" |
| `journal-01.svg` to `journal-03.svg` | Journal cards | 3:2 | Mixed | "notebook and fabric swatches", "packaging kraft paper tag", "trademark document desk" |
| `artisan-portrait-01.svg` to `-04.svg` | Artisans page | 4:5 | Bone weave, high grain | "artisan portrait natural light India", "weaver portrait workshop" |

Licensing rule for real photos: only Unsplash License, Pexels License or CC0. Keep a `CREDITS.md` next to the images with photographer and URL even where credit is optional. Never use a photo of an identifiable real artisan as if they were a Sinगली maker until there is a signed release.
