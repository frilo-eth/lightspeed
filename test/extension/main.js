import { lerpArray } from "canvas-sketch-util/math.js";
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
  createRandomEncoding,
  createRenderer,
  hexToEncoding,
} from "../../src/index.js";
import { downloadCanvas } from "../util/save.js";

const random = PRNG();
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d", { colorSpace: "display-p3" });
const colorSpace = context.getContextAttributes().colorSpace;

document.body.appendChild(canvas);

const width = 4096;
const height = 4096;

canvas.width = width;
canvas.height = height;
canvas.style.width = "512px";
canvas.style.height = "auto";
canvas.addEventListener("click", click);

function animate() {
  const encoding = createRandomEncoding();
  canvas.setAttribute("data-encoding", encodingToHex(encoding));
  renderCustomToCanvas({
    colorSpace,
    context,
    encoding,
    width,
    height,
    hatch: true,
  });
}

animate();

function renderCustomToCanvas(opts = {}) {
  const { context, width, height } = opts;
  if (!context) throw new Error("must specify { context } to render to");
  let symbols = "abcdefghijklmnopqrstuvwxyz".split("");
  let pointer = 0;
  createRenderer({
    ...opts,
    width,
    height,
    hatch: true,
    hatchContours: false,
    finish: () => {
      context.restore();
    },
    cell: () => {
      pointer++;
      if (pointer >= symbols.length) pointer = 0;
    },
    setup: ({ background, lineJoin, lineWidth, lineCap }) => {
      context.save();
      context.lineJoin = lineJoin;
      context.lineWidth = lineWidth;
      context.lineCap = lineCap;
      context.globalAlpha = 1;
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    },
    segment: (a, b, color, alpha, lineWidth) => {
      context.save();
      context.fillStyle = color;
      context.globalAlpha = alpha;
      context.lineWidth = lineWidth;
      const midpoint = lerpArray(a, b, 0.5);
      const [tx, ty] = random.insideCircle(random.gaussian() * width * 0.0001);
      midpoint[0] += tx;
      midpoint[1] += ty;
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const fontSize = width * 0.02;
      context.font = `${fontSize}px monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.globalCompositeOperation = "multiply";
      context.fillText(symbols[pointer], midpoint[0], midpoint[1]);
      context.restore();
    },
  });
}

async function click(ev) {
  ev.preventDefault();
  let encodingHex = canvas.getAttribute("data-encoding");
  if (!encodingHex) encodingHex = encodingToHex(createEmptyEncoding());
  const encoding = hexToEncoding(encodingHex);
  console.log(encodingHex);
  await downloadCanvas(canvas, {
    filename: `extension-symbol-${encodingHex}.png`,
  });

  const tmpCanvas = document.createElement("canvas");
  const tmpContext = tmpCanvas.getContext("2d", { colorSpace });
  tmpCanvas.width = width;
  tmpCanvas.height = height;
  renderToCanvas({
    context: tmpContext,
    width,
    height,
    encoding,
  });
  await downloadCanvas(tmpCanvas, {
    filename: `extension-normal-${encodingHex}.png`,
  });
}
