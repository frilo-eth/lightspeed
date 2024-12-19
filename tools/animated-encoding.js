import { writeFile } from "fs/promises";
import { renderToCanvas } from "../src/render.js";
import { createCanvas } from "canvas";
import { hexToEncoding } from "../src/codec.js";

// const encoding = createRandomVisibleEncoding();
const encoding = hexToEncoding(
  "0000cfa795453ef52753e4f004a9b382490503817fa79e2a5b2e4ebe426935df"
);

const totalFrames = 256;

for (let i = 0; i < totalFrames; i++) {
  const canvas = createCanvas(2000, 2000);
  const { width, height } = canvas;
  const context = canvas.getContext("2d");
  const curEncoding = encoding.slice();
  curEncoding[1] = (curEncoding[1] + i) % 256;
  renderToCanvas({
    encoding: curEncoding,
    width,
    height,
    context,
  });

  const buf = canvas.toBuffer();
  console.log(`${i + 1} / ${totalFrames}`);
  await writeFile(`tmp/animated/${String(i).padStart(3, "0")}.png`, buf);
}
