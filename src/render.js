import { LAYER_COUNT, construct, decode, getGridSizes } from "./codec.js";
import { getPalette } from "./colors.js";
import drawRoundedSegment from "./drawRoundedSegment.js";
import { PRNG } from "./prng.js";

// export const DEFAULT_BACKGROUND = "#e9e2d4"; // Lr=0.9, C=0.02, H=85deg
export const DEFAULT_LINE_WIDTH_FACTOR = 0.005;
export const DEFAULT_MARGIN_FACTOR = 0.1;
export const SYSTEM_1_MARGIN_SCALE = 1;
const SUPPORTED_COLOR_SPACES = ["srgb", "display-p3"];

const lerp = (min, max, t) => min * (1 - t) + max * t;

const tmp2_0 = [0, 0];
const tmp2_1 = [0, 0];
const tmp2_2 = [0, 0];
const tmp2_3 = [0, 0];

const vec2Set = (vec, a, b) => {
  vec[0] = a;
  vec[1] = b;
  return vec;
};

// export const DEFAULT_BACKGROUND = getBackground();
const GRID_SIZES = getGridSizes();

function toSeed(encoding) {
  // skip first two bytes when calculating a seed
  const bytes = encoding.slice(2);
  let hex = "";
  for (let byte of bytes) {
    // Ensure each element is a valid byte
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
      throw new Error("each element in the array must be a byte (0-255)");
    }
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

export function renderStats(opts = {}) {
  let min = [Infinity, Infinity];
  let max = [-Infinity, -Infinity];

  const encoding = opts.encoding;
  const system = encoding[0];
  const [width, height] = [256, 256];
  const margin = 0;
  const size = [width, height];
  let totalVisibleCells = 0;
  let colors = new Set();
  let ids = new Set();
  const paint = new Uint8Array(width * height);
  createRenderer({
    ...opts,
    margin,
    width,
    height,
    cell: (px, py, cw, ch, color, id) => {
      totalVisibleCells++;
      ids.add(id);
      for (let y = py; y < py + ch; y++) {
        for (let x = px; x < px + cw; x++) {
          const idx = x + y * width;
          if (idx >= 0 && idx < paint.length) {
            paint[idx] = id;
          }
        }
      }
    },
    fill: (path, color, alpha = 1) => {
      colors.add(color);

      path.forEach((point) => {
        for (let c = 0; c < point.length; c++) {
          min[c] = Math.min(min[c], point[c]);
          max[c] = Math.max(max[c], point[c]);
        }
      });
    },
    hatch: false,
    hatchContours: false,
  });
  const bounds = [min, max];
  const boundsRatio = [(max[0] - min[0]) / width, (max[1] - min[1]) / height];
  return {
    paint,
    system: opts.encoding[0],
    width,
    height,
    colors,
    ids,
    totalVisibleCells,
    totalPathBounds: bounds,
    boundsRatio: boundsRatio,
  };
}

export function createRenderer(opts = {}) {
  const {
    encoding,
    width,
    height,
    hatch = true,
    hatchContours = true,
    roundSegments = 16,
    colorSpace = "srgb",
  } = opts;

  if (!encoding) throw new Error("must specify encoding");
  if (!width || !height) throw new Error("must specify width and height");

  const { layers, frame, system = 0 } = decode(encoding);
  if (layers.length !== LAYER_COUNT) throw new Error("expected 5 layers");

  const random = PRNG(toSeed(encoding));

  // const palette = opts.palette ?? getPalette(colorSpace);
  const palette = opts.palette ?? getPalette({ colorSpace, system });

  const jitter = 1;
  const gauss = 0.0001;
  const minDim = Math.min(width, height);
  const gaussDim = minDim * gauss;

  const defaultMarginFactor =
    system == 1
      ? SYSTEM_1_MARGIN_SCALE * DEFAULT_MARGIN_FACTOR
      : DEFAULT_MARGIN_FACTOR;
  const margin = opts.margin ?? defaultMarginFactor * minDim;
  const innerDim = Math.min(width - margin * 2, height - margin * 2);
  const lineWidth = opts.lineWidth ?? DEFAULT_LINE_WIDTH_FACTOR * minDim * 1.0;
  const background = opts.background ?? palette[0];

  // b&w will skip layer translations to avoid thin white lines on edges
  const translation = opts.translation ?? (system == 1 ? 0 : 1);

  const lineJoin = hatch ? "round" : "miter";
  const lineCap = "round";

  const layerHorizontals = [];
  for (let i = 0; i < LAYER_COUNT; i++) {
    layerHorizontals.push(random.boolean());
  }

  if (opts.setup) {
    opts.setup({
      background,
      margin,
      lineCap,
      lineWidth,
      lineJoin,
      width,
      height,
      encoding,
    });
  }

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const horizontal = layerHorizontals[i];
    if (opts.layer) opts.layer(layer, horizontal);

    const dimensions = layer.dimensions ?? [0, 0];
    const colors = layer.colors ?? [1, 0];
    const columns = GRID_SIZES[dimensions[0]];
    const rows = GRID_SIZES[dimensions[1]];

    const hidden =
      layer.visible === false || (colors[0] === 0 && colors[1] === 0);
    if (!hidden) {
      const horizontal = layerHorizontals[i];

      // Each layer is shifted by some translation
      // To mimic the screen print process
      const layerXY = random.insideCircle(
        random.gaussian(0, gaussDim * translation * 10 * jitter),
        tmp2_0
      );
      const layerX = layerXY[0];
      const layerY = layerXY[1];

      // In addition, each color in the layer is also shifted when being applied
      const colorOffsetMap = Array(2)
        .fill()
        .map(() => {
          return random.insideCircle(
            random.gaussian(0, gaussDim * translation * 10 * jitter)
          );
        });

      let cellWidth = (width - margin * 2) / columns;
      let cellHeight = (height - margin * 2) / rows;

      construct({ layer, frame }, (x, y, id, bit) => {
        const cw = cellWidth;
        const ch = cellHeight;
        let px = margin + x * cw;
        let py = margin + y * ch;

        // id should never be 0 as it infers "no color / skip" (transparent)
        // anything else is indexed into the palette though
        const color = palette[Math.max(1, Math.min(palette.length - 1, id))];

        if (opts.cell) {
          opts.cell(px, py, cw, ch, color, id);
        }

        if (hatch) {
          // "Bit On" == Use Foreground (color at index 0)
          const mapIndex = bit ? 0 : 1;

          const offset = colorOffsetMap[mapIndex];
          px += layerX + offset[0];
          py += layerY + offset[1];

          // mutliple shapes in this group - each line stroke
          createHighResShapeList(
            random,
            px,
            py,
            cw,
            ch,
            gaussDim,
            jitter,
            color,
            horizontal,
            lineWidth,
            hatchContours,
            roundSegments,
            opts.fill,
            opts.segment,
            1
          );
        } else {
          // a single shape in this group - just the rectangle path
          const path = toRoundedVerts(px, py, cw, ch);
          if (opts.fill) {
            opts.fill(path, color, 1);
          }
        }
      });
    }
  }

  if (opts.finish) opts.finish();
}

