import { createEmptyEncoding, decode, hexToEncoding } from "../src/index.js";
import { readFile } from "fs/promises";

const tokens = (await readFile("test/1000.csv", "utf8"))
  .split("\n")
  .filter(Boolean)
  .map((s) => {
    const [token_id, encodingHex] = s.split(",");
    return {
      token_id: parseInt(token_id, 10),
      encoding: hexToEncoding(encodingHex),
    };
  });

const data = new Map();

for (let token of tokens) {
  const { token_id, encoding } = token;
  const doc = decode(encoding);

  for (let k of ["frame", "system"]) {
    if (!data.has(k)) {
      data.set(k, new Set());
    }
    const set = data.get(k);
    set.add(doc[k]);
  }

  for (let layer of doc.layers) {
    for (let k of Object.keys(layer)) {
      if (!data.has(k)) {
        data.set(k, new Set());
      }
      const set = data.get(k);
      set.add(layer[k]);
    }
  }
}

// for (let k in data) {
//   data[k] /= tokens.length;
// }

console.log("Total Count:", tokens.length);
console.log(data);
