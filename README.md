# bitframes

Bitframes is an open source codec for generative art, contained within 32 bytes of data. Each stream of 32 bytes represents a single composition, that can be realized as a digital or print artwork. This repository contains the technical details and codec specification, but more details about the release of the artwork, and how it is being used to help crowdfund a documentary film, can be found on the [bitframes website](https://bitframes.io/).

## Contents

- About
- Codec
- Protocol
- Running Locally

## About

The Bitframes project has two distinct aspects:

1. Codec: This is the specification for how an _encoding_ (32 bytes of data) are mapped to a visual artwork. This is language and environment independent, although a reference implementation exists for JavaScript.
2. Protocol: This is a series of contracts on Ethereum L1 EVM that acts as the payment and storage mechanisms for an online and distributed art gallery, that is used during the crowdfund. The contract also contains a list of all the _encodings_ published by the crowdfund backers.

## Codec

You can read more technical details about the codec here.

## Protocol

You can read more technical details about the protocol here.

## Running Locally

This repository also includes a reference implementation in JavaScript, that can be used to render new graphics in Node.js and the browser.

You will need Node.js v21 or newer, along with [npm](https://npmjs.com/) to install dependencies. First, clone this repository, then:

```sh
npm install
```

Now you can run the command locally to generate a SVG file:

```sh
node tool/cli.js --output=svg
```

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/bitframes/blob/master/LICENSE.md) for details.
