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
  hexToEncoding,
} from "../../src/index.js";
import { downloadCanvas, downloadEncoding } from "../util/save.js";
import {} from "png-tools";
import getDocument from "canvas-dimensions";

const settings = {
  // a standard paper size or [w, h]
  dimensions: [18, 18],
  // pixel resolution
  pixelsPerInch: 300,
  // a user coordinate space to work in
  units: "in",
};

const {
  // Size in display/screen coordinates
  canvasWidth: width,
  canvasHeight: height,
} = getDocument(settings);

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d", { colorSpace: "display-p3" });
document.body.appendChild(canvas);

// Setup your 2D canvas
canvas.width = width;
canvas.height = height;

canvas.style.width = "512px";
canvas.style.height = "auto";

const encBox = document.querySelector(".encoding");

let encoding;

// from hex
// update(hexToEncoding('0000ada0e68404016d05e604d901ed0ae6c1ca044401e600ca013401e6694701'))

// from random
update(createRandomCleanEncoding());

encBox.oninput = (ev) => {
  try {
    const enc = hexToEncoding(ev.target.value);
    const newEnc = encode(decode(enc));
    encBox.classList.remove("invalid");
    update(newEnc);
  } catch (err) {
    console.warn("Invalid encoding");
    encBox.classList.add("invalid");
  }
};

const button = document.createElement("button");
button.textContent = "Download";
document.body.appendChild(button);

function update(newEncoding) {
  encoding = newEncoding;
  encBox.value = encodingToHex(encoding);
  renderToCanvas({
    context,
    encoding,
    width,
    height,
    hatch: true,
  });
}

function click(ev) {
  ev.preventDefault();
  const curEncodingHex = encodingToHex(encoding);
  console.log(curEncodingHex + ".png");
  downloadEncoding(canvas, {
    pixelsPerInch: settings.pixelsPerInch,
    encoding,
    filename: `print-${curEncodingHex}.png`,
  });
}

button.addEventListener("click", click);
