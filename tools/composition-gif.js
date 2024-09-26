import { createRandomVisibleEncoding } from "../src/util.js";
import { writeFile } from "fs/promises";
import * as path from "path";
import { renderToCanvas } from "../src/render.js";
import { createCanvas } from "canvas";
import {
  constructCells,
  decode,
  encodingToHex,
  hexToEncoding,
} from "../src/codec.js";
import { packNibblesLE } from "../src/bits.js";

// const encoding = createRandomVisibleEncoding();
const encoding = hexToEncoding(
  "0000acbfa136f908075698e46b983d80fb1781db3945fc3ccf69484804c4241c"
);

const HEADER_LENGTH = 2;
const COLOR_OFFSET = 1;
const LAYER_COUNT = 5;
const indices = Array(5)
  .fill()
  .map((_, i) => HEADER_LENGTH + i * LAYER_COUNT + COLOR_OFFSET);

console.log(indices);
console.log(encodingToHex(encoding));

for (let i = 0; i < 1; i++) {
  const canvas = createCanvas(2048, 2048);
  const { width, height } = canvas;
  const context = canvas.getContext("2d");
  const curEncoding = encoding.slice();

  console.log("write layer", i);
  // curEncoding[indices[0]] = packNibblesLE([0, 0]);
  for (let j = 5 + 2; j < 32; j++) {
    curEncoding[j] = 0;
  }

  console.log(decode(curEncoding).layers[0]);
  // curEncoding[indices[1]] = packNibblesLE([0, 0]);
  // curEncoding[indices[2]] = packNibblesLE([0, 0]);
  // curEncoding[indices[3]] = packNibblesLE([0, 0]);
  // curEncoding[indices[4]] = packNibblesLE([0, 0]);
  // curEncoding
  // // turn on only this layer and those before it
  // for (let j = 0; j < colorIndices.length; j++) {
  //   const idx = colorIndices[j];
  //   const isVisible = i >= j;
  //   console.log("cell", j, isVisible);
  //   if (!isVisible) {
  //     curEncoding[idx] = 0x00; // clear the color byte
  //   }
  // }

  renderToCanvas({
    encoding: curEncoding,
    width,
    height,
    context,
  });

  const buf = canvas.toBuffer();
  await writeFile(`tmp/composition-${String(i).padStart(2, "0")}.png`, buf);
}
