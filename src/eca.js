import { byteToBinaryStringLE } from "./bits.js";

export const FillMode = {
  REPEAT: 0x00,
  LEFT: 0x01,
  RIGHT: 0x02,
  CENTER: 0x03,
};

export const StandardRules = {
  COMPLEMENT: 51,
  IDENTITY: 204,
  LEFT_SHIFT: 170,
  RIGHT_SHIFT: 110,
};

export default function ECAIterator(
  pattern,
  ruleNumber = 90,
  size = 8,
  wrap = false,
  fill = 0x00
) {
  if (typeof pattern !== "string")
    throw new Error("must provide string pattern");
  pattern = pattern.split("").map((n) => parseInt(n, 10));
  if (pattern.length !== 8)
    throw new Error("pattern must be an 8 bit binary field");

  // Convert rule number to a binary rule array
  const ruleBinary = byteToBinaryStringLE(ruleNumber)
    .split("")
    .map((p) => parseInt(p, 10));

  // Expand initial pattern to the required size
  let currentPattern = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    // the way we construct the first row
    // by default, just repeat the pattern to fill the size we want
    // but in some cases we might want to left align the pattern and fill the rest with zeroes
    // or for example fill the pattern in the center (rounded) and pad the rest with zeroes
    if (fill === FillMode.REPEAT) {
      // repeat
      currentPattern[i] = pattern[i % pattern.length];
    } else if (fill === FillMode.LEFT) {
      // left
      currentPattern[i] = i < pattern.length ? pattern[i] : 0;
    } else if (fill === FillMode.RIGHT) {
      // right
      currentPattern[i] =
        i < size - pattern.length ? 0 : pattern[i - (size - pattern.length)];
    } else if (fill === FillMode.CENTER) {
      // center
      const start = Math.floor((size - pattern.length) / 2);
      const end = start + pattern.length;
      currentPattern[i] = i >= start && i < end ? pattern[i - start] : 0;
    }
  }

  const sample = (list, i) => list[i];

  const nextRow = () => {
    const nextPattern = new Uint8Array(currentPattern.length);

    // Compute the next generation for each cell
    for (let i = 0; i < currentPattern.length; i++) {
      const left =
        i === 0
          ? wrap
            ? sample(currentPattern, currentPattern.length - 1)
            : 0
          : sample(currentPattern, i - 1);
      const center = sample(currentPattern, i);
      const right =
        i === currentPattern.length - 1
          ? wrap
            ? sample(currentPattern, 0)
            : 0
          : sample(currentPattern, i + 1);
      const index = left * 4 + center * 2 + right;
      nextPattern[i] = ruleBinary[index];
    }

    // Update the current pattern before returning it
    const result = currentPattern;
    currentPattern = nextPattern;
    return result;
  };

  let idx = 0;
  let row = null;
  return () => {
    if (row == null) {
      row = nextRow();
    }
    const v = row[idx];
    idx++;
    if (idx >= row.length) {
      row = null;
      idx = 0;
    }
    return v === 1;
  };
}
