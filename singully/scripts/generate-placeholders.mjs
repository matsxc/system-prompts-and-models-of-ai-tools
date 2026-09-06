/* ==========================================================================
   Sinगली. Placeholder art.

   Writes one SVG per slot in docs/04-image-manifest.md into assets/img/.
   No dependencies. Output is deterministic: every drawing is fed by a seeded
   PRNG keyed off the file name, so a rerun produces byte identical files.

   These stand in for photography, so they carry the three placeholder tones
   (sand, clay, indigo) alongside ink and bone, all pulled toward each other
   so nothing reads as a saturated swatch. Every file gets a light gradient,
   a procedural motif, a vignette and an feTurbulence grain pass.

   Swap any file for a real photograph of the same name and nothing else in
   the site has to change.
   ========================================================================== */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "..", "assets", "img");

/* ---- Seeded PRNG ------------------------------------------------------- */

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function prng(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- Colour ------------------------------------------------------------ */

const PALETTE = {
  ink: "#2E2C2A",
  ink2: "#5F5B56",
  bone: "#F4F1EC",
  bone2: "#EAE5DD",
  bone3: "#DED8CE",
  sand: "#C8A97E",
  clay: "#8B3A3A",
  indigo: "#2B3A55"
};

function toRgb(hex) {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16)
  ];
}

