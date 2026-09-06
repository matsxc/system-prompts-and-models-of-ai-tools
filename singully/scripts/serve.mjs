/* ==========================================================================
   Sinगली. Static server.
   Zero dependencies. Serves the singully directory on port 4173.
   node scripts/serve.mjs [port]
   ========================================================================== */

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf"
};

function contentType(path) {
  return MIME[extname(path).toLowerCase()] || "application/octet-stream";
}

async function resolvePath(urlPath) {
  let clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (clean.endsWith("/")) clean += "index.html";

  const target = resolve(ROOT, "." + normalize(clean));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;

  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = join(target, "index.html");
      const indexInfo = await stat(index);
      return indexInfo.isFile() ? index : null;
    }
    return info.isFile() ? target : null;
  } catch (err) {
    // A bare path with no extension gets one chance at .html.
    if (!extname(target)) {
      try {
        const withHtml = target + ".html";
        const info = await stat(withHtml);
        if (info.isFile()) return withHtml;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

const server = createServer(async (req, res) => {
  const file = await resolvePath(req.url || "/");

  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentType(file),
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*"
  });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(file)
    .on("error", () => {
      res.end();
    })
    .pipe(res);
});

server.listen(PORT, () => {
  console.log(`Sin serve. ${ROOT}`);
  console.log(`http://localhost:${PORT}/`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
