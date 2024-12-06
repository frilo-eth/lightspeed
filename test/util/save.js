import {
  readChunks,
  writeChunks,
  ChunkType,
  encode_pHYs_PPI,
  encode_iTXt,
  decode_iTXt,
} from "png-tools";
import { encodingToHex } from "../../src/index.js";

let link;

export function downloadBuffer(buf, opts = {}) {
  const { filename = "download" } = opts;
  const blob = new Blob([buf], opts);
  return downloadBlob(blob, { filename });
}

export async function downloadEncoding(canvas, opts = {}) {
  const { type = "image/png" } = opts;
  opts = { ...opts, type };
  let buffer = await canvasToBuffer(canvas, opts);
  const oldBuffer = buffer;
  try {
    let chunks = readChunks(buffer, { copy: false });

    if (opts.encoding) {
      chunks = chunks.filter((c) => {
        if (c.type == ChunkType.iTXt) {
          const decoded = decode_iTXt(c.data);
          if (decoded.keyword == "encoding") return false;
        }
        return true;
      });

      chunks.splice(1, 0, {
        type: ChunkType.iTXt,
        data: encode_iTXt({
          keyword: "encoding",
          text: encodingToHex(opts.encoding),
        }),
      });
    }

    if (opts.pixelsPerInch) {
      chunks.splice(1, 0, {
        type: ChunkType.pHYs,
        data: encode_pHYs_PPI(opts.pixelsPerInch),
      });
    }

    buffer = writeChunks(chunks);
  } catch (err) {
    console.warn(err);
    buffer = oldBuffer;
  }

  return downloadBuffer(buffer, opts);
}

export async function downloadCanvas(canvas, opts = {}) {
  const blob = await new Promise((r) =>
    canvas.toBlob(r, opts.encoding, opts.encodingQuality)
  );
  return downloadBlob(blob, opts);
}

export function downloadBlob(blob, opts = {}) {
  return new Promise((resolve) => {
    const filename = opts.filename || getTimestamp();
    if (!link) {
      link = document.createElement("a");
      link.style.visibility = "hidden";
      link.target = "_blank";
    }
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);

    link.onclick = () => {
      link.onclick = () => {};
      setTimeout(() => {
        window.URL.revokeObjectURL(blob);
        if (link.parentElement) link.parentElement.removeChild(link);
        link.removeAttribute("href");
        resolve({ filename });
      }, 0);
    };
    link.click();
  });
}

export function getTimestamp() {
  const today = new Date();
  const yyyy = today.getFullYear();
  let [mm, dd, hh, min, sec] = [
    today.getMonth() + 1, // Months start at 0!
    today.getDate(),
    today.getHours(),
    today.getMinutes(),
    today.getSeconds(),
  ].map((c) => String(c).padStart(2, "0"));
  return `${yyyy}.${mm}.${dd}-${hh}.${min}.${sec}`;
}

export async function canvasToBuffer(canvas, opts = {}) {
  let blob;
  if (typeof canvas.convertToBlob === "function") {
    // for off screen canvas, e.g. worker threads
    blob = await canvas.convertToBlob(opts);
  } else {
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, opts.type, opts.quality)
    );
  }
  const arrayBuf = await blob.arrayBuffer();
  const buf = new Uint8Array(arrayBuf);
  return buf;
}
