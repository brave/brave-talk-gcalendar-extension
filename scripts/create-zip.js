import { unlink, rename } from "node:fs/promises";
import { createWriteStream, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";
import packageJson from "../package.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = packageJson.version;
const distDir = join(__dirname, "..", "dist");
const outputPath = join(__dirname, "..", `${version}.zip`);
const tempOutputPath = join(__dirname, "..", `${version}.zip.tmp`);

async function unlinkIfExists(path) {
  if (existsSync(path)) {
    await unlink(path);
    console.log(`Cleaned up ${path}`);
    return true;
  }

  return false;
}

async function onStreamClose(archive) {
  try {
    await unlinkIfExists(outputPath);
    await rename(tempOutputPath, outputPath);
    console.log(`✅ Created ${version}.zip (${archive.pointer()} total bytes)`);
  } catch (error) {
    console.error("Error finalizing zip file:", error);
    await unlinkIfExists(tempOutputPath);
    process.exit(1);
  }
}

function onArchiveWarning(err) {
  if (err.code === "ENOENT") {
    console.warn("Warning:", err);
    return;
  }

  throw err;
}

async function onArchiveError(err) {
  console.error("Archive error:", err);
  await unlinkIfExists(tempOutputPath);
  throw err;
}

async function createZip() {
  if (!existsSync(distDir)) {
    console.error(
      "Error: dist directory does not exist. Please run the build first."
    );
    process.exit(1);
  }

  await unlinkIfExists(tempOutputPath);

  const output = createWriteStream(tempOutputPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", onArchiveError);
  archive.on("warning", onArchiveWarning);
  output.on("close", () => onStreamClose(archive));

  archive.pipe(output);
  archive.directory(distDir, false);
  archive.finalize();
}

createZip().catch(console.error);
