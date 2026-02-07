#!/usr/bin/env node

/**
 * Automated pipeline: build mods → launch game → export data → build website.
 *
 * Usage:  node scripts/update-website.mjs
 *
 * Replaces the manual sequence of run_modded.bat → close game →
 * export-data.bat → pnpm build.
 */

import { execSync, spawn } from "node:child_process";
import {
  existsSync,
  readFileSync,
  copyFileSync,
  cpSync,
  mkdirSync,
  unlinkSync,
  statSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const isWin = process.platform === "win32";

const TOTAL_STEPS = 9;
let currentStep = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

function step(label) {
  currentStep++;
  const t = new Date().toLocaleTimeString();
  console.log(`\n[${currentStep}/${TOTAL_STEPS}] ${label}  (${t})`);
}

function fail(msg) {
  console.error(`\n[ERROR] ${msg}`);
  process.exit(1);
}

function elapsed(startMs) {
  return ((Date.now() - startMs) / 1000).toFixed(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Step helpers ─────────────────────────────────────────────────────────────

function resolveGameDir() {
  const propsPath = join(ROOT, "Directory.Build.props.user");
  if (existsSync(propsPath)) {
    const xml = readFileSync(propsPath, "utf-8");
    const m = xml.match(/<GameDir>([^<]+)<\/GameDir>/i);
    if (m) return m[1].trim();
  }
  if (process.env.TENMAN_GAME_DIR) return process.env.TENMAN_GAME_DIR;
  fail(
    "GameDir not configured.\n" +
      "Set it in Directory.Build.props.user or TENMAN_GAME_DIR env var.",
  );
}

function checkPrerequisites(gameDir) {
  const exe = join(gameDir, "10ManIdle.exe");
  if (!existsSync(exe)) fail(`Game executable not found: ${exe}`);

  try {
    execSync("dotnet --version", { stdio: "pipe" });
  } catch {
    fail("dotnet CLI not found on PATH.");
  }

  try {
    execSync("pnpm --version", { stdio: "pipe" });
  } catch {
    fail("pnpm not found on PATH.");
  }

  // Check if game is already running
  if (isWin) {
    try {
      const out = execSync("tasklist /FI \"IMAGENAME eq 10ManIdle.exe\" /NH", {
        stdio: "pipe",
        encoding: "utf-8",
      });
      if (out.includes("10ManIdle.exe"))
        fail("10ManIdle.exe is already running. Close it first.");
    } catch {
      // tasklist failed — assume not running
    }
  } else {
    try {
      execSync("pgrep -x 10ManIdle", { stdio: "pipe" });
      fail("10ManIdle is already running. Close it first.");
    } catch {
      // pgrep returns non-zero when no match — that's fine
    }
  }
}

function cleanExport(gameDir) {
  const db = join(gameDir, "Mods", "export", "10man-idle.db");
  const log = join(gameDir, "Mods", "modloader.log");

  for (const f of [db, log]) {
    if (existsSync(f)) {
      unlinkSync(f);
      console.log(`  Deleted ${f}`);
    }
  }
}

function buildMods(gameDir) {
  const sln = join(ROOT, "mods", "10ManIdle-Mods.sln");
  // Use publish so NuGet dependencies (Harmony, SQLite) are copied to output.
  // dotnet build alone leaves them in the NuGet cache.
  execSync(`dotnet publish "${sln}" -c Debug -p:GameDir="${gameDir}"`, {
    stdio: "inherit",
  });
}

function copyModFiles(gameDir) {
  const modsBase = join(ROOT, "mods", "src");
  const modLoaderBin = join(modsBase, "ModLoader", "bin", "Debug", "net8.0", "publish");
  const speedModBin = join(modsBase, "SpeedMod", "bin", "Debug", "net8.0", "publish");
  const dataExpBin = join(modsBase, "DataExporter", "bin", "Debug", "net8.0", "publish");

  const pluginsDir = join(gameDir, "Mods", "plugins");
  const configDir = join(gameDir, "Mods", "config");
  mkdirSync(pluginsDir, { recursive: true });
  mkdirSync(configDir, { recursive: true });

  // Game root DLLs
  const rootFiles = [
    [join(modLoaderBin, "ModLoader.dll"), join(gameDir, "ModLoader.dll")],
    [join(speedModBin, "0Harmony.dll"), join(gameDir, "0Harmony.dll")],
  ];

  // Plugin DLLs
  const pluginFiles = [
    [join(speedModBin, "SpeedMod.dll"), join(pluginsDir, "SpeedMod.dll")],
    [join(dataExpBin, "DataExporter.dll"), join(pluginsDir, "DataExporter.dll")],
    [
      join(dataExpBin, "Microsoft.Data.Sqlite.dll"),
      join(pluginsDir, "Microsoft.Data.Sqlite.dll"),
    ],
    [
      join(dataExpBin, "SQLitePCLRaw.core.dll"),
      join(pluginsDir, "SQLitePCLRaw.core.dll"),
    ],
    [
      join(dataExpBin, "SQLitePCLRaw.batteries_v2.dll"),
      join(pluginsDir, "SQLitePCLRaw.batteries_v2.dll"),
    ],
    [
      join(dataExpBin, "SQLitePCLRaw.provider.e_sqlite3.dll"),
      join(pluginsDir, "SQLitePCLRaw.provider.e_sqlite3.dll"),
    ],
  ];

  for (const [src, dest] of [...rootFiles, ...pluginFiles]) {
    copyFileSync(src, dest);
    console.log(`  ${dest}`);
  }

  // runtimes directory (recursive copy to plugins dir for completeness)
  const runtimesSrc = join(dataExpBin, "runtimes");
  if (existsSync(runtimesSrc)) {
    const runtimesDest = join(pluginsDir, "runtimes");
    cpSync(runtimesSrc, runtimesDest, { recursive: true });
    console.log(`  ${runtimesDest} (recursive)`);
  }

  // Copy native e_sqlite3 directly into game root — the plugin assembly loader
  // bypasses .deps.json probing, so the runtimes/{rid}/native/ convention
  // doesn't work. Placing the native DLL next to the exe ensures DllImport
  // finds it via the standard OS search order.
  const rid = isWin
    ? process.arch === "x64" ? "win-x64"
    : process.arch === "arm64" ? "win-arm64"
    : `win-${process.arch}`
    : `${process.platform}-${process.arch}`;
  const nativeExt = isWin ? "e_sqlite3.dll" : process.platform === "darwin" ? "libe_sqlite3.dylib" : "libe_sqlite3.so";
  const nativeSrc = join(runtimesSrc, rid, "native", nativeExt);
  if (existsSync(nativeSrc)) {
    copyFileSync(nativeSrc, join(gameDir, nativeExt));
    console.log(`  ${join(gameDir, nativeExt)} (native sqlite)`);
  }

  // SpeedMod config — only if not already present
  const speedCfgDest = join(configDir, "SpeedMod.json");
  if (!existsSync(speedCfgDest)) {
    const speedCfgSrc = join(ROOT, "mods", "config", "SpeedMod.json");
    copyFileSync(speedCfgSrc, speedCfgDest);
    console.log(`  ${speedCfgDest} (initial config)`);
  }
}

async function launchAndExport(gameDir) {
  const exe = join(gameDir, "10ManIdle.exe");
  const logPath = join(gameDir, "Mods", "modloader.log");
  const dbPath = join(gameDir, "Mods", "export", "10man-idle.db");

  const child = spawn(exe, [], {
    cwd: gameDir,
    detached: false,
    stdio: "ignore",
    env: {
      ...process.env,
      DOTNET_STARTUP_HOOKS: join(gameDir, "ModLoader.dll"),
    },
  });

  child.on("error", (err) => fail(`Failed to launch game: ${err.message}`));

  const TIMEOUT_MS = 60_000;
  const POLL_MS = 1_000;
  const start = Date.now();

  console.log("  Waiting for export to complete (timeout: 60s)...");

  while (Date.now() - start < TIMEOUT_MS) {
    await sleep(POLL_MS);

    if (existsSync(logPath)) {
      let log;
      try {
        log = readFileSync(logPath, "utf-8");
      } catch {
        // File may be locked briefly — retry next tick
        continue;
      }

      if (log.includes("Export failed")) {
        // Extract the error line for diagnostic output
        const line = log
          .split("\n")
          .find((l) => l.includes("Export failed"));
        fail(`DataExporter reported failure:\n  ${line}`);
      }

      if (log.includes("Export complete") && existsSync(dbPath)) {
        console.log(`  Export complete after ${elapsed(start)}s`);
        return child;
      }
    }
  }

  // Timed out — kill and fail
  killProcess(child);
  fail("Timed out waiting for data export (60s).");
}

function killProcess(child) {
  try {
    if (isWin) {
      execSync(`taskkill /pid ${child.pid} /f /t`, { stdio: "pipe" });
    } else {
      child.kill("SIGKILL");
    }
  } catch {
    // Process may have already exited
  }
}

async function killGame(child) {
  killProcess(child);
  console.log("  Waiting for file locks to release...");
  await sleep(2000);
}

function copyDatabase(gameDir) {
  const src = join(gameDir, "Mods", "export", "10man-idle.db");
  if (!existsSync(src)) fail(`Export DB not found: ${src}`);

  const size = statSync(src).size;
  if (size < 4096) fail(`Export DB is suspiciously small (${size} bytes).`);
  console.log(`  Source DB: ${(size / 1024).toFixed(0)} KB`);

  const targets = [
    join(ROOT, "data", "10man-idle.db"),
  ];

  for (const dest of targets) {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`  -> ${dest}`);
  }
}

function buildWebsite() {
  const websiteDir = join(ROOT, "website");

  if (!existsSync(join(websiteDir, "node_modules"))) {
    console.log("  Installing dependencies...");
    execSync("pnpm install --frozen-lockfile", {
      cwd: websiteDir,
      stdio: "inherit",
    });
  }

  execSync("pnpm build", { cwd: websiteDir, stdio: "inherit" });
}

function verify() {
  const distDir = join(ROOT, "website", "dist");
  const sections = [
    "items",
    "gathering",
    "recipes",
    "dungeons",
    "raids",
    "quests",
    "classes",
    "suffixes",
    "mechanics",
  ];

  const checks = [];

  // Index page
  const indexPath = join(distDir, "index.html");
  const indexExists = existsSync(indexPath);
  checks.push({ name: "dist/index.html exists", ok: indexExists });

  if (indexExists) {
    const html = readFileSync(indexPath, "utf-8");
    checks.push({
      name: 'index.html contains "10-Man Codex"',
      ok: html.includes("10-Man Codex"),
    });
  }

  // Section pages
  for (const section of sections) {
    const p = join(distDir, section, "index.html");
    checks.push({ name: `${section}/index.html exists`, ok: existsSync(p) });
  }

  console.log("\n  Verification:");
  let allPassed = true;
  for (const c of checks) {
    const icon = c.ok ? "PASS" : "FAIL";
    console.log(`    [${icon}] ${c.name}`);
    if (!c.ok) allPassed = false;
  }

  if (!allPassed) fail("One or more verification checks failed.");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log("=== 10-Man Idle: website update pipeline ===");

  // Step 0: resolve + prerequisites
  step("Checking prerequisites...");
  const gameDir = resolveGameDir();
  console.log(`  Game directory: ${gameDir}`);
  checkPrerequisites(gameDir);
  console.log("  All prerequisites OK");

  // Step 1: clean
  step("Cleaning old export artifacts...");
  cleanExport(gameDir);

  // Step 2: build mods
  step("Building mods...");
  const buildStart = Date.now();
  buildMods(gameDir);
  console.log(`  Build completed in ${elapsed(buildStart)}s`);

  // Step 3: copy DLLs
  step("Copying mod files to game directory...");
  copyModFiles(gameDir);

  // Step 4: launch + poll
  step("Launching game and waiting for data export...");
  const child = await launchAndExport(gameDir);

  // Step 5: kill game
  step("Closing game...");
  await killGame(child);

  // Step 6: copy DB
  step("Copying database to repo...");
  copyDatabase(gameDir);

  // Step 7: build website
  step("Building website...");
  const siteStart = Date.now();
  buildWebsite();
  console.log(`  Site built in ${elapsed(siteStart)}s`);

  // Step 8: verify
  step("Verifying output...");
  verify();

  console.log(`\n=== Pipeline complete in ${elapsed(t0)}s ===`);
}

main().catch((err) => {
  console.error("\n[FATAL]", err);
  process.exit(1);
});