function toHex(rgb) {
  return (
    "#" +
    rgb
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/* Pulls one tone toward another. Every placeholder colour is a mix, which is
   what keeps the sand, clay and indigo low in saturation. */
function mix(a, b, t) {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex([
    x[0] + (y[0] - x[0]) * t,
    x[1] + (y[1] - x[1]) * t,
    x[2] + (y[2] - x[2]) * t
  ]);
}

const n = (v) => Math.round(v * 10) / 10;

/* ---- Motifs ------------------------------------------------------------ */

/* Warp and weft. A handloom read at arm's length: the spacing breathes,
   a few threads sit heavier than the rest. */
function weave(w, h, rnd, o = {}) {
  const stroke = o.stroke || PALETTE.ink;
  const warpGap = o.warpGap || w / 54;
  const weftGap = o.weftGap || h / 42;
  const buckets = [[], [], []];

  for (let x = warpGap * 0.5; x < w; x += warpGap) {
    const jx = n(x + (rnd() - 0.5) * warpGap * 0.35);
    const top = n(rnd() * h * 0.04);
    const bottom = n(h - rnd() * h * 0.04);
    buckets[rnd() < 0.12 ? 2 : rnd() < 0.45 ? 1 : 0].push(
      `M${jx} ${top}V${bottom}`
    );
  }
  for (let y = weftGap * 0.5; y < h; y += weftGap) {
    const jy = n(y + (rnd() - 0.5) * weftGap * 0.4);
    const left = n(rnd() * w * 0.03);
    const right = n(w - rnd() * w * 0.03);
    buckets[rnd() < 0.1 ? 2 : rnd() < 0.4 ? 1 : 0].push(
      `M${left} ${jy}H${right}`
    );
  }

  const widths = o.widths || [1, 1.6, 2.6];
  const opacities = o.opacities || [0.1, 0.17, 0.28];
  return buckets
    .map(
      (paths, i) =>
        `<path d="${paths.join("")}" stroke="${stroke}" stroke-width="${widths[i]}" opacity="${opacities[i]}"/>`
    )
    .join("");
}

/* Twill. Parallel diagonals with a heavier rib every few passes, the way a
   denim or tussar face catches light. */
function twill(w, h, rnd, o = {}) {
  const stroke = o.stroke || PALETTE.ink;
  const gap = o.gap || 17;
  const dir = o.dir === -1 ? -1 : 1;
  const light = [];
  const heavy = [];

  const span = w + h;
  let i = 0;
  for (let d = -h; d < span; d += gap) {
    const jitter = (rnd() - 0.5) * gap * 0.3;
    const x1 = n(d + jitter);
    const y1 = 0;
    const x2 = n(d + jitter + dir * h);
    const y2 = n(h);
    const seg = `M${x1} ${y1}L${x2} ${y2}`;
    if (i % 4 === 0) heavy.push(seg);
    else light.push(seg);
    i++;
  }

  return (
    `<path d="${light.join("")}" stroke="${stroke}" stroke-width="${o.thin || 2}" opacity="${o.thinOpacity || 0.12}"/>` +
    `<path d="${heavy.join("")}" stroke="${stroke}" stroke-width="${o.thick || 4}" opacity="${o.thickOpacity || 0.2}"/>`
  );
}

/* Block print grid. Stamped rectangles on a half drop repeat, each one
   nudged and squared off by hand, some pressed harder, a few skipped. */
function blockGrid(w, h, rnd, o = {}) {
  const fill = o.fill || PALETTE.ink;
  const cols = o.cols || 6;
  const rows = o.rows || Math.max(3, Math.round((cols * h) / w));
  const cw = w / cols;
  const ch = h / rows;
  const inset = o.inset === undefined ? 0.2 : o.inset;
  const buckets = [[], [], []];

  for (let r = -1; r < rows + 1; r++) {
    // Half drop repeat. A hand block walks the cloth, it does not tile.
    const shift = r % 2 === 0 ? 0 : cw * 0.5;
    for (let c = -1; c < cols + 1; c++) {
      if (rnd() < (o.skip === undefined ? 0.14 : o.skip)) continue;

      const size = 0.86 + rnd() * 0.28;
      const bw = cw * (1 - inset * 2) * size;
      const bh = ch * (1 - inset * 2) * size;
      const x = c * cw + cw * inset + shift + (rnd() - 0.5) * cw * 0.1;
      const y = r * ch + ch * inset + (rnd() - 0.5) * ch * 0.1;

      // Each corner lands slightly off. That is the whole tell of a hand block.
      const j = () => (rnd() - 0.5) * Math.min(cw, ch) * 0.07;
      const p1 = `${n(x + j())} ${n(y + j())}`;
      const p2 = `${n(x + bw + j())} ${n(y + j())}`;
      const p3 = `${n(x + bw + j())} ${n(y + bh + j())}`;
      const p4 = `${n(x + j())} ${n(y + bh + j())}`;

      const bucket = rnd() < 0.16 ? 2 : rnd() < 0.5 ? 1 : 0;
      buckets[bucket].push(`M${p1}L${p2}L${p3}L${p4}z`);

      // A single bar inside a few stamps. Structure, not ornament.
      if (rnd() < 0.22) {
        const by = n(y + bh * 0.66);
        buckets[0].push(
          `M${n(x + bw * 0.18)} ${by}h${n(bw * 0.64)}v${n(bh * 0.08)}h${n(-bw * 0.64)}z`
        );
      }
    }
  }

  const opacities = o.opacities || [0.06, 0.1, 0.16];
  return buckets
    .map((paths, i) =>
      paths.length
        ? `<path d="${paths.join("")}" fill="${fill}" opacity="${opacities[i]}"/>`
        : ""
    )
    .join("");
}

/* A measured grid. Used for the studio table: fine ruling, two heavier rules. */
function measuredGrid(w, h, rnd, o = {}) {
  const stroke = o.stroke || PALETTE.bone;
  const step = o.step || 64;
  const fine = [];
  for (let x = step; x < w; x += step) fine.push(`M${n(x)} 0V${n(h)}`);
  for (let y = step; y < h; y += step) fine.push(`M0 ${n(y)}H${n(w)}`);

  const heavy = [];
  const hx = n(Math.round((w * (0.3 + rnd() * 0.12)) / step) * step);
  const hy = n(Math.round((h * (0.55 + rnd() * 0.15)) / step) * step);
  heavy.push(`M${hx} 0V${n(h)}`);
  heavy.push(`M0 ${hy}H${n(w)}`);

  return (
    `<path d="${fine.join("")}" stroke="${stroke}" stroke-width="1" opacity="0.1"/>` +
    `<path d="${heavy.join("")}" stroke="${stroke}" stroke-width="2" opacity="0.28"/>`
  );
}

/* One horizon. Nothing else. */
function horizon(w, h, rnd, o = {}) {
  const stroke = o.stroke || PALETTE.bone;
  const y = n(h * (o.at || 0.62));
  return (
    `<path d="M0 ${y}H${n(w)}" stroke="${stroke}" stroke-width="${o.weight || 2}" opacity="${o.opacity || 0.5}"/>` +
    `<path d="M0 ${n(y + 3)}H${n(w)}" stroke="${stroke}" stroke-width="6" opacity="0.08"/>`
  );
}

/* ---- Frame ------------------------------------------------------------- */

function svg(spec) {
  const { w, h, id, base, top, bottom, motif, grain, grainFreq, label, vignette } = spec;

  const defs =
    `<linearGradient id="l${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${top}"/>` +
    `<stop offset="1" stop-color="${bottom}"/>` +
    `</linearGradient>` +
    `<radialGradient id="v${id}" cx="0.5" cy="0.42" r="0.85">` +
    `<stop offset="0.2" stop-color="${PALETTE.ink}" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="${PALETTE.ink}" stop-opacity="${vignette}"/>` +
    `</radialGradient>` +
    // Desaturated noise, compressed toward white so multiplying it grains
    // the surface instead of dulling it.
    `<filter id="g${id}" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${grainFreq}" numOctaves="2" seed="${spec.seed}" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `<feComponentTransfer>` +
    `<feFuncR type="linear" slope="0.5" intercept="0.5"/>` +
    `<feFuncG type="linear" slope="0.5" intercept="0.5"/>` +
    `<feFuncB type="linear" slope="0.5" intercept="0.5"/>` +
    `<feFuncA type="linear" slope="0" intercept="1"/>` +
    `</feComponentTransfer>` +
    `</filter>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ` +
    `preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">` +
    `<defs>${defs}</defs>` +
    `<rect width="${w}" height="${h}" fill="${base}"/>` +
    `<rect width="${w}" height="${h}" fill="url(#l${id})"/>` +
    `<g fill="none" stroke-linecap="butt">${motif}</g>` +
    `<rect width="${w}" height="${h}" fill="url(#v${id})"/>` +
    `<rect width="${w}" height="${h}" filter="url(#g${id})" opacity="${grain}" style="mix-blend-mode:multiply"/>` +
    `</svg>\n`
  );
}

/* ---- Slots -------------------------------------------------------------- */

const RATIO = {
  "16x9": [1600, 900],
  "4x5": [1200, 1500],
  "3x2": [1500, 1000],
  "3x4": [1200, 1600]
};

/* Every tone below is a mix, never a raw swatch. */
const TONE = {
  indigoDeep: mix(PALETTE.indigo, PALETTE.ink, 0.32),
  indigoLift: mix(PALETTE.indigo, PALETTE.bone3, 0.24),
  boneWarm: mix(PALETTE.bone2, PALETTE.sand, 0.14),
  boneCool: mix(PALETTE.bone2, PALETTE.ink, 0.05),
  sandMute: mix(mix(PALETTE.sand, PALETTE.bone2, 0.46), PALETTE.ink, 0.08),
  sandDeep: mix(PALETTE.sand, PALETTE.ink, 0.44),
  clayMute: mix(mix(PALETTE.clay, PALETTE.bone3, 0.48), PALETTE.ink, 0.18),
  clayDeep: mix(PALETTE.clay, PALETTE.ink, 0.52),
  inkSoft: mix(PALETTE.ink, PALETTE.bone3, 0.1),
  inkFlat: PALETTE.ink
};

const SLOTS = [
  // Home hero. Indigo wash, one bone horizon.
  {
    file: "hero-lane.svg",
    ratio: "16x9",
    label: "Indigo wash with a single horizon line",
    base: TONE.indigoDeep,
    top: mix(TONE.indigoLift, PALETTE.bone, 0.1),
    bottom: mix(TONE.indigoDeep, PALETTE.ink, 0.4),
    grain: 0.4,
    vignette: 0.3,
    draw: (w, h, r) => horizon(w, h, r, { at: 0.6, weight: 2, opacity: 0.45 })
  },
  {
    file: "hero-lane-4x5.svg",
    ratio: "4x5",
    label: "Indigo wash with a single horizon line, upright crop",
    base: TONE.indigoDeep,
    top: mix(TONE.indigoLift, PALETTE.bone, 0.1),
    bottom: mix(TONE.indigoDeep, PALETTE.ink, 0.4),
    grain: 0.4,
    vignette: 0.3,
    draw: (w, h, r) => horizon(w, h, r, { at: 0.66, weight: 2, opacity: 0.45 })
  },

  // Prologue backdrop. Bone weave, warp and weft.
  {
    file: "prologue-cloth.svg",
    ratio: "3x2",
    label: "Handloom cotton, warp and weft",
    base: TONE.boneWarm,
    top: PALETTE.bone,
    bottom: mix(TONE.boneWarm, PALETTE.bone3, 0.6),
    grain: 0.36,
    vignette: 0.14,
    draw: (w, h, r) => weave(w, h, r, { stroke: PALETTE.ink })
  },

  // Hold back layers.
  {
    file: "hands-01.svg",
    ratio: "4x5",
    label: "Sand block print grid",
    base: TONE.sandMute,
    top: mix(TONE.sandMute, PALETTE.bone, 0.3),
    bottom: TONE.sandDeep,
    grain: 0.42,
    vignette: 0.22,
    draw: (w, h, r) => blockGrid(w, h, r, { fill: PALETTE.ink, cols: 6 })
  },
  {
    file: "hands-02.svg",
    ratio: "4x5",
    label: "Clay twill",
    base: TONE.clayMute,
    top: mix(TONE.clayMute, PALETTE.bone3, 0.34),
    bottom: mix(TONE.clayDeep, PALETTE.ink, 0.34),
    grain: 0.42,
    vignette: 0.24,
    draw: (w, h, r) => twill(w, h, r, { stroke: PALETTE.ink, gap: 19 })
  },

  // Drop pieces. Ink twill, bone weave, indigo denim, repeating.
  ...[1, 2, 3, 4, 5, 6].map((i) => {
    const kind = (i - 1) % 3;
    if (kind === 0) {
      return {
        file: `piece-0${i}.svg`,
        ratio: "4x5",
        label: "Ink twill",
        base: TONE.inkSoft,
        top: mix(TONE.inkSoft, PALETTE.bone3, 0.2),
        bottom: PALETTE.ink,
        grain: 0.4,
        vignette: 0.2,
        draw: (w, h, r) =>
          twill(w, h, r, {
            stroke: PALETTE.bone,
            gap: 16,
            thinOpacity: 0.08,
            thickOpacity: 0.14
          })
      };
    }
    if (kind === 1) {
      return {
        file: `piece-0${i}.svg`,
        ratio: "4x5",
        label: "Bone weave",
        base: TONE.boneCool,
        top: PALETTE.bone,
        bottom: mix(TONE.boneCool, PALETTE.bone3, 0.7),
        grain: 0.36,
        vignette: 0.14,
        draw: (w, h, r) => weave(w, h, r, { stroke: PALETTE.ink, warpGap: w / 46 })
      };
    }
    return {
      file: `piece-0${i}.svg`,
      ratio: "4x5",
      label: "Indigo denim twill",
      base: TONE.indigoDeep,
      top: mix(TONE.indigoLift, PALETTE.bone, 0.06),
      bottom: mix(TONE.indigoDeep, PALETTE.ink, 0.45),
      grain: 0.4,
      vignette: 0.24,
      draw: (w, h, r) =>
        twill(w, h, r, {
          stroke: PALETTE.bone,
          gap: 13,
          dir: -1,
          thin: 1.6,
          thick: 3,
          thinOpacity: 0.09,
          thickOpacity: 0.15
        })
    };
  }),

  // Lane cards. One tinted wash per place.
  {
    file: "lane-01.svg",
    ratio: "3x4",
    label: "Hyderabad, indigo",
    base: TONE.indigoDeep,
    top: mix(TONE.indigoLift, PALETTE.bone, 0.08),
    bottom: mix(TONE.indigoDeep, PALETTE.ink, 0.5),
    grain: 0.4,
    vignette: 0.28,
    draw: (w, h, r) => horizon(w, h, r, { at: 0.7, weight: 2, opacity: 0.4 })
  },
  {
    file: "lane-02.svg",
    ratio: "3x4",
    label: "Lucknow, bone",
    base: TONE.boneWarm,
    top: PALETTE.bone,
    bottom: mix(TONE.boneWarm, PALETTE.bone3, 0.75),
    grain: 0.36,
    vignette: 0.13,
    draw: (w, h, r) =>
      weave(w, h, r, {
        stroke: PALETTE.ink,
        warpGap: w / 62,
        weftGap: h / 56,
        opacities: [0.07, 0.12, 0.2]
      })
  },
  {
    file: "lane-03.svg",
    ratio: "3x4",
    label: "Kutch, clay",
    base: TONE.clayMute,
    top: mix(TONE.clayMute, PALETTE.bone3, 0.3),
    bottom: mix(TONE.clayDeep, PALETTE.ink, 0.28),
    grain: 0.42,
    vignette: 0.22,
    draw: (w, h, r) => blockGrid(w, h, r, { fill: PALETTE.ink, cols: 5, skip: 0.16 })
  },
  {
    file: "lane-04.svg",
    ratio: "3x4",
    label: "Kanchipuram, sand",
    base: TONE.sandMute,
    top: mix(TONE.sandMute, PALETTE.bone, 0.34),
    bottom: TONE.sandDeep,
    grain: 0.38,
    vignette: 0.2,
    draw: (w, h, r) =>
      weave(w, h, r, {
        stroke: PALETTE.ink,
        warpGap: w / 70,
        weftGap: h / 30,
        widths: [1, 1.8, 3.2],
        opacities: [0.08, 0.14, 0.24]
      })
  },
  {
    file: "lane-05.svg",
    ratio: "3x4",
    label: "Bhagalpur, ink",
    base: TONE.inkSoft,
    top: mix(TONE.inkSoft, PALETTE.bone3, 0.16),
    bottom: PALETTE.ink,
    grain: 0.4,
    vignette: 0.2,
    draw: (w, h, r) =>
      twill(w, h, r, {
        stroke: PALETTE.bone,
        gap: 21,
        thinOpacity: 0.08,
        thickOpacity: 0.13
      })
  },

  // The House. Ink ground, bone grid, like a cutting table.
  {
    file: "house-studio.svg",
    ratio: "16x9",
    label: "Studio table, ink with a bone grid",
    base: PALETTE.ink,
    top: mix(PALETTE.ink, PALETTE.bone3, 0.12),
    bottom: mix(PALETTE.ink, "#000000", 0.25),
    grain: 0.34,
    vignette: 0.3,
    draw: (w, h, r) => measuredGrid(w, h, r, { stroke: PALETTE.bone, step: 72 })
  },

  // Journal cards. Mixed.
  {
    file: "journal-01.svg",
    ratio: "3x2",
    label: "Swatches, bone weave",
    base: TONE.boneCool,
    top: PALETTE.bone,
    bottom: mix(TONE.boneCool, PALETTE.bone3, 0.8),
    grain: 0.36,
    vignette: 0.13,
    draw: (w, h, r) => weave(w, h, r, { stroke: PALETTE.ink, warpGap: w / 48 })
  },
  {
    file: "journal-02.svg",
    ratio: "3x2",
    label: "Kraft tag, sand block grid",
    base: TONE.sandMute,
    top: mix(TONE.sandMute, PALETTE.bone, 0.36),
    bottom: TONE.sandDeep,
    grain: 0.4,
    vignette: 0.18,
    draw: (w, h, r) => blockGrid(w, h, r, { fill: PALETTE.ink, cols: 9, skip: 0.1 })
  },
  {
    file: "journal-03.svg",
    ratio: "3x2",
    label: "Ledger, ink twill",
    base: TONE.inkSoft,
    top: mix(TONE.inkSoft, PALETTE.bone3, 0.18),
    bottom: PALETTE.ink,
    grain: 0.38,
    vignette: 0.2,
    draw: (w, h, r) =>
      twill(w, h, r, {
        stroke: PALETTE.bone,
        gap: 24,
        dir: -1,
        thinOpacity: 0.07,
        thickOpacity: 0.12
      })
  },

  // Artisan portraits. Bone weave, higher grain.
  ...[1, 2, 3, 4].map((i) => ({
    file: `artisan-portrait-0${i}.svg`,
    ratio: "4x5",
    label: "Portrait ground, bone weave",
    base: i % 2 ? TONE.boneWarm : TONE.boneCool,
    top: PALETTE.bone,
    bottom: mix(i % 2 ? TONE.boneWarm : TONE.boneCool, PALETTE.bone3, 0.85),
    grain: 0.55,
    vignette: 0.2,
    draw: (w, h, r) =>
      weave(w, h, r, {
        stroke: PALETTE.ink,
        warpGap: w / (40 + i * 4),
        weftGap: h / (34 + i * 3),
        opacities: [0.09, 0.15, 0.24]
      })
  }))
];

/* ---- Write -------------------------------------------------------------- */

function build() {
  mkdirSync(OUT, { recursive: true });

  let total = 0;
  let largest = 0;
  let largestName = "";

  for (const slot of SLOTS) {
    const [w, h] = RATIO[slot.ratio];
    const seed = hashString(slot.file);
    const rnd = prng(seed);
    const id = (seed % 46656).toString(36);

    const markup = svg({
      w,
      h,
      id,
      seed: seed % 100,
      base: slot.base,
      top: slot.top,
      bottom: slot.bottom,
      motif: slot.draw(w, h, rnd),
      grain: slot.grain,
      grainFreq: slot.grainFreq || 0.11,
      vignette: slot.vignette,
      label: slot.label
    });

    writeFileSync(join(OUT, slot.file), markup, "utf8");
    const size = Buffer.byteLength(markup);
    total += size;
    if (size > largest) {
      largest = size;
      largestName = slot.file;
    }
    if (size > 12 * 1024) {
      console.warn(`  over budget: ${slot.file} at ${(size / 1024).toFixed(1)} KB`);
    }
  }

  console.log(`Wrote ${SLOTS.length} placeholders to assets/img`);
  console.log(
    `Total ${(total / 1024).toFixed(1)} KB. Largest ${largestName} at ${(largest / 1024).toFixed(1)} KB.`
  );
}

build();
