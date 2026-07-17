const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const distReleaseDir = path.join(rootDir, "dist-release");
const tempOutputDir = path.join(rootDir, "dist-builder");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const finalInstallerName = `大龙工具中枢-Setup-${packageJson.version}-x64.exe`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function removeIfExists(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function cleanupExtraFiles() {
  removeIfExists(path.join(distDir, "win-unpacked"));
  removeIfExists(path.join(distDir, "builder-debug.yml"));
  removeIfExists(path.join(distDir, "latest.yml"));

  if (!fs.existsSync(distDir)) {
    return;
  }

  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".blockmap")) {
      removeIfExists(path.join(distDir, entry.name));
    }
  }
}

console.log("[1/4] Closing running app processes...");
spawnSync("taskkill", ["/F", "/IM", "electron.exe"], { stdio: "ignore", shell: false });
spawnSync("taskkill", ["/F", "/IM", "大龙工具中枢.exe"], { stdio: "ignore", shell: false });

console.log("[2/4] Removing old build folders...");
removeIfExists(distDir);
removeIfExists(distReleaseDir);
removeIfExists(tempOutputDir);
fs.mkdirSync(distDir, { recursive: true });

console.log("[3/4] Building installer package...");
if (process.platform === "win32") {
  run(process.env.ComSpec || "cmd.exe", [
    "/d",
    "/s",
    "/c",
    `npx electron-builder --win nsis --x64 --config.directories.output="${tempOutputDir}"`,
  ]);
} else {
  run("npx", ["electron-builder", "--win", "nsis", "--x64", `--config.directories.output=${tempOutputDir}`]);
}

console.log("[4/4] Cleaning extra build files...");
for (let index = 0; index < 6; index += 1) {
  cleanupExtraFiles();
  sleep(300);
}

const builtInstallerPath = path.join(tempOutputDir, finalInstallerName);
if (!fs.existsSync(builtInstallerPath)) {
  throw new Error(`Installer not found: ${builtInstallerPath}`);
}

fs.copyFileSync(builtInstallerPath, path.join(distDir, finalInstallerName));
removeIfExists(tempOutputDir);

console.log("");
console.log("Build finished.");
console.log(`Output: dist\\${finalInstallerName}`);
