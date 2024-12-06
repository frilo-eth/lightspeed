import { writeFile } from "fs/promises";
import { createCanvas } from "canvas";
// import { Canvas } from "skia-canvas";
import {
  decode,
  encode,
  encodingToHex,
  PRNG,
  renderToCanvas,
  createRandomVisibleEncoding,
} from "../../src/index.js";

const prng = PRNG();
const system = 0x00;
const size = 256;
const totalFrames = 5000;
const canvas = createCanvas(size, size);
// const canvas = new Canvas(size, size);
const context = canvas.getContext("2d");
console.log(canvas.gpu, canvas.engine);
console.time("render");
for (let i = 0; i < totalFrames; i++) {
  let encoding = createRandomVisibleEncoding(prng, { system, frame: 0 });

  const doc = decode(encoding);
  // doc.layers.forEach((layer) => {
  //   layer.colors = prng.boolean() ? [1, 0] : [0, 1];
  // });
  encoding = encode(doc);

  renderToCanvas({
    colorSpace: "srgb",
    encoding,
    width: canvas.width,
    height: canvas.height,
    context,
    hatch: true,
    hatchContours: true,
  });

  const png = canvas.toBuffer();
  console.log(i, encodingToHex(encoding));
  await writeFile(`tmp/umatrix/${encodingToHex(encoding)}.png`, png);
}
console.timeEnd("render");
