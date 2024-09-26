import fs from "fs/promises";
import * as path from "path";
import * as Color from "@texel/color";

const K1 = 0.206;
const K2 = 0.03;
const K3 = (1.0 + K1) / (1.0 + K2);

const LToLr = (x) =>
  0.5 *
  (K3 * x - K1 + Math.sqrt((K3 * x - K1) * (K3 * x - K1) + 4 * K2 * K3 * x));

const LrToL = (x) => (x ** 2 + K1 * x) / (K3 * (x + K2));

const inFile = path.resolve(import.meta.dirname, "xkcd-color-names.txt");
const fileTxt = await fs.readFile(inFile, "utf8");

const data = fileTxt
  .split("\n")
  .map((n) => {
    n = n.trim();
    if (n.length === 0) return false;
    const m = n.match(/\[(.*)]\s+(.*)/);
    if (!m) {
      console.warn("could not parse", n);
      return null;
    }
    const rgb = m[1].split(",").map((n) => parseInt(n.trim(), 10));
    const name = m[2];
    if (!name) console.warn("err", n);
    return { rgb, name };
  })
  .filter(Boolean);

const colorSets = new Map();
for (let { name, rgb } of data) {
  if (!colorSets.has(name)) {
    colorSets.set(name, []);
  }

  const rgbf = rgb.map((n) => n / 0xff);
  const oklch = Color.convert(rgbf, Color.sRGB, Color.OKLCH);
  oklch[0] = LToLr(oklch[0]);
  colorSets.get(name).push(oklch);
}

const names = colorSets.keys();

for (let name of names) {
  const set = colorSets.get(name);
  const Ls = set.map((n) => n[0]);
  const Cs = set.map((n) => n[1]);
  const Hs = set.map((n) => n[2]);
  const L = computeMean(Ls);
  const C = computeMean(Cs);
  const H = computeCircularMean(Hs);

  console.log(name, [L, C, H]);
}

// const namesToOutput = [
//   'red'
//   'orange'
//   'brown'
//   'yellow'
//   'green'
//   'teal'
//   'cyan'
//   'light blue'
//   'indigo'
//   'purple'
//   'light pink'
//   'hot pink'
// ]

const namesInData = [
  "black",
  "dark green",
  "green",
  "navy blue",
  "dark blue",
  "dark teal",
  "blue",
  "teal",
  "light green",
  "light blue",
  "cyan",
  "sky blue",
  "brown",
  "dark purple",
  "maroon",
  "red",
  "dark red",
  "purple",
  "magenta",
  "pink",
  "dark brown",
  "orange",
  "olive",
  "gold",
  "mustard",
  "yellow",
  "lime green",
];

function computeMean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeCircularMean(anglesInDegrees) {
  const radians = anglesInDegrees.map((angle) => (angle * Math.PI) / 180);
  let sumSin = 0;
  let sumCos = 0;
  for (let rad of radians) {
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  }

  const avgSin = sumSin / anglesInDegrees.length;
  const avgCos = sumCos / anglesInDegrees.length;
  const meanAngleRad = Math.atan2(avgSin, avgCos);
  let meanAngleDeg = (meanAngleRad * 180) / Math.PI;

  // Normalize to [0°, 360°)
  if (meanAngleDeg < 0) {
    meanAngleDeg += 360;
  }
  return meanAngleDeg;
}
