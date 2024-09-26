import canvasSketch from "canvas-sketch";
import { renderToCanvas } from "../src/render";
import PRNG from "../src/prng";
import { createRandomVisibleEncoding } from "../src/util";
import { encodingToHex, hexToEncoding } from "../src/codec";

const random = PRNG();

const colorSpace = "srgb";
const settings = {
  attributes: {
    colorSpace,
  },
  fps: 12,
  playbackRate: "throttle",
  animate: true,
  totalFrames: 256,
  dimensions: [2048, 2048],
};

const sketch = (props) => {
  const encoding = hexToEncoding(
    "00001ea3e9a46af35deda5619292f6f8b983c7628ed09242f78887fad918638a"
  );
  // const encoding = createRandomVisibleEncoding();
  props.update({ suffix: encodingToHex(encoding) });

  return ({ context, width, height, frame }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    const newEncoding = encoding.slice();
    // newEncoding[1] = Math.random() * 0xff;

    renderToCanvas({
      encoding: newEncoding,
      colorSpace,
      context,
      width,
      height,
    });
  };
};

canvasSketch(sketch, settings);
