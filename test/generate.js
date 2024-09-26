import { decode, encodingToHex, hexToEncoding } from "../src/codec.js";
import { createRandomVisibleEncoding } from "../src/util.js";
import PRNG from "../src/prng.js";
// import { writeFile } from "fs/promises";
import * as path from "path";
import {
  createRenderer,
  DEFAULT_BACKGROUND,
  renderToCanvas,
} from "../src/render.js";
// import { createCanvas } from "canvas";

export default async function generate(opts = {}) {
  const {
    seed = "12345",
    mount = () => {},
    createCanvas,
    saveImage,
    saveOutput,
    contextAttributes = {},
    columns = 6,
    rows = 6,
    gap = 6,
    renderSize = 2048,
    cellSize = 512,
  } = opts;

  const prng = PRNG(seed);
  console.log(seed);
  const cellSizeWithPad = gap + cellSize;
  const maxWidth = cellSizeWithPad * columns;
  const maxHeight = cellSizeWithPad * rows;
  const canvas = createCanvas(maxWidth, maxHeight);
  const context = canvas.getContext("2d", contextAttributes);

  mount(canvas);

  const tmpCanvas = createCanvas(renderSize, renderSize);
  const tmpContext = tmpCanvas.getContext("2d", contextAttributes);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const encoding = createRandomVisibleEncoding(prng);
      console.log(`(${x}, ${y}) ${encodingToHex(encoding)}`);

      const width = renderSize;
      const height = renderSize;
      renderToCanvas({
        context: tmpContext,
        width,
        height,
        hatch: true,
        // hatchContours: false,
        encoding,
      });

      context.drawImage(
        tmpCanvas,
        x * cellSizeWithPad,
        y * cellSizeWithPad,
        cellSizeWithPad,
        cellSizeWithPad
      );

      await new Promise((r) => setTimeout(r, 0));

      if (saveImage) {
        saveImage(tmpCanvas, encoding);
      }
      // const buf = tmpCanvas.toBuffer();
      // await writeFile(
      //   path.resolve("tmp/", encodingToHex(encoding) + ".png"),
      //   buf
      // );
    }
  }

  if (saveOutput) {
    saveOutput(canvas);
  }
  // const buf = canvas.toBuffer();
  // await writeFile(path.resolve("out.png"), buf);
}
