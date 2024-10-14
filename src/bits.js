export function byteToBinaryStringLE(byte) {
  if (typeof byte !== "number" || byte < 0 || byte > 255) {
    throw new Error("must be between 0 and 255.");
  }
  let binaryStr = "";
  for (let i = 0; i < 8; i++) {
    // Extract each bit, starting from the least significant bit
    binaryStr += (byte >> i) & 1;
  }
  return binaryStr;
}

export function binaryStringToByteLE(binaryStr) {
  if (typeof binaryStr !== "string") {
    throw new Error("must be a binary string");
  }
  if (!/^[01]{8}$/.test(binaryStr)) {
    throw new Error("must be a binary string of length 8");
  }
  let byte = 0;
  for (let i = 0; i < 8; i++) {
    // Set each bit according to the binary string from LSB to MSB
    byte |= (binaryStr[i] === "1" ? 1 : 0) << i;
  }
  return byte;
}

export function packNibblesLE([lowNibble, highNibble]) {
  const mask = 0x0f; // Mask to ensure only the lowest 4 bits are considered
  // Apply the mask to both nibbles and shift the high nibble by 4 bits to the left
  return (lowNibble & mask) | ((highNibble & mask) << 4);
}

export function unpackNibblesLE(byte) {
  const lowNibble = byte & 0x0f; // Extract the lower nibble
  const highNibble = (byte >> 4) & 0x0f; // Extract the higher nibble by shifting right
  return [lowNibble, highNibble];
}

export function packFlags(layer) {
  let result = 0;
  result |= ((layer.visible ? 1 : 0) & 0x01) << 0;
  result |= (layer.skipMode & 0x03) << 1;
  result |= (layer.fillMode & 0x03) << 3;
  result |= (layer.flipMode & 0x03) << 5;
  result |= ((layer.wrap ? 1 : 0) & 0x01) << 7;
  return result;
}

export function unpackFlags(byte) {
  return {
    visible: Boolean((byte >> 0) & 0x01),
    skipMode: (byte >> 1) & 0x03,
    fillMode: (byte >> 3) & 0x03,
    flipMode: (byte >> 5) & 0x03,
    wrap: Boolean((byte >> 7) & 0x01),
  };
}