function createHighResShapeList(
  random,
  px,
  py,
  cellWidth,
  cellHeight,
  gaussDim,
  jitter,
  color,
  horizontal,
  lineWidth,
  hatchContours,
  roundSegments,
  fill,
  segment,
  roundness = 1
) {
  const pw = cellWidth;
  const ph = cellHeight;

  let curLineWidth = random.gaussian(lineWidth, gaussDim * jitter);

  const curAxis = horizontal ? ph : pw;
  const lineCount = Math.max(1, Math.ceil(curAxis / curLineWidth));
  const fixedLineWidth = curAxis / lineCount;
  curLineWidth = Math.max(
    fixedLineWidth / 8,
    fixedLineWidth + random.gaussian(0, 2 * gaussDim * jitter)
  );

  const lineOffset = (1 * curLineWidth) / 2;
  const lineStart = (0 * curLineWidth) / 2; // ignored for now...

  for (let i = 0; i < lineCount; i++) {
    let kx1, ky1, kx2, ky2;
    let t = lineCount <= 1 ? 0.5 : i / (lineCount - 1);
    let lace = random.gaussian(0, gaussDim * jitter);
    if (horizontal) {
      kx1 = px + lace;
      ky1 = lineStart + lerp(py + lineOffset, py + ph - lineOffset, t);
      kx2 = kx1 + pw;
      ky2 = ky1;
    } else {
      kx1 = lineStart + lerp(px + lineOffset, px + pw - lineOffset, t);
      ky1 = py + lace;
      kx2 = kx1;
      ky2 = ky1 + ph;
    }

    const alpha = Math.max(0.9, Math.min(1, random.gaussian(1, 0.1 * jitter)));

    const ac = random.insideCircle(
      random.gaussian(0, gaussDim * jitter),
      tmp2_0
    );
    const bc = random.insideCircle(
      random.gaussian(0, gaussDim * jitter),
      tmp2_1
    );
    const a = vec2Set(tmp2_2, kx1 + ac[0], ky1 + ac[1]);
    const b = vec2Set(tmp2_3, kx2 + bc[0], ky2 + bc[1]);

    const ellipsoid =
      Math.max(0.0, Math.min(0.5, random.gaussian(0.25, (0.25 / 2) * jitter))) *
      roundness;

    if (hatchContours && roundSegments > 0) {
      const path = drawRoundedSegment(
        a,
        b,
        curLineWidth,
        roundSegments,
        ellipsoid
      );

      fill(path, color, alpha);
    } else {
      segment(a, b, color, alpha, curLineWidth);
    }
  }
}

