import { decode, encodingToHex, hexToEncoding } from "../src/codec.js";
import { createRandomVisibleEncoding } from "../src/util.js";
import PRNG from "../src/prng.js";
import {
  createRenderer,
  DEFAULT_BACKGROUND,
  renderToCanvas,
} from "../src/render.js";

const SIZE = 128;
document.body.style.cssText = `
  width: 100%;
  height: 100%;
  grid-template-columns: repeat(auto-fill, minmax(${SIZE}px, 1fr));
  grid-gap: 10px;
  padding: 10px;
  box-sizing: border-box;
  display: grid;
`;

const queue = [];

for (let i = 0; i < 35; i++) {
  const encoding = createRandomVisibleEncoding();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const width = SIZE * 3;
  const height = SIZE * 3;
  const container = document.createElement("div");
  container.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    aspect-ratio: 1;
    justify-content: center;
    align-items: center;
  `;
  canvas.width = width;
  canvas.height = height;

  queue.push(() => {
    renderToCanvas({
      hatch: true,
      width,
      height,
      encoding,
      context,
    });
  });

  canvas.style.cssText = `
    aspect-ratio: 1;
    width: ${SIZE}px;
    height: ${SIZE}px;
    box-shadow: none;
  `;
  container.appendChild(canvas);
  document.body.appendChild(container);
}

(async () => {
  for (let fn of queue) {
    fn();
    await new Promise((r) => setTimeout(r, 5));
  }
})();
