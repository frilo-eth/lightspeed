import test from "tape";
import { packFlags, unpackFlags } from "../src/bits.js";
import { encodingToHex, hexToEncoding } from "../src/codec.js";

import * as bitframes from "../src/index.js";
console.log("bit", bitframes);

test("should encode/decode", async (t) => {
  const hex =
    "00001ea3e9a46af35deda5619292f6f8b983c7628ed09242f78887fad918638a";
  const encoding = hexToEncoding(hex);
  t.deepEqual(encodingToHex(encoding), hex);
  const opt = decode(encoding);
  const enc2 = encode(opt);
  t.deepEqual(enc2, encoding);
});

// test("should pack", async (t) => {
//   for (let i = 0; i < 256; i++) {
//     const unpacked = unpackBitsLE(i, [
//       ["visible", 1],
//       ["skipMode", 2],
//       ["fillMode", 2],
//       ["flipMode", 2],
//       ["wrap", 1],
//     ]);
//     const packed = packBitsLE([
//       [unpacked.visible ? 0x01 : 0x00, 1], // 1 bit
//       [unpacked.skipMode, 2], // 2 bits
//       [unpacked.fillMode, 2], // 2 bits
//       [unpacked.flipMode, 2], // 2 bits
//       [unpacked.wrap ? 0x01 : 0x00, 1], // 1 bit
//     ]);

//     const unpacked2 = unpackFlags(i);
//     const packed2 = packFlags(unpacked2);

//     t.deepEqual(packed, i);
//     t.deepEqual(
//       {
//         ...unpacked2,
//         visible: unpacked2.visible ? 1 : 0,
//         wrap: unpacked2.wrap ? 1 : 0,
//       },
//       unpacked
//     );
//     t.deepEqual(packed2, packed);
//   }
// });

function packBitsLE(fields) {
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

function unpackBitsLE(byte, fields) {
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
