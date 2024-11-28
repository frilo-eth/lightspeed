import {
  createRandomCleanEncoding,
  createRandomVisibleEncoding,
} from "../src/util.js";
import { encode } from "png-tools";
import { deflate } from "pako";
import { readFile, writeFile, readdir } from "fs/promises";
import * as path from "path";
import { DEFAULT_MARGIN_FACTOR, renderToCanvas } from "../src/render.js";
import { createCanvas } from "canvas";
import {
  constructCells,
  decode,
  encodingToHex,
  hexToEncoding,
} from "../src/codec.js";
import { packNibblesLE } from "../src/bits.js";
import GIFEnc from "gifenc";
import { PRNG } from "../src/prng.js";

const files = (await readdir("tmp/timeline/")).filter((f) =>
  f.endsWith(".png")
);
const existing = new Map();
for (let f of files) {
  const n = parseInt(f.replace(".png", ""), 10);
  existing.set(n, true);
}

const lines = (await readFile("./test/1000.csv", "utf8"))
  .split("\n")
  .filter(Boolean);

const encodings = lines.map((t) => t.split(",")[1]);
const ids = lines.map((t) => parseInt(t.split(",")[0], 10));
console.log("IDs:", ids.length);
for (let i = 0; i < ids.length; i++) {
  if (ids[i] !== i + 1) {
    console.warn("Not correct ID:", ids[i], "at index", i);
  }
}

const size = 2048;
const canvas = createCanvas(size, size);
const context = canvas.getContext("2d");

for (let i = 0; i < encodings.length; i++) {
  const id = i + 1;
  if (existing.has(id)) continue;
  const encodingHex = encodings[i];
  const encoding = hexToEncoding(encodingHex);
  canvas.width = size;
  canvas.height = size;
  renderToCanvas({
    colorSpace: "srgb",
    encoding,
    width: canvas.width,
    height: canvas.height,
    context,
    hatch: true,
    hatchContours: true,
  });

  console.log("Draw", `#${id}`);
  // const png = encode({ width, height, data: imageData.data }, deflate);
  const png = canvas.toBuffer();
  await writeFile(`tmp/timeline/${String(id).padStart(4, "0")}.png`, png);
}
