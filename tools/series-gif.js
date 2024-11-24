import {
  createRandomCleanEncoding,
  createRandomVisibleEncoding,
} from "../src/util.js";
import { encode } from "png-tools";
import { deflate } from "pako";
import { writeFile } from "fs/promises";
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

const { GIFEncoder, quantize, applyPalette } = GIFEnc;
const prng = PRNG();

const fps = 10;
const totalFrames = 1000;
const size = 2048;

const system = 0;
const renderToGif = false;
const margin = true;
const zoom = false;
const scale = 1;
const factor = margin ? 1 / (1 - DEFAULT_MARGIN_FACTOR * 2 * scale) : 1;
const mult = zoom ? factor : 1;
const padding = zoom ? 0 : 0;

const gif = GIFEncoder();

for (let i = 0; i < totalFrames; i++) {
  const encoding = createRandomCleanEncoding(prng, { system, frame: 0 });

  const canvas = createCanvas(size * mult, size * mult);

  const context = canvas.getContext("2d");
  renderToCanvas({
    colorSpace: "srgb",
    encoding,
    width: canvas.width,
    height: canvas.height,
    context,
    hatch: true,
    hatchContours: true,
  });

  const width = size;
  const height = size;
  const zoomCanvas = createCanvas(size, size);
  const zoomContext = zoomCanvas.getContext("2d");
  const nw = width * mult;
  const nh = height * mult;
  const tx = (width - nw) / 2;
  const ty = (height - nh) / 2;
  zoomContext.drawImage(canvas, tx, ty, nw, nh);

  const imageData = zoomContext.getImageData(0, 0, width, height);
  console.log(`Writing frame ${i + 1} / ${totalFrames}`);

  if (renderToGif) {
    const palette = quantize(imageData.data, 256);
    const index = applyPalette(imageData.data, palette);
    gif.writeFrame(index, width, height, { palette, delay: 1000 / fps });
  } else {
    const png = encode({ width, height, data: imageData.data }, deflate);
    await writeFile(`tmp/batch/${encodingToHex(encoding)}.png`, png);
    // await writeFile(`tmp/${String(i).padStart(4, "0")}.png`, png);
  }
}

// Write end-of-stream character
if (renderToGif) {
  gif.finish();

  // Get the Uint8Array output of your binary GIF file
  await writeFile("tmp/output.gif", gif.bytes());
}
// const encoding = hexToEncoding(
//   "0000acbfa136f908075698e46b983d80fb1781db3945fc3ccf69484804c4241c"
// );

// const HEADER_LENGTH = 2;
// const COLOR_OFFSET = 1;
// const LAYER_COUNT = 5;
// const indices = Array(5)
//   .fill()
//   .map((_, i) => HEADER_LENGTH + i * LAYER_COUNT + COLOR_OFFSET);

// console.log(indices);
// console.log(encodingToHex(encoding));

// for (let i = 0; i < 1; i++) {
// const canvas = createCanvas(2048, 2048);
// const { width, height } = canvas;
// const context = canvas.getContext("2d");
// const curEncoding = encoding.slice();

//   console.log("write layer", i);
//   // curEncoding[indices[0]] = packNibblesLE([0, 0]);
//   for (let j = 5 + 2; j < 32; j++) {
//     curEncoding[j] = 0;
//   }

//   console.log(decode(curEncoding).layers[0]);
//   // curEncoding[indices[1]] = packNibblesLE([0, 0]);
//   // curEncoding[indices[2]] = packNibblesLE([0, 0]);
//   // curEncoding[indices[3]] = packNibblesLE([0, 0]);
//   // curEncoding[indices[4]] = packNibblesLE([0, 0]);
//   // curEncoding
//   // // turn on only this layer and those before it
//   // for (let j = 0; j < colorIndices.length; j++) {
//   //   const idx = colorIndices[j];
//   //   const isVisible = i >= j;
//   //   console.log("cell", j, isVisible);
//   //   if (!isVisible) {
//   //     curEncoding[idx] = 0x00; // clear the color byte
//   //   }
//   // }

// renderToCanvas({
//   encoding: curEncoding,
//   width,
//   height,
//   context,
// });

//   const buf = canvas.toBuffer();
//   await writeFile(`tmp/composition-${String(i).padStart(2, "0")}.png`, buf);
// }
