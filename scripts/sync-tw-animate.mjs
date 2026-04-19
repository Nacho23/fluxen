import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "tw-animate-css", "dist", "tw-animate.css");
const dest = path.join(root, "app", "styles", "tw-animate.css");

if (!fs.existsSync(src)) {
  console.warn("[sync-tw-animate] omitido: no está instalado tw-animate-css");
  process.exit(0);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
