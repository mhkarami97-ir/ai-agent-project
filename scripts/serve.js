import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const isDist = process.argv.includes("--dist");
const baseDir = isDist ? path.join(rootDir, "dist") : rootDir;
const defaultPort = isDist ? 4173 : 3000;
const port = Number(process.env.PORT) || defaultPort;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  let filePath = path.join(baseDir, reqPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(baseDir)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("Forbidden");
  }

  // Handle directory requests
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("404 Not Found");
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";

  const headers = {
    "Content-Type": mime,
    "Access-Control-Allow-Origin": "*",
  };

  // In dev mode, disable caching so local changes apply immediately
  if (!isDist) {
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  } else if (filePath.match(/\.[a-f0-9]{8}\.(css|js)$/)) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else {
    headers["Cache-Control"] = "no-cache";
  }

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  const mode = isDist ? "PREVIEW (dist)" : "DEVELOPMENT (root)";
  console.log(`📡 Server running in ${mode} mode`);
  console.log(`🔗 Local URL: http://localhost:${port}`);
  console.log(`💡 Press Ctrl+C to stop`);
});
