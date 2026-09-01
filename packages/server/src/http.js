/* http.js — Utilitaires HTTP (response helpers, MIME types, path resolution)
 *
 * Pas de dépendances externes — Node.js natif uniquement.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

export function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-cache",
  });
  res.end(body);
}

export function sendError(res, status, message) {
  sendJson(res, status, { ok: false, error: message });
}

export function sendOk(res, extra = {}) {
  sendJson(res, 200, { ok: true, ...extra });
}

export function send405(res) {
  sendJson(res, 405, { ok: false, error: "method-not-allowed" });
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function parseJson(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export function resolvePathSafe(root, target) {
  let relative = target.replace(/\?.*$/, "").replace(/#.*$/, "");
  relative = relative.replace(/^https?:\/\/[^/]+/, "");
  if (!relative || relative === "/") relative = "/index.html";

  const parts = relative.split("?")[0].split("#")[0];
  let decoded;
  try {
    decoded = decodeURIComponent(parts);
  } catch {
    decoded = parts;
  }

  const full = path.resolve(root, decoded.replace(/^\//, ""));
  if (!full.startsWith(root)) return null;

  // URLs sans extension : si le fichier exact n'existe pas mais qu'une page
  // <nom>.html existe, on la sert (ex. /editeur → /editeur.html, /atelier → /atelier.html).
  if (!fs.existsSync(full) && !path.extname(decoded)) {
    const withHtml = full + ".html";
    if (fs.existsSync(withHtml)) return withHtml;
    return null;
  }
  if (!fs.existsSync(full)) return null;
  return full;
}

export function serveFile(res, filePath, root) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": mime,
      "X-Content-Type-Options": "nosniff",
      "Content-Length": stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
}

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
