import { byteToBinaryLE } from "../src/bits.js";
import { getGridSizes } from "../src/codec.js";
import ECAIterator, { ECAIterator2 } from "../src/eca.js";
import { PRNG } from "../src/prng.js";

const count = 100;

const random = PRNG("1234");
const GRID_SIZES = getGridSizes();
const patternScale = random.rangeFloor(0, 16);
const cols = GRID_SIZES[random.rangeFloor(0, GRID_SIZES.length)];
const patternColumns = patternScale === 0 ? 8 : cols * patternScale;
const wrap = random.boolean();
const fill = random.pick([0x00, 0x01, 0x02, 0x03]);
const rule = random.rangeFloor(0, 256);
const pattern = byteToBinaryLE(random.rangeFloor(0, 256));

const inputs = [];
for (let i = 0; i < count; i++) {
  inputs.push([pattern, rule, patternColumns, wrap, fill]);
}

const cellCount = GRID_SIZES[GRID_SIZES.length - 1] ** 2;
const strings = [];

// for (let { pattern, rule, patternColumns, wrap, fill } of inputs) {
//   const iterator = ECAIterator(pattern, rule, patternColumns, wrap, fill);
//   const buf = [];
//   for (let i = 0; i < cellCount; i++) buf.push(iterator() ? 1 : 0);
//   strings.push(buf.join(""));
// }

// let idx = 0;
// for (let { pattern, rule, patternColumns, wrap, fill } of inputs) {
//   const iterator = ECAIterator2(pattern, rule, patternColumns, wrap, fill);
//   const buf = [];
//   for (let i = 0; i < cellCount; i++) buf.push(iterator() ? 1 : 0);
//   const str = buf.join("");
//   const expected = strings[idx];
//   if (str !== expected) {
//     console.log("err");
//   }

//   idx++;
//   // strings.push(buf.join(''))
// }

const a = ECAIterator(...inputs[0]);
const b = ECAIterator2(...inputs[0]);

for (let i = 0; i < 1000; i++) {
  const a0 = a();
  const b0 = b();
  if (a0 !== b0) {
    console.log(a0, b0, i);
    throw new Error("err");
  }
}
