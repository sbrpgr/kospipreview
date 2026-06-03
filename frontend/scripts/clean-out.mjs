import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const outDirectory = resolve(process.cwd(), "out");

try {
  if (!existsSync(outDirectory)) {
    console.log("No frontend/out directory to clean.");
    process.exit(0);
  }

  rmSync(outDirectory, { recursive: true, force: true });
  console.log("Cleaned frontend/out.");
} catch (error) {
  console.error("Failed to clean frontend/out.");
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
}
