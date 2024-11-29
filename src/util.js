import { PRNG } from "./prng.js";
import { encode, decode, constructCells, LAYER_COUNT } from "./codec.js";
import { renderStats } from "./render.js";

// non-deterministic pure JS environment randomness
const defaultRandom = PRNG(false);

const randomNibble = (random = defaultRandom) => random.rangeFloor(0, 16);
const randomByte = (random = defaultRandom) => random.rangeFloor(0, 256);
const randomCrumb = (random = defaultRandom) => random.pick([0, 1, 2, 3]);

export function createRandomCleanEncoding(prng = defaultRandom, opts = {}) {
  let encoding, stats;
  do {
    encoding = opts.createRandomEncoding
      ? opts.createRandomEncoding(prng, opts)
      : createRandomEncoding(prng, opts);
    stats = renderStats({
      encoding,
    });
  } while (!isGoodStats(stats));
  return encoding;
}

function isGoodStats(stats) {
  // check if any single cell color is contributing to the majority of the frame
  const counts = Array(16).fill(0);
  for (let i = 0; i < stats.paint.length; i++) {
    let id = stats.paint[i];
    if (stats.system == 1) {
      if (id > 0) {
        // map to b&w triplet, 1 = black, 2 = white, 3 = gray
        const t = 1 + ((id - 1) % 3);
        // if the cell is black, make it equal to the background
        if (t == 1) id = 0;
      }
    }
    counts[id]++;
  }
  const norms = counts.map((c) => c / stats.paint.length);
  // if so, skip this frame
  if (norms.some((n) => n > 0.95)) {
    return false;
  }

  // also skip frames that are not well balanced or don't have enough visible cells
  return (
    stats.boundsRatio[0] >= 0.66 &&
    stats.boundsRatio[0] <= 1 &&
    stats.boundsRatio[1] >= 0.66 &&
    stats.boundsRatio[1] <= 1 &&
    stats.totalVisibleCells > 1
  );
}

export function createEmptyEncoding(opts = {}) {
  const bytes = new Uint8Array(32);
  if (opts.system) bytes[0] = opts.system || 0;
  return bytes;
}

export function createRandomEncoding(
  random = defaultRandom,
  { system = 0, frame = 0 } = {}
) {
  return encode({
    // system defaults to zero
    system,
    // frame is typically set to zero but the rest is randomized
    frame,
    layers: Array(LAYER_COUNT)
      .fill()
      .map(() => createRandomLayer(random)),
  });
}

export function createRandomLayer(random = defaultRandom) {
  return {
    visible: random.boolean(), // 1 bit
    skipMode: randomCrumb(random), // 2 bits
    fillMode: randomCrumb(random), // 2 bits
    flipMode: randomCrumb(random), // 2 bits
    wrap: random.boolean(), // 1 bit
    colors: getRandomVisibleColorPair(random), // 8 bits
    dimensions: [randomNibble(random), randomNibble(random)], // 8 bits
    pattern: randomByte(random), // 8 bits
    rule: randomByte(random), // 8 bits
    scale: randomNibble(random), // 4 bits
    skipMode: randomNibble(random), // 4 bits
  };
}

export function createRandomVisibleEncoding(random = defaultRandom, opts = {}) {
  let encoding;
  while (true) {
    encoding = createRandomEncoding(random, opts);
    if (encodingHasVisibleCells(encoding)) {
      break;
    }
  }
  return encoding;
}

function getRandomVisibleColorPair(random) {
  let colors;
  do {
    colors = [randomNibble(random), randomNibble(random)];
  } while (colors[0] === 0x00 && colors[1] === 0x00);
  return colors;
}

function encodingHasVisibleCells(encoding) {
  const { layers, frame = 0 } = decode(encoding);
  for (let layer of layers) {
    const cells = constructCells({ layer, frame, maxCells: 1 });
    if (cells.length > 0) {
      return true;
    }
  }
  return false;
}
