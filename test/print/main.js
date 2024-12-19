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
  renderToSVG,
} from "../../src/index.js";
import {
  downloadBlob,
  downloadCanvas,
  downloadEncoding,
} from "../util/save.js";
// import {} from "png-tools";
import getDocument from "canvas-dimensions";
import convert from "convert-length";

const settings = {
  // a standard paper size or [w, h]
  dimensions: [18, 18],
  // pixel resolution
  pixelsPerInch: 300,
  // a user coordinate space to work in
  units: "in",
};

let colorSpace = "display-p3";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d", { colorSpace });
document.body.appendChild(canvas);

canvas.style.width = "512px";
canvas.style.height = "auto";

let format = "png";

const encBox = document.querySelector(".encoding");
const formatBox = document.querySelector(".format");
const sizeBox = document.querySelector(".size");
sizeBox.value = settings.dimensions[0];

const unitsBox = document.querySelector(".units");
unitsBox.value = settings.units;

const computedSizeLabel = document.querySelector(".computed-size");

formatBox.oninput = updateInputs;
sizeBox.oninput = updateInputs;
unitsBox.oninput = updateInputs;

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

function updateInputs() {
  format = formatBox.value.toLowerCase();
  const units = unitsBox.value || "in";
  const size = parseFloat(sizeBox.value) || (units == "px" ? 2048 : 18);

  settings.units = units;
  settings.pixelsPerInch = units == "px" ? undefined : 300;
  settings.dimensions = [size, size];

  document.querySelector(".print-options").style.display =
    format == "png" ? "" : "none";
  update(encoding);
}

function update(newEncoding) {
  encoding = newEncoding;
  encBox.value = encodingToHex(encoding);

  let {
    // Size in display/screen coordinates
    canvasWidth: width,
    canvasHeight: height,
  } = getDocument(settings);

  width = Math.round(width);
  height = Math.round(height);

  // Setup your 2D canvas
  canvas.width = width;
  canvas.height = height;

  computedSizeLabel.textContent = `${width} x ${height} px`;

  renderToCanvas({
    context,
    encoding,
    width,
    height,
    hatch: true,
  });
}

function save(ev) {
  ev.preventDefault();
  const curEncodingHex = encodingToHex(encoding);
  console.log(curEncodingHex + ".png");
  if (format == "png") {
    downloadEncoding(canvas, {
      pixelsPerInch: settings.pixelsPerInch,
      encoding,
      filename: `print-${curEncodingHex}.png`,
    });
  } else {
    const svg = renderToSVG({
      colorSpace,
      width: canvas.width,
      height: canvas.height,
      encoding,
      hatch: true,
      // you can set this to true if you want a really high quality SVG
      // however for pen plotting you probably just want actual line strokes rather than outline strokes
      hatchContours: false,
      // optionally visualize a different line width
      // lineWidth:
      //   format == "plotter"
      //     ? convert(0.03, "cm", "px", {
      //         roundPixel: false,
      //         precision: 5,
      //         pixelsPerInch: 90,
      //       })
      //     : undefined,
      // turn off background for pen plotter
      background: format == "plotter" ? "none" : undefined,
    });
    downloadBlob(
      new Blob([svg], {
        type: "image/svg+xml",
      }),
      { filename: `${format}-${curEncodingHex}.svg` }
    );
  }
}

button.addEventListener("click", save);
