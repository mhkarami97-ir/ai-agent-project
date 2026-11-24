import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const IGNORED_DIRS = new Set([
  ".git",
  ".github",
  "node_modules",
  "dist",
  "scripts",
  ".vscode",
  ".idea",
]);

const IGNORED_FILES = new Set([
  ".gitignore",
  "package.json",
  "package-lock.json",
  "README.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "LICENSE",
]);

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const baseName = path.basename(src);
    if (IGNORED_DIRS.has(baseName)) return;
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const baseName = path.basename(src);
    if (IGNORED_FILES.has(baseName)) return;
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

function getAllFiles(dir, filterExt = null) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, filterExt));
    } else if (entry.isFile()) {
      if (!filterExt || filterExt.includes(path.extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function computeHash(content) {
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
}

function run() {
  const startTime = Date.now();
  console.log("🚀 Starting production build with asset hashing...");

  // 1. Clean dist and copy source files
  console.log("📦 Copying project files to dist/...");
  cleanDir(distDir);
  copyRecursive(rootDir, distDir);

  // Ensure .nojekyll exists so GitHub Pages won't ignore folders or underscore files
  const nojekyllPath = path.join(distDir, ".nojekyll");
  if (!fs.existsSync(nojekyllPath)) {
    fs.writeFileSync(nojekyllPath, "");
  }

  // 2. Identify assets to hash (CSS, JS) excluding sw.js (sw.js must keep fixed URL)
  const candidateFiles = getAllFiles(distDir, [".css", ".js"]);
  const assetMap = new Map(); // originalFullPath -> hashedFullPath
  let totalHashesCombined = "";

  for (const filePath of candidateFiles) {
    const relFromDist = path.relative(distDir, filePath).replace(/\\/g, "/");
    // sw.js must retain its exact path at /sw.js
    if (relFromDist === "sw.js") continue;

    const content = fs.readFileSync(filePath);
    const hash = computeHash(content);
    totalHashesCombined += hash;

    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const hashedName = `${baseName}.${hash}${ext}`;
    const hashedPath = path.join(path.dirname(filePath), hashedName);

    // Write hashed version
    fs.writeFileSync(hashedPath, content);
    assetMap.set(filePath, hashedPath);
  }

  console.log(`✨ Generated ${assetMap.size} hashed assets.`);

  // 3. Update references in CSS files (e.g. url(...) imports)
  const cssFiles = getAllFiles(distDir, [".css"]);
  for (const cssFile of cssFiles) {
    let content = fs.readFileSync(cssFile, "utf-8");
    let changed = false;

    content = content.replace(/url\(\s*['"]?([^'")#?]+)(#[^')]*)?(\?[^')]*)?['"]?\s*\)/g, (match, urlPath, hashPart, queryPart) => {
      if (urlPath.startsWith("http://") || urlPath.startsWith("https://") || urlPath.startsWith("data:") || urlPath.startsWith("//")) {
        return match;
      }
      const dir = path.dirname(cssFile);
      const targetAbs = path.resolve(dir, urlPath);
      const hashedAbs = assetMap.get(targetAbs);
      if (hashedAbs) {
        changed = true;
        let newRel = path.relative(dir, hashedAbs).replace(/\\/g, "/");
        if (!newRel.startsWith(".") && !newRel.startsWith("/")) newRel = "./" + newRel;
        return `url("${newRel}")`;
      }
      return match;
    });

    if (changed) {
      fs.writeFileSync(cssFile, content, "utf-8");
    }
  }

  // 4. Update references in all HTML files
  const htmlFiles = getAllFiles(distDir, [".html"]);
  let htmlReplacements = 0;

  for (const htmlFile of htmlFiles) {
    let content = fs.readFileSync(htmlFile, "utf-8");
    const htmlDir = path.dirname(htmlFile);

    // Replace link href and script src
    const replaceAttr = (attr) => {
      const regex = new RegExp(`(${attr}\\s*=\\s*["'])([^"'>]+)(["'])`, "gi");
      content = content.replace(regex, (match, prefix, urlVal, suffix) => {
        if (
          urlVal.startsWith("http://") ||
          urlVal.startsWith("https://") ||
          urlVal.startsWith("//") ||
          urlVal.startsWith("#") ||
          urlVal.startsWith("mailto:")
        ) {
          return match;
        }

        const cleanUrl = urlVal.split("?")[0].split("#")[0];
        let targetAbs;
        const isRootRelative = cleanUrl.startsWith("/");

        if (isRootRelative) {
          targetAbs = path.join(distDir, cleanUrl.slice(1));
        } else {
          targetAbs = path.resolve(htmlDir, cleanUrl);
        }

        const hashedAbs = assetMap.get(targetAbs);
        if (hashedAbs) {
          htmlReplacements++;
          if (isRootRelative) {
            const newRootRel = "/" + path.relative(distDir, hashedAbs).replace(/\\/g, "/");
            return `${prefix}${newRootRel}${suffix}`;
          } else {
            let newRel = path.relative(htmlDir, hashedAbs).replace(/\\/g, "/");
            if (!newRel.startsWith(".") && !newRel.startsWith("/")) newRel = "./" + newRel;
            return `${prefix}${newRel}${suffix}`;
          }
        }
        return match;
      });
    };

    replaceAttr("src");
    replaceAttr("href");

    fs.writeFileSync(htmlFile, content, "utf-8");
  }

  console.log(`🔗 Rewrote ${htmlReplacements} asset links across ${htmlFiles.length} HTML files.`);

  // 5. Update sw.js in dist
  const swPath = path.join(distDir, "sw.js");
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, "utf-8");
    const globalBuildHash = computeHash(totalHashesCombined || Date.now().toString());

    // Update CACHE_NAME using package.json version
    let version = "2.3.0";
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
      if (pkg.version) version = pkg.version;
    } catch (e) {}

    swContent = swContent.replace(
      /const CACHE_NAME\s*=\s*["'][^"']+["'];/,
      `const CACHE_NAME = "web-tools-v${version}-${globalBuildHash}";`
    );

    // Update urlsToCache with hashed paths
    for (const [origPath, hashedPath] of assetMap.entries()) {
      const origRel = "/" + path.relative(distDir, origPath).replace(/\\/g, "/");
      const hashedRel = "/" + path.relative(distDir, hashedPath).replace(/\\/g, "/");

      // Replace exact occurrences inside urlsToCache
      const escapedOrig = origRel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      swContent = swContent.replace(new RegExp(`"${escapedOrig}"`, "g"), `"${hashedRel}"`);
      swContent = swContent.replace(new RegExp(`'${escapedOrig}'`, "g"), `'${hashedRel}'`);
    }

    fs.writeFileSync(swPath, swContent, "utf-8");
    console.log(`⚙️  Updated sw.js with CACHE_NAME: web-tools-v${version}-${globalBuildHash}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Build completed in ${duration}s! Output directory: dist/`);
}

run();
