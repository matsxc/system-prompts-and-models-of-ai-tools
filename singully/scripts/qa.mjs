/* ==========================================================================
   Sinगली. QA screenshots.

   Starts scripts/serve.mjs, opens every html file in the project root at
   390, 1024 and 1440, waits for the network to settle plus 2.5s for the
   preloader to finish, writes full page screenshots to qa/, and prints any
   console error the page produced.

   node scripts/qa.mjs                 every page
   node scripts/qa.mjs _template.html  one page

   Uses the browser already on this machine. Never runs playwright install.
   ========================================================================== */

import { execFileSync, spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const QA = join(ROOT, "qa");
const PORT = Number(process.env.PORT || 4173);
const WIDTHS = process.env.WIDTHS ? process.env.WIDTHS.split(",").map(Number) : [390, 1024, 1440];
const SETTLE_MS = 2500;

/* ---- Web fonts ----------------------------------------------------------
   This sandbox reaches the network through a proxy the browser does not
   read, so fonts.googleapis.com is fetched here and handed to the page.
   Nothing about the page changes: the Google Fonts link tag stays exactly
   as written, it is only served from this side.
   -------------------------------------------------------------------------- */

const FONT_HOSTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/141.0.0.0 Safari/537.36";

const fontCache = new Map();
let fontFetchWorks = true;

function fetchExternal(url) {
  if (fontCache.has(url)) return fontCache.get(url);

  const stem = join(tmpdir(), "sin-qa-" + Math.abs(hash(url)).toString(36));
  const bodyFile = stem + ".bin";
  const headFile = stem + ".head";

  try {
    execFileSync(
      "curl",
      ["-sS", "-L", "--max-time", "25", "-A", UA, "-D", headFile, "-o", bodyFile, url],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    const headers = readFileSync(headFile, "utf8");
    const ct = /content-type:\s*([^\r\n]+)/i.exec(headers);
    const result = {
      body: readFileSync(bodyFile),
      contentType: ct ? ct[1].trim() : "application/octet-stream"
    };
    fontCache.set(url, result);
    return result;
  } catch (err) {
    fontFetchWorks = false;
    return null;
  } finally {
    try {
      rmSync(bodyFile, { force: true });
      rmSync(headFile, { force: true });
    } catch (err) {
      /* nothing to clean up */
    }
  }
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h;
}

async function serveFonts(context) {
  await context.route(FONT_HOSTS, async (route) => {
    const url = route.request().url();
    const asset = fetchExternal(url);
    if (asset) {
      await route.fulfill({
        status: 200,
        contentType: asset.contentType,
        headers: { "access-control-allow-origin": "*" },
        body: asset.body
      });
      return;
    }
    // Nothing to serve. Answer empty rather than failing the request, so a
    // sandbox with no route out does not read as a page error.
    await route.fulfill({ status: 200, contentType: "text/css", body: "" });
  });
}

/* ---- Find the browser binary -------------------------------------------- */

function findChromium() {
  const base = "/opt/pw-browsers/chromium";
  const candidates = [
    base,
    join(base, "chrome-linux", "chrome"),
    join(base, "chrome-linux", "headless_shell"),
    join(base, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium")
  ];

  for (const c of candidates) {
    try {
      if (existsSync(c) && statSync(c).isFile()) return realpathSync(c);
    } catch (err) {
      /* keep looking */
    }
  }

  // The path may be a directory or a symlink to one. Walk it for the binary.
  const names = new Set(["chrome", "headless_shell", "chromium", "Chromium"]);
  const stack = [base];
  const seen = new Set();

  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      continue;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (seen.has(full)) continue;
      seen.add(full);
      let info;
      try {
        info = statSync(full);
      } catch (err) {
        continue;
      }
      if (info.isDirectory()) {
        stack.push(full);
      } else if (info.isFile() && names.has(entry.name)) {
        return realpathSync(full);
      }
    }
  }

  return null;
}

/* ---- Pages --------------------------------------------------------------- */

function pages() {
  const asked = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (asked.length) {
    return asked
      .map((a) => a.replace(/^\/+/, ""))
      .filter((a) => {
        const ok = existsSync(join(ROOT, a));
        if (!ok) console.log(`  skipped, no such page yet: ${a}`);
        return ok;
      });
  }
  return readdirSync(ROOT)
    .filter((f) => f.endsWith(".html"))
    .sort();
}

/* ---- Server -------------------------------------------------------------- */

function startServer() {
  return new Promise((res, rej) => {
    const proc = spawn(process.execPath, [join(HERE, "serve.mjs"), String(PORT)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        res(proc);
      }
    }, 1200);

    proc.stdout.on("data", (chunk) => {
      if (String(chunk).includes("localhost") && !settled) {
        settled = true;
        clearTimeout(timer);
        res(proc);
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      rej(err);
    });
  });
}

/* ---- Run ----------------------------------------------------------------- */

async function run() {
  const list = pages();
  if (!list.length) {
    console.log("No pages to shoot yet.");
    return 0;
  }

  const executablePath = findChromium();
  if (!executablePath) {
    console.error("No chromium binary found under /opt/pw-browsers/chromium.");
    return 1;
  }
  console.log(`Browser: ${executablePath}`);

  mkdirSync(QA, { recursive: true });
  const server = await startServer();

  let browser;
  let failures = 0;

  try {
    browser = await chromium.launch({
      executablePath,
      // This build has dropped old headless, which is what Playwright asks
      // for by default. Swap it for the new one rather than installing.
      ignoreDefaultArgs: ["--headless=old", "--headless"],
      args: [
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--mute-audio",
        "--font-render-hinting=none"
      ]
    });

    for (const page of list) {
      const name = page.replace(/\.html$/, "").replace(/^_/, "");

      for (const width of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width, height: width < 720 ? 844 : 900 },
          deviceScaleFactor: 1,
          // A phone width should behave like a phone, so the cursor and the
          // hover only sequences stay out of the shot.
          hasTouch: width < 720,
          isMobile: width < 720,
          reducedMotion: "no-preference"
        });
        await serveFonts(context);
        const tab = await context.newPage();

        const errors = [];
        tab.on("console", (msg) => {
          if (msg.type() === "error") errors.push(msg.text());
        });
        tab.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

        const url = `http://localhost:${PORT}/${page}`;
        try {
          await tab.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        } catch (err) {
          try {
            await tab.goto(url, { waitUntil: "load", timeout: 30000 });
          } catch (err2) {
            console.log(`  ${page} @ ${width} could not load: ${err2.message}`);
            failures++;
            await context.close();
            continue;
          }
        }

        // Let the preloader finish and the arrival curtain lift.
        await tab.waitForTimeout(SETTLE_MS);

        // Walk the page so every scroll bound reveal has played, then return
        // to the top so pinned chapters settle before the full page capture.
        await tab.evaluate(async () => {
          const step = Math.round(window.innerHeight * 0.4);
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          const total = () => document.documentElement.scrollHeight;
          for (let y = 0; y < total(); y += step) {
            window.scrollTo(0, y);
            await sleep(70);
          }
          window.scrollTo(0, total());
          await sleep(400);
          window.scrollTo(0, 0);
          await sleep(500);
        });

        const out = join(QA, `${name}-${width}.png`);
        await tab.screenshot({ path: out, fullPage: true });

        // FRAMES=1 also writes viewport frames every 90vh, which is how a
        // visitor actually sees pinned chapters and mid scroll states.
        if (process.env.FRAMES) {
          const total = await tab.evaluate(() => document.documentElement.scrollHeight);
          const vh = await tab.evaluate(() => window.innerHeight);
          let i = 0;
          for (let y = 0; y < total; y += Math.round(vh * 0.9)) {
            await tab.evaluate((yy) => window.scrollTo(0, yy), y);
            await tab.waitForTimeout(650);
            await tab.screenshot({ path: join(QA, `${name}-${width}-f${String(i++).padStart(2, "0")}.png`) });
          }
        }

        if (errors.length) {
          failures += errors.length;
          console.log(`  ${page} @ ${width}: ${errors.length} console error(s)`);
          errors.forEach((e) => console.log(`    ${e}`));
        } else {
          console.log(`  ${page} @ ${width}: clean`);
        }

        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }

  console.log("");
  if (!fontFetchWorks) {
    console.log(
      "Note: web fonts could not be fetched, so screenshots show fallback faces."
    );
  }
  console.log(
    failures === 0
      ? `QA clean. ${list.length} page(s), ${list.length * WIDTHS.length} screenshots in qa/`
      : `QA finished with ${failures} console error(s). Screenshots in qa/`
  );
  return failures === 0 ? 0 : 1;
}

run().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