function toRoundedVerts(x, y, cols, rows) {
  return [
    [Math.round(x), Math.round(y)],
    [Math.round(x + cols), Math.round(y)],
    [Math.round(x + cols), Math.round(y + rows)],
    [Math.round(x), Math.round(y + rows)],
  ];
  // return [
  //   [x, y],
  //   [x + cols, y],
  //   [x + cols, y + rows],
  //   [x, y + rows],
  // ].map((vertex) => vertex.map((n) => Math.round(n)));
}

export function renderToCanvas(opts = {}) {
  const { context, width, height } = opts;
  if (!context) throw new Error("must specify { context } to render to");
  let { colorSpace } = opts;
  if (typeof context.getContextAttributes === "function") {
    const ret = context.getContextAttributes();
    if (ret && ret.colorSpace) {
      colorSpace = ret.colorSpace;
    }
  }

  if (!colorSpace || !SUPPORTED_COLOR_SPACES.includes(colorSpace)) {
    colorSpace = "srgb";
  }

  createRenderer({
    ...opts,
    colorSpace,
    width,
    height,
    finish: () => {
      context.restore();
    },
    setup: ({ background, lineJoin, lineWidth, lineCap }) => {
      context.save();
      context.lineJoin = lineJoin;
      context.lineWidth = lineWidth;
      context.lineCap = lineCap;
      context.globalAlpha = 1;
      // context.fillStyle = background;
      // const m =
      //   DEFAULT_MARGIN_FACTOR * SYSTEM_1_MARGIN_SCALE * Math.min(width, height);
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      // context.fillStyle = "pink";
      // context.fillRect(m, m, width - m * 2, height - m * 2);
    },
    fill: (path, color, alpha) => {
      context.fillStyle = color;
      context.globalAlpha = alpha;
      context.beginPath();
      path.forEach((p) => context.lineTo(p[0], p[1]));
      context.closePath();
      context.fill();
    },
    // cell: (x, y, w, h, color) => {
    //   context.strokeStyle = color;
    //   context.lineWidth = Math.min(width, height) * 0.001;
    //   context.strokeRect(x, y, w, h);
    // },
    segment: (a, b, color, alpha, lineWidth) => {
      context.strokeStyle = color;
      context.globalAlpha = alpha;
      context.lineWidth = lineWidth;
      context.beginPath();
      context.moveTo(a[0], a[1]);
      context.lineTo(b[0], b[1]);
      context.stroke();
    },
  });
}

function toAttrList(args) {
  return args
    .filter(Boolean)
    .map((a) => `${a[0]}=${JSON.stringify(String(a[1]))}`)
    .join(" ");
}

export function renderToSVG(opts = {}) {
  const { width, height } = opts;

  const units = "px";

  const attribs = [];
  const shapes = [];
  const layers = [];
  let layerShapes;

  createRenderer({
    ...opts,
    width,
    height,
    setup: ({ background, lineJoin, lineWidth, lineCap }) => {
      attribs.push(
        ["stroke-linejoin", lineJoin],
        ["stroke-linecap", lineCap],
        ["stroke-width", `${lineWidth}${units}`]
      );
      const rectAttribs = toAttrList([
        ["x", 0],
        ["y", 0],
        ["width", width],
        ["height", height],
        ["fill", background],
      ]);
      shapes.push(`<rect ${rectAttribs} />`);
    },
    layer: () => {
      layerShapes = [];
      layers.push(layerShapes);
    },
    fill: (path, color, alpha) => {
      const d = pathToSVGPath(path, true);
      const shape = `<path ${toAttrList([
        ["d", d],
        ["fill", color],
        ["opacity", alpha],
      ])} />`;
      layerShapes.push(shape);
    },
    segment: (a, b, color, alpha, lineWidth) => {
      const path = pathToSVGPath([a, b], false);
      const shape = `<path ${toAttrList([
        ["d", path],
        ["stroke", color],
        ["opacity", alpha],
        ["stroke-width", `${lineWidth}${units}`],
      ])} />`;
      layerShapes.push(shape);
    },
  });

  const viewWidth = width;
  const viewHeight = height;

  return [
    '<?xml version="1.0" standalone="no"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ',
    '    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg width="' + width + units + '" height="' + height + units + '"',
    '    xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' +
      viewWidth +
      " " +
      viewHeight +
      '">',
    "  <g " + toAttrList(attribs) + ">",
    toShapes(shapes, 4),
    layers
      .map((shapes) => {
        return ["    <g>", toShapes(shapes, 6), "    </g>"].join("\n");
      })
      .join("\n"),
    "  </g>",
    "</svg>",
  ].join("\n");

  function toShapes(shapes, spaces = 0) {
    return shapes
      .map((s) => `${Array(spaces).fill(" ").join("")}${s}`)
      .join("\n");
  }
}

function pathToSVGPath(path, closed = false) {
  let commands = [];
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const type = i === 0 ? "M" : "L";
    commands.push(`${type}${p[0]} ${p[1]}`);
  }
  if (closed) commands.join("Z");
  return commands.join(" ");
}
