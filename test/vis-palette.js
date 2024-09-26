import canvasSketch from "canvas-sketch";
import { renderToCanvas } from "../src/render";
import PRNG from "../src/prng";
import { createRandomVisibleEncoding } from "../src/util";
import {
  encodingToHex,
  getBackground,
  getColorData,
  getPalette,
  hexToEncoding,
} from "../src/codec";

const colorSpace = "srgb";
const colorInputs = getColorData();
const palette = colorInputs.map((p) => p[colorSpace]);
const background = palette.shift();
// const chromatics = palette.slice(3);

const settings = {
  dimensions: [2048, 2048],
  attributes: {
    colorSpace,
  },
};

const sketch = () => {
  const constantSlices = true;

  return ({ context, width, height, frame }) => {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const dim = Math.min(width, height);
    const radius = dim * 0.5 - dim * 0.1;
    context.save();
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2, false);
    context.clip();
    const chromatics = colorInputs.slice(4);
    const angleWidth = (1 / chromatics.length) * Math.PI * 2;
    for (let i = 0; i < chromatics.length; i++) {
      const t = i / chromatics.length;

      const [Lr0, C0, H0] = chromatics[i].oklrch;
      const [Lr1, C1, H1] = chromatics[(i + 1) % chromatics.length].oklrch;

      let angle0, angle1;

      if (constantSlices) {
        angle0 = t * Math.PI * 2;
        angle1 = angle0 + angleWidth;
      } else {
        angle0 = (H0 * Math.PI) / 180;
        angle1 = (H1 * Math.PI) / 180;
      }
      const r = Math.max(width, height);

      const x0 = cx + Math.cos(angle0) * r;
      const y0 = cy + Math.sin(angle0) * r;

      const x1 = cx + Math.cos(angle1) * r;
      const y1 = cy + Math.sin(angle1) * r;

      context.beginPath();
      context.moveTo(cx, cy);
      context.lineTo(x0, y0);
      context.lineTo(x1, y1);
      context.closePath();
      context.fillStyle = chromatics[i][colorSpace];
      context.fill();
    }
    context.restore();

    for (let i = 1; i < 4; i++) {
      // const r0 = radius * 1;
      const r1 = radius * (0.5 / chromatics.length);
      const t = (i - 1) / 3;
      // const angle = t * Math.PI * 0.15;
      // const u = Math.cos(angle);
      // const v = Math.sin(angle);
      context.beginPath();
      context.arc(
        cx + radius + r1 * 2,
        cy + (i - 1) * r1 * 2.75,
        r1,
        0,
        Math.PI * 2,
        false
      );

      // context.arc(cx + u * r0, cy + v * r0, r1, 0, Math.PI * 2, false);
      context.fillStyle = colorInputs[i][colorSpace];
      context.fill();
    }
  };
};

canvasSketch(sketch, settings);
