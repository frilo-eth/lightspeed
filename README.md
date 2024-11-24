# bitframes

> 🔧 This repository is a work in progress – please check back in a couple days as it will be more fleshed out.

Bitframes is an open source codec for generative art, contained within 32 bytes of data. Each stream of 32 bytes represents a single composition, that can be realized as a digital or print artwork. This repository contains the technical details and codec specification, but more details about the release of the artwork, and how it is being used to help crowdfund a documentary film about the history of Generative Art, can be found on the Bitframes website (will be released shortly).

## Demo

See [the CodeSandbox demo](https://codesandbox.io/p/sandbox/bitframes-sketch-vsqx9l) for an example of some basic functionality.

## Example

An example of rendering a hex string:

`"00000611fa0e90453d10ee8045016b0737b7d87e4b016db5b2d22401dde6ff01"`

```js
import { renderToCanvas, hexToEncoding } from "bitframes";

const context = canvas.getContext("2d", { colorSpace: "display-p3" });

const encoding = hexToEncoding(
  "00000611fa0e90453d10ee8045016b0737b7d87e4b016db5b2d22401dde6ff01"
);

renderToCanvas({
  context,
  width,
  height,
  encoding,
  // on by default, but you can disable for low-res pixelated rendering
  hatch: true,
});
```

The above code should match the output of [token #295](https://bitframes.io/gallery/token/295).

## Codec

The codec for the artwork is described in [./docs/codec.md](./docs/codec.md).

## Crowdfund

Bitframes is being released as a month-long public crowdfund ('open edition ERC721 mint') on Ethereum L1, with 100% of all net proceeds from minting being directed toward the development of a feature-length documentary film on the history of Generative Art, being directed by Tordoff Films Ltd in the UK.

Website and details to be announced shortly.

## Running Locally

This repository includes a reference implementation in JavaScript, that can be used to render new graphics in Node.js and the browser.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/bitframes/blob/master/LICENSE.md) for details.
