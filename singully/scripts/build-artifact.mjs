/* ==========================================================================
   Sinगली. Single file preview.

   Inlines the three stylesheets, the three vendor scripts and the two site
   scripts into one html file, and turns every local image reference that
   points into assets/img into a data URI. Nothing else is touched: the
   Google Fonts link tag stays exactly where it is, and so does every other
   tag, attribute and comment in the page.

   node scripts/build-artifact.mjs                 index.html
   node scripts/build-artifact.mjs _template.html  any page
   ========================================================================== */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DIST = join(ROOT, "dist");

const pageArg = process.argv[2] || "index.html";
const pagePath = resolve(ROOT, pageArg.replace(/^\/+/, ""));

if (!existsSync(pagePath)) {
  console.error(`No such page: ${pageArg}`);
  process.exit(1);
}

const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif"
};

/* Resolves a site path, which may be root relative or page relative. */
function localPath(ref) {
  const clean = ref.split("?")[0].split("#")[0];
  if (/^(https?:|data:|mailto:|tel:|#|\/\/)/i.test(clean)) return null;
  const target = clean.startsWith("/")
    ? join(ROOT, clean)
    : resolve(dirname(pagePath), clean);
  return existsSync(target) ? target : null;
}

function isImageAsset(ref) {
  const clean = ref.split("?")[0].split("#")[0];
  return /assets\/img\//.test(clean) && MIME[extname(clean).toLowerCase()];
}

const dataUriCache = new Map();

function dataUri(file) {
  if (dataUriCache.has(file)) return dataUriCache.get(file);
  const mime = MIME[extname(file).toLowerCase()] || "application/octet-stream";
  const buf = readFileSync(file);
  const uri = `data:${mime};base64,${buf.toString("base64")}`;
  dataUriCache.set(file, uri);
  return uri;
}

let inlinedAssets = 0;

/* Rewrites url(...) inside a stylesheet. */
function inlineCssUrls(css, cssFile) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, quote, ref) => {
    if (!isImageAsset(ref)) return whole;
    const clean = ref.split("?")[0].split("#")[0];
    const target = clean.startsWith("/")
      ? join(ROOT, clean)
      : resolve(dirname(cssFile), clean);
    if (!existsSync(target)) return whole;
    inlinedAssets++;
    return `url("${dataUri(target)}")`;
  });
}

let html = readFileSync(pagePath, "utf8");

/* ---- Stylesheets --------------------------------------------------------- */

let inlinedCss = 0;

html = html.replace(
  /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi,
  (tag) => {
    const href = /href=["']([^"']+)["']/i.exec(tag);
    if (!href) return tag;
    const file = localPath(href[1]);
    // The Google Fonts link is remote, so it falls through untouched.
    if (!file) return tag;
    const css = inlineCssUrls(readFileSync(file, "utf8"), file);
    inlinedCss++;
    return `<style>\n/* ${href[1]} */\n${css}\n</style>`;
  }
);

/* ---- Scripts ------------------------------------------------------------- */

let inlinedJs = 0;

html = html.replace(/<script\b([^>]*)>\s*<\/script>/gi, (tag, attrs) => {
  const src = /src=["']([^"']+)["']/i.exec(attrs);
  if (!src) return tag;
  const file = localPath(src[1]);
  if (!file) return tag;
  const js = readFileSync(file, "utf8");
  inlinedJs++;
  // A closing tag inside a string literal would end the block early.
  const safe = js.replace(/<\/script/gi, "<\\/script");
  return `<script>\n/* ${src[1]} */\n${safe}\n</script>`;
});

/* ---- Images -------------------------------------------------------------- */

html = html.replace(
  /(<(?:img|source|image)\b[^>]*?\b(?:src|srcset|href|xlink:href)=)(["'])([^"']+)\2/gi,
  (whole, head, quote, ref) => {
    if (!isImageAsset(ref)) return whole;
    const file = localPath(ref);
    if (!file) return whole;
    inlinedAssets++;
    return `${head}${quote}${dataUri(file)}${quote}`;
  }
);

/* Inline style attributes and inline <style> blocks written in the page. */
html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (whole, css) => {
  if (!/assets\/img\//.test(css)) return whole;
  return whole.replace(css, inlineCssUrls(css, pagePath));
});

html = html.replace(/style=(["'])([^"']*url\([^"']*)\1/gi, (whole, quote, css) => {
  if (!/assets\/img\//.test(css)) return whole;
  return `style=${quote}${inlineCssUrls(css, pagePath)}${quote}`;
});

/* ---- Write --------------------------------------------------------------- */

mkdirSync(DIST, { recursive: true });

const name = basename(pagePath, ".html").replace(/^[._]+/, "") || "page";
const out = join(DIST, `${name}-preview.html`);
writeFileSync(out, html, "utf8");

const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`Built dist/${name}-preview.html`);
console.log(
  `  ${inlinedCss} stylesheet(s), ${inlinedJs} script(s), ${inlinedAssets} asset(s) inlined. ${kb} KB.`
);
