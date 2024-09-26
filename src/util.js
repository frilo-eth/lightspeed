import PRNG from "./prng.js";
import { encode, decode, constructCells, LAYER_COUNT } from "./codec.js";

// non-deterministic pure JS environment randomness
const defaultRandom = PRNG(false);

const randomNibble = (random = defaultRandom) => random.rangeFloor(0, 16);
const randomByte = (random = defaultRandom) => random.rangeFloor(0, 256);
const randomCrumb = (random = defaultRandom) => random.pick([0, 1, 2, 3]);

export function createEmptyEncoding() {
  const bytes = new Uint8Array(32);
  return bytes;
}

export function createRandomEncoding(random = defaultRandom) {
  return encode({
    // frame is set to a constant 0 but rest of layer data is random
    frame: 0,
    layers: Array(LAYER_COUNT)
      .fill()
      .map(() => createRandomLayer(random)),
  });
}

export function createRandomLayer(random = defaultRandom) {
  return {
    visible: random.boolean(), // 1 bit
    skipMode: randomCrumb(random), // 2 bits
    fill: randomCrumb(random), // 2 bits
    flip: randomCrumb(random), // 2 bits
    wrap: random.boolean(), // 1 bit
    colors: [randomNibble(random), randomNibble(random)], // 8 bits
    dimensions: [randomNibble(random), randomNibble(random)], // 8 bits
    pattern: randomByte(random), // 8 bits
    rule: randomByte(random), // 8 bits
    scale: randomNibble(random), // 4 bits
    skip: randomNibble(random), // 4 bits
  };
}

export function createRandomVisibleEncoding(random = defaultRandom) {
  let encoding;
  while (true) {
    encoding = createRandomEncoding(random);
    if (encodingHasVisibleCells(encoding)) {
      break;
    }
  }
  return encoding;
}

export function encodingHasVisibleCells(encoding) {
  const { layers, frame = 0 } = decode(encoding);
  for (let layer of layers) {
    const cells = constructCells({ layer, frame, maxCells: 1 });
    if (cells.length > 0) {
      return true;
    }
  }
  return false;
}
