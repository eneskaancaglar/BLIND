import sharp from "sharp";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "public", "cards", "sheet-source.png");

const outDir = path.join(root, "public", "cards");
await mkdir(outDir, { recursive: true });

const meta = await sharp(source).metadata();
const cols = 7;
const rows = 3;
const cellW = meta.width / cols;
const cellH = meta.height / rows;

/** Best cell per rank from the 7×3 sprite sheet */
const MAP = {
  back: { row: 2, col: 6 },
  A: { row: 0, col: 0 },
  "2": { row: 0, col: 2 },
  "3": { row: 0, col: 3 },
  "4": { row: 0, col: 4 },
  "5": { row: 0, col: 5 },
  "6": { row: 0, col: 6 },
  "7": { row: 1, col: 2 },
  "8": { row: 1, col: 3 },
  "9": { row: 1, col: 4 },
  "10": { row: 1, col: 5 },
  J: { row: 1, col: 6 },
  Q: { row: 2, col: 4 },
  K: { row: 2, col: 5 },
};

async function slice(name, { row, col }) {
  const trim = 3;
  const left = Math.round(col * cellW) + trim;
  const top = Math.round(row * cellH) + trim;
  const width = Math.round(cellW) - trim * 2;
  const height = Math.round(cellH) - trim * 2;

  await sharp(source)
    .extract({ left, top, width, height })
    .png({ compressionLevel: 6, quality: 100 })
    .toFile(path.join(outDir, `${name}.png`));
}

for (const [name, pos] of Object.entries(MAP)) {
  await slice(name, pos);
  console.log("wrote", name);
}

await copyFile(source, path.join(outDir, "sheet.png"));
console.log("done");
