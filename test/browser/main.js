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
} from "../../src/index.js";

const prng = PRNG();

const createBaseLayer = () => {};

let doc = decode(createEmptyEncoding());
doc.layers[0] = createRandomLayer();
// doc.layers[0].visible = true;
// doc.layers[0].colors = [0, 1];
// doc.layers[0].dimensions = [14, 14];
// doc.layers[0].skip = 0;
// doc.layers[0].skipMode = SkipMode.SCALED_COLUMNS;
// doc.layers[0].rule = StandardRules.IDENTITY;
// doc.layers[0].pattern = binaryStringToByteLE("10101010");
// doc.layers[0].scale = 0;
// doc.layers[0].wrap = false;
// doc.layers[0].flipMode = FlipMode.VERTICAL;
// doc.layers[0].fillMode = FillMode.LEFT;

const encoding = encode(doc);

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
renderToCanvas({
  context,
  encoding,
  width,
  height,
  hatch: true,
});
