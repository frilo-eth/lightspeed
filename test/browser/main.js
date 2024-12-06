import {
  createEmptyEncoding,
  createRandomCleanEncoding,
  createRandomLayer,
  decode,
  encode,
  FillMode,
  FlipMode,
  getGridSizes,
  renderToCanvas,
  SkipMode,
  PRNG,
  binaryStringToByteLE,
  StandardRules,
  randomByte,
  randomNibble,
  randomCrumb,
  encodingToHex,
} from "../../src/index.js";
import { downloadCanvas } from "../util/save.js";

const random = PRNG();

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d", { colorSpace: "display-p3" });
document.body.appendChild(canvas);

const width = 2048;
const height = 2048;

canvas.width = width;
canvas.height = height;
// canvas.style.imageRendering = "pixelated";
canvas.style.width = "512px";
canvas.style.height = "auto";

let curEncodingHex;

setInterval(() => {
  animate();
}, 1000 / 5);
animate();

function animate() {
  const isRandomReverse = false;

  let doc = decode(createEmptyEncoding());
  const dim = 2;
  console.log("Dimensions:", getGridSizes()[dim]);
  doc.layers[1] = {
    visible: true, // 1 bit
    colors: [0, 1], // 8 bits
    dimensions: [dim, dim], // 8 bits
    pattern: binaryStringToByteLE("10100010"), // 8 bits
    rule: StandardRules.IDENTITY, // 8 bits
    scale: 0, // 4 bits
    skip: 0,
    skipMode: SkipMode.EQUAL, // 2 bits
    fillMode: FillMode.CENTER, // 2 bits
    flipMode: FlipMode.HORIZONTAL, // 2 bits
    wrap: true, // 1 bit
  };

  doc.layers[0] = {
    visible: true, // 1 bit
    colors: [1, 0], // 8 bits
    dimensions: [15, 15], // 8 bits
    pattern: binaryStringToByteLE("01000010"), // 8 bits
    rule: StandardRules.COMPLEMENT, // 8 bits
    scale: 0, // 4 bits
    skip: 0,
    skipMode: SkipMode.SCALED_COLUMNS, // 2 bits
    fillMode: FillMode.CENTER, // 2 bits
    flipMode: FlipMode.NONE, // 2 bits
    wrap: true, // 1 bit
  };

  const encoding = encode(doc);
  curEncodingHex = encodingToHex(encoding);
  renderToCanvas({
    context,
    encoding,
    width,
    height,
    hatch: true,
  });
}

canvas.addEventListener("click", (ev) => {
  ev.preventDefault();
  console.log(curEncodingHex + ".png");
  downloadCanvas(canvas, {
    filename: curEncodingHex + ".png",
  });
});
