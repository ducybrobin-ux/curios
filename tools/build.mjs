#!/usr/bin/env node
/* build.mjs — Script de build pour Curi>s
 *
 * Génère un dossier de distribution prêt à l'emploi.
 * Usage : node tools/build.mjs [--target windows|linux|all]
 */
import { mkdir, cp, writeFile, readFile, chmod } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Parse args
const args = process.argv.slice(2);
const targetIdx = args.indexOf("--target");
let target = "all";
if (targetIdx !== -1 && args[targetIdx + 1]) {
  target = args[targetIdx + 1];
}

const DIST = join(ROOT, "dist");
const DIST_NAME = "curios";

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function copyDir(src, dest, filter) {
  await ensureDir(dest);
  const { readdirSync, statSync } = await import("node:fs");
  const entries = readdirSync(src);
  for (const entry of entries) {
    if (filter && !filter(entry)) continue;
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      await cp(srcPath, destPath, { recursive: true });
    } else {
      await cp(srcPath, destPath);
    }
  }
}

async function build() {
  console.log(`Building Curi>s (${target})...`);

  // Clean dist
  const { rmSync } = await import("node:fs");
  try {
    rmSync(DIST, { recursive: true, force: true });
  } catch {
    // ignore
  }
  await mkdir(DIST, { recursive: true });

  const distDir = join(DIST, DIST_NAME);
  await ensureDir(distDir);

  // 1. Copy root files
  const rootFiles = [
    "README.md",
    "LICENSE",
    "LICENSE-DOCS.md",
    "NOTICE.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "CHANGELOG.md",
    "SECURITY.md",
    "demarrer_serveur.cmd",
    "index.html",
    "catalogue.html",
    "dashboard.html",
    "debriefing.html",
    "editeur.html",
    "atelier.html",
    "studio.html",
    "questionnaire.html",
    "sw.js",
    "manifest.json",
    "admin-data.json",
    "server.ps1",
  ];

  for (const file of rootFiles) {
    const src = join(ROOT, file);
    try {
      await cp(src, join(distDir, file));
    } catch {
      // File doesn't exist, skip
    }
  }

  // 2. Copy directories
  const dirs = ["css", "img", "js", "data", "content", "docs"];
  for (const dir of dirs) {
    const src = join(ROOT, dir);
    try {
      await cp(src, join(distDir, dir), { recursive: true });
    } catch {
      // Dir doesn't exist, skip
    }
  }

  // 3. Copy packages
  await ensureDir(join(distDir, "packages"));
  const pkgDirs = [
    "game-engine",
    "geolocation",
    "offline",
    "content-schema",
    "server",
    "studio",
    "analytics",
  ];
  for (const pkg of pkgDirs) {
    const src = join(ROOT, "packages", pkg);
    try {
      await cp(src, join(distDir, "packages", pkg), { recursive: true });
    } catch {
      // Dir doesn't exist, skip
    }
  }

  // 4. Copy tools
  await ensureDir(join(distDir, "tools"));
  try {
    await cp(join(ROOT, "tools"), join(distDir, "tools"), { recursive: true });
  } catch {
    // Dir doesn't exist
  }

  // 5. Create launcher scripts
  await createLauncherScripts(distDir);

  // 6. Create package.json at root
  await createRootPackageJson(distDir);

  // 7. Create README for distribution
  await createDistributionReadme(distDir);

  console.log(`Build complete: ${distDir}`);

  if (target === "windows" || target === "all") {
    await buildWindows(distDir);
  }

  if (target === "linux" || target === "all") {
    await buildLinux(distDir);
  }
}

async function createLauncherScripts(distDir) {
  // Windows batch file
  const batContent = `@echo off
echo ========================================
echo   Curi>s - Moteur de parcours éducatifs
echo ========================================
echo.
echo Demarrage du serveur...
echo Ouvrez http://localhost:8080 dans votre navigateur
echo.
node packages/server/src/cli.js
pause
`;

  await writeFile(join(distDir, "lancer-curios.bat"), batContent);

  // Linux shell script
  const shContent = `#!/bin/bash
echo "========================================"
echo "  Curi>s - Moteur de parcours éducatifs"
echo "========================================"
echo ""
echo "Démarrage du serveur..."
echo "Ouvrez http://localhost:8080 dans votre navigateur"
echo ""
node packages/server/src/cli.js
`;

  const shPath = join(distDir, "lancer-curios.sh");
  await writeFile(shPath, shContent);
  try {
    await chmod(shPath, 0o755);
  } catch {
    // chmod might fail on Windows
  }
}

async function createRootPackageJson(distDir) {
  const pkg = {
    name: "curios",
    version: "1.0.0",
    description:
      "Moteur universel pour créer et jouer des parcours éducatifs",
    type: "module",
    scripts: {
      start: "node packages/server/src/cli.js",
      "build:data": "node tools/build-data.mjs",
      "build:engine": "node tools/build-engine.mjs",
      "build:geo": "node tools/build-geo.mjs",
      "build:sw": "node tools/build-sw.mjs",
      "build:editions": "node tools/build-editions.mjs",
      "convert": "node tools/convert-packs.mjs",
      validate: "node tools/validate-parcours.mjs",
      test: "node --test tests/unit/*.test.mjs",
    },
    license: "AGPL-3.0",
  };

  await writeFile(
    join(distDir, "package.json"),
    JSON.stringify(pkg, null, 2)
  );
}

async function createDistributionReadme(distDir) {
  const readme = `# Curi>s — Distribution

## Démarrage rapide

### Windows
1. Double-cliquez sur \`lancer-curios.bat\`
2. Ouvrez http://localhost:8080 dans votre navigateur

### Linux / Raspberry Pi
1. Ouvrez un terminal
2. Exécutez \`./lancer-curios.sh\`
3. Ouvrez http://localhost:8080 dans votre navigateur

### Manuellement
\`\`\`bash
node packages/server/src/cli.js
\`\`\`

## Structure

\`\`\`
curios/
├── lancer-curios.bat    (Windows)
├── lancer-curios.sh     (Linux/RPi)
├── index.html           (Interface joueur)
├── dashboard.html       (Dashboard organisateur)
├── studio.html          (Studio de création)
├── packages/            (Modules ES)
├── content/             (Parcours disponibles)
├── tools/               (CLI de build)
└── docs/                (Documentation)
\`\`\`

## Parcours inclus

- Biais cognitifs (8 balises)
- CEMÉA NPDC (11 balises)
- Cristaux de Balto (9 balises)
- TSLE1 ornithologie (10 balises)

## Besoin d'aide ?

Voir docs/GUIDE_FORMATEUR.md
`;

  await writeFile(join(distDir, "README_DISTRIBUTION.md"), readme);
}

async function buildWindows(distDir) {
  console.log("Building Windows distribution...");
  const winDir = join(DIST, "curios-windows");
  await ensureDir(winDir);

  // Copy dist
  await cp(distDir, winDir, { recursive: true });

  // Create zip-like structure (manual for cross-platform)
  console.log(`Windows build: ${winDir}`);
  console.log(
    "Note: Use 7-Zip or PowerShell Compress-Archive to create .zip"
  );
}

async function buildLinux(distDir) {
  console.log("Building Linux/Raspberry Pi distribution...");
  const linuxDir = join(DIST, "curios-linux");
  await ensureDir(linuxDir);

  // Copy dist
  await cp(distDir, linuxDir, { recursive: true });

  console.log(`Linux build: ${linuxDir}`);
  console.log("Note: Use tar to create .tar.gz");
}

// Run
build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
