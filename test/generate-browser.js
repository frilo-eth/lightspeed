import { randomSeed } from "../src/prng.js";
import generate from "./generate.js";

console.log("GEN", generate);
generate({
  seed: "2f45dab92e6aa4d7fbe8aa08887c891e",
  // seed: randomSeed(),
  gap: 0,
  columns: 1,
  rows: 1,
  renderSize: 2048 * 1,
  cellSize: 2048 * 1,
  contextAttributes: {
    // colorSpace: "display-p3",
  },
  createCanvas(w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  },
  mount(canvas) {
    document.body.appendChild(canvas);
    canvas.style.width = "90%";
    canvas.style.height = "auto";
  },
  saveImage(canvas, encoding) {},
  saveOutput(canvas) {},
});
