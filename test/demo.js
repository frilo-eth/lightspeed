// https://codesandbox.io/p/sandbox/bitframes-sketch-vsqx9l

import {
  binaryStringToByteLE,
  byteToBinaryStringLE,
  createRandomCleanEncoding,
  createRandomEncoding,
  createRandomVisibleEncoding,
  decode,
  encode,
  FlipMode,
  FillMode,
  getPalette,
  renderToCanvas,
  SkipMode,
  PRNG,
  hexToEncoding,
} from "bitframes";

const canvas = document.createElement("canvas");
const targetColorSpace = "display-p3";
const context = canvas.getContext("2d", { colorSpace: targetColorSpace });
const { colorSpace = "srgb" } = context.getContextAttributes();

const prng = PRNG();

const width = 2048;
const height = 2048;
canvas.width = width;
canvas.height = height;

// get the palette with CSS color strings
// 0th color is background
const palette = getPalette({ colorSpace });
context.fillStyle = palette[0];
context.fillRect(0, 0, width, height);

// animate each N ms
const interval = setInterval(animate, 1000 / 4);
if (module.hot) {
  // for parcel hot reloading
  module.hot.dispose(function () {
    clearInterval(interval);
  });
}

let dimensions = 14;
let rule = 45;
// draw first tick
animate();

function createMyRandomEncoding() {
  let bytes = new Uint8Array(32);

  // here we can decide how to fill the bytes...
  // you could just return plain hex bytes
  // but it might be easier to turn this into an object

  // this will produce an 'empty' document (all zero)
  const doc = decode(bytes);

  // all of this is just the first layer (of 5)
  doc.layers[0].visible = true;
  doc.layers[0].colors = [0, 1];
  doc.layers[0].dimensions = [12, 12];
  doc.layers[0].skip = 0;
  doc.layers[0].skipMode = SkipMode.SCALED_COLUMNS;
  doc.layers[0].rule = prng.rangeFloor(0, 256);
  doc.layers[0].pattern = binaryStringToByteLE("10000001");
  doc.layers[0].scale = 1;
  doc.layers[0].wrap = prng.boolean();
  doc.layers[0].flipMode = FlipMode.VERTICAL;
  doc.layers[0].fillMode = FillMode.CENTER;

  // this is not currently exposed by the editor
  // it is a frame header for seamless looping GIFs by pushing *everything* forward
  // however you can also use it to create some novel outputs...
  doc.frame = prng.rangeFloor(0, 256);

  bytes = encode(doc);

  return bytes;
}

function animate() {
  // There are different ways of getting a random encoding
  //   - Pure randomness (sometimes produces empty outputs)
  //   - Randomness without empty outputs
  //   - "Clean" outputs (subjective!) where they generally fill the space
  // const encoding = createRandomEncoding();
  // const encoding = createRandomVisibleEncoding();
  // const encoding = createRandomCleanEncoding();

  // But you could also create your own encoding scheme!
  const encoding = createMyRandomEncoding();

  // or render a specific encoding, which is just 32 bytes
  // const encoding = hexToEncoding("00000611fa0e90453d10ee8045016b0737b7d87e4b016db5b2d22401dde6ff01");

  renderToCanvas({
    context,
    colorSpace,
    width,
    height,
    hatch: true,
    hatchContours: true,
    encoding,
  });
}

document.body.appendChild(canvas);

document.body.style.cssText = `
    margin: 40px;
    flex-grow: 1;
    height: 100%;
    width: 100%;
`;
canvas.style.cssText = `
    aspect-ratio: 1;
    box-sizing: border-box;
    margin: 0px;
    width: calc(min(1024px, 100vmin - 80px));
    height: auto;
`;
