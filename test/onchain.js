import { decode, encodingToHex, hexToEncoding } from "../src/codec.js";
import { renderToCanvas } from "../src/render.js";
import { createRandomCleanEncoding } from "../src/util.js";

const DEFAULT_SIZE = 2048;

// quick and dirty but a lot of poor results
// const randomEncoding = () => {
//   const bytes = new Uint8Array(32);
//   for (let i = 2; i < 32; i++) bytes[i] = ~~(Math.random() * 256);
//   return bytes;
// };

const system = 0x01;
const config = globalThis.CONFIG || {};
const W = config.W || globalThis;
const AUTO = "auto";
const DOC = W.document;
const CREATE = (a) => DOC.createElement(a);

config.C =
  config.C ||
  ((w, h) => {
    const canvas =
      DOC.querySelector("canvas") || DOC.body.appendChild(CREATE("canvas"));
    canvas.width = w;
    canvas.height = h;
    return canvas;
  });

const dpr = W.devicePixelRatio || 1;
const SIZE =
  config.SIZE ||
  Math.max(Math.min(W.innerHeight | 0, W.innerWidth | 0) * dpr, DEFAULT_SIZE);
const width = SIZE,
  height = SIZE;

const targetColorSpace = config.SP || "display-p3";

const canvas = config.C(width, height);
const context = canvas.getContext("2d", { colorSpace: targetColorSpace });
const { colorSpace = "srgb" } = context.getContextAttributes();

// Init sizing
const hundred = "100%";
const CS = canvas.style;
if (CS && config.ST !== false) {
  const resize = () => {
    CS.position = "absolute";
    CS.display = "block";
    CS.top = CS.left = CS.right = CS.bottom = "0";
    CS.margin = AUTO;
    if (W.innerWidth / W.innerHeight <= 1 /* width/height */) {
      CS.width = hundred;
      CS.height = AUTO;
    } else {
      CS.width = AUTO;
      CS.height = hundred;
    }
  };
  if (config.AR !== false) W.onresize = resize;
  resize();
}

let encoding;
if (typeof hl !== "undefined" && hl.tx && hl.tx.customMintData) {
  try {
    const hex = hl.tx.customMintData.replace(/^0x/i, "");
    if (hex.length) {
      encoding = hexToEncoding(hex);
    }
  } catch (err) {
    console.warn(err);
  }
}

if (!encoding) {
  encoding = createRandomCleanEncoding(undefined, { system });
}

if (config.L !== false) console.log(encodingToHex(encoding));

renderToCanvas({
  context,
  width,
  height,
  encoding,
  colorSpace,
  hatch: config.H !== false,
  hatchContours: config.HC !== false,
});

const capture = () => {
  if (config.P !== false) {
    window.dispatchEvent(new Event("CAPTURE_PREVIEW"));
  }
};

capture();
config.PI = setInterval(capture, 500);

const downloadFile = (uri, name) => {
  const a = CREATE("a");
  a.download = name;
  a.href = uri;
  a.click();
};

const save = () => {
  downloadFile(canvas.toDataURL(), encodingToHex(encoding) + ".png");
};

if (config.AS != false) {
  canvas.onclick = (e) => {
    e.preventDefault();
    save();
  };
}
