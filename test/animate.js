import canvasSketch from "canvas-sketch";
import { renderStats, renderToCanvas } from "../src/render";
import { PRNG } from "../src/prng";
import {
  createRandomCleanEncoding,
  createRandomVisibleEncoding,
} from "../src/util";
import { encodingToHex, hexToEncoding } from "../src/codec";
import { getPalette } from "../src/colors";

const random = PRNG();

const colorSpace = "display-p3";
const settings = {
  attributes: {
    // colorSpace,
  },
  fps: 6,
  playbackRate: "throttle",
  // animate: true,
  totalFrames: 256,
  dimensions: [2048, 2048],
};

const sketch = (props) => {
  // const encoding = hexToEncoding(
  //   "01008378ca1eb972010a48fd95ce05197944d609839c92d96b6f838df30dcaaa"
  // );
  const encoding = createRandomCleanEncoding(random, {
    system: 1,
  });
  props.update({ suffix: encodingToHex(encoding) });

  const stats = renderStats({ encoding });

  const palette = getPalette({
    system: encoding[0],
    colorSpace: props.context.getContextAttributes().colorSpace,
  });

  return ({ context, width, height, frame }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    const newEncoding = encoding.slice();
    newEncoding[1] = frame;
    // newEncoding[1] = Math.random() * 0xff;

    renderToCanvas({
      // hatch: false,
      encoding: newEncoding,
      // palette: ["orange", "red", "blue", "green"],
      // translation: 0,
      context,
      width,
      height,
    });

    // const cw = 1;
    // const ch = 1;
    // for (let y = 0; y < stats.width; y++) {
    //   for (let x = 0; x < stats.height; x++) {
    //     const id = stats.paint[x + y * stats.width];
    //     context.fillStyle = palette[id];
    //     context.fillRect(x * cw, y * ch, cw, ch);
    //   }
    // }
  };
};

canvasSketch(sketch, settings);
