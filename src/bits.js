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

export function packBitsLE(fields) {
  let result = 0;
  let currentBit = 0;

  for (let i = 0; i < fields.length; i++) {
    const [value, size] = fields[i];
    if (currentBit + size > 8) {
      throw new Error("total bits exceed 8");
    }
    // Mask the value to ensure it fits within the specified bit size
    const mask = (1 << size) - 1;
    const valueToPack = (value & mask) << currentBit;
    result |= valueToPack;
    currentBit += size;
  }

  return result;
}

export function unpackBitsLE(byte, fields) {
  let result = {};
  let currentBit = 0;

  for (let [name, size] of fields) {
    if (currentBit + size > 8) {
      throw new Error("total bits exceed 8");
    }
    const mask = (1 << size) - 1;
    const value = (byte >> currentBit) & mask;
    if (name in result) throw new Error("duplicate field name in table");
    result[name] = value;
    currentBit += size;
  }

  return result;
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

export function unpackBooleansLE(byte, bitCount = 8) {
  if (byte < 0 || byte > 255) {
    throw new Error("must be a byte (0-255)");
  }
  const booleans = [];
  for (let i = 0; i < bitCount; i++) {
    // Only first N bits are processed
    // Shift right by 'i' and check if the least significant bit is 1
    booleans.push(((byte >> i) & 1) === 1);
  }
  return booleans;
}

export function packBooleansLE(booleans) {
  if (booleans.length > 8) {
    throw new Error("array length cannot exceed ");
  }
  let byte = 0;
  for (let i = 0; i < booleans.length; i++) {
    if (booleans[i]) {
      // Only set the bit if the boolean is true
      // Set the bit at position 'i'
      byte |= 1 << i;
    }
  }
  return byte;
}
