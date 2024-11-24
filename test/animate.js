import canvasSketch from "canvas-sketch";
import { renderStats, renderToCanvas } from "../src/render";
import { PRNG } from "../src/prng";
import {
  createRandomCleanEncoding,
  createRandomVisibleEncoding,
} from "../src/util";
import {
  decode,
  encode,
  encodingToHex,
  FillMode,
  hexToEncoding,
  FlipMode,
} from "../src/codec";
import { getPalette } from "../src/colors";
import { binaryStringToByteLE } from "../src/bits";

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
  let encoding = hexToEncoding(
    "00000611fa0e90453d10ff8045016b0737b7d87e4b016db5b2d22401dde6ff01"
  );
  // const alt = decode(
  //   hexToEncoding(
  //     "0000e50bcec172ea2e8324b24a32024881f7850ffa66327a766a7287a4bb7b9f"
  //   )
  // );

  // const encoding = createRandomCleanEncoding(random, {
  //   system: 1,
  // });

  const doc = decode(encoding);
  // doc.layers[2].flipMode = FlipMode.BOTH;
  doc.layers[1].dimensions = [14, 14];
  // doc.layers[1].pattern = binaryStringToByteLE("00000001");
  // doc.layers[1].skip = 0;
  // doc.layers[1].scale = 1;
  // doc.layers[1].fillMode = FillMode.CENTER;
  // doc.layers[1].wrap = false;

  // pattern,
  // rule,
  // scale: scaleAndSkip[0],
  // skip: scaleAndSkip[1],
  // skipMode: flags.skipMode,
  // fillMode: flags.fillMode,
  // flipMode: flags.flipMode,
  // wrap: flags.wrap,

  encoding = encode(doc);

  console.log(encodingToHex(encoding));
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
