import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const importRoot = path.join(root, "_card_designs_import");
const outRoot = path.join(root, "public", "cards");

/** Game suit codes */
const SUITS = ["H", "D", "C", "S"];

const SUIT_FROM_PREFIX = {
  kupa: "H",
  karo: "D",
  sinek: "C",
  maca: "S",
};

const SUIT_FROM_FOLDER = {
  kupa: "H",
  karo: "D",
  sinek: "C",
  maca: "S",
};

const TARGET_WIDTH = 512;
const TARGET_HEIGHT = 768;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.png$/i.test(entry.name)) acc.push(full);
  }
  return acc;
}

function suitFromPath(filePath) {
  const folder = path.basename(path.dirname(filePath)).toLowerCase();
  for (const [key, suit] of Object.entries(SUIT_FROM_FOLDER)) {
    if (folder.includes(key)) return suit;
  }
  return null;
}

function parseCardFile(filePath) {
  const base = path.basename(filePath, ".png");
  const normalized = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const match = normalized.match(/^(kupa|karo|sinek|maca)[-_](.+)$/);
  if (!match) return null;

  const suit = SUIT_FROM_PREFIX[match[1]];
  let rank = match[2].toUpperCase();
  if (rank === "ACE") rank = "A";
  if (!["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"].includes(rank)) {
    return null;
  }

  return { suit, rank };
}

async function writeCard(src, suit, rank) {
  const dir = path.join(outRoot, suit);
  await fs.promises.mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${rank}.png`);

  await sharp(src)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: "cover",
      position: "centre",
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 6, quality: 100, effort: 8 })
    .toFile(dest);

  const stat = await fs.promises.stat(dest);
  return { dest, kb: Math.round(stat.size / 1024) };
}

async function writeBack(src, name) {
  const dest = path.join(outRoot, name);
  await sharp(src)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: "cover",
      position: "centre",
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 6, quality: 100, effort: 8 })
    .toFile(dest);
  const stat = await fs.promises.stat(dest);
  return { dest, kb: Math.round(stat.size / 1024) };
}

async function main() {
  if (!fs.existsSync(importRoot)) {
    console.error("Import folder missing:", importRoot);
    process.exit(1);
  }

  for (const suit of SUITS) {
    const dir = path.join(outRoot, suit);
    if (fs.existsSync(dir)) {
      for (const file of fs.readdirSync(dir)) {
        if (file.endsWith(".png")) fs.unlinkSync(path.join(dir, file));
      }
    }
  }

  const files = walk(importRoot);
  let imported = 0;
  let totalKb = 0;

  for (const file of files) {
    const lower = path.basename(file).toLowerCase();
    if (lower.includes("chatgpt")) {
      const back = await writeBack(file, "back.png");
      const backRed = await writeBack(file, "back-red.png");
      console.log("back", back.kb + "KB", "back-red", backRed.kb + "KB");
      totalKb += back.kb + backRed.kb;
      continue;
    }

    const parsed = parseCardFile(file);
    if (!parsed) {
      const suit = suitFromPath(file);
      const rankMatch = path
        .basename(file, ".png")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .match(/(\d+|10|[ajqk])/i);
      if (suit && rankMatch) {
        let rank = rankMatch[1].toUpperCase();
        const result = await writeCard(file, suit, rank);
        console.log(`${suit}/${rank}`, result.kb + "KB");
        imported += 1;
        totalKb += result.kb;
      } else {
        console.warn("skip", file);
      }
      continue;
    }

    const result = await writeCard(file, parsed.suit, parsed.rank);
    console.log(`${parsed.suit}/${parsed.rank}`, result.kb + "KB");
    imported += 1;
    totalKb += result.kb;
  }

  console.log(`\nImported ${imported} faces (~${totalKb}KB total)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
