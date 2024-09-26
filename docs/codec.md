## Codec

The Bitframes codec is contained in 32 bytes of data. The first 2 bytes act as a header. The remaining 30 bytes denote the _Layer_ data.

| BYTE    | DATA         | DESCRIPTION                               |
| ------- | ------------ | ----------------------------------------- |
| 0       | VERSION      | the codec version, only `0` is supported  |
| 1       | FRAME        | the animation frame, between `0 .. 255`   |
| 2 .. 30 | (LAYER DATA) | the encoded data for each of the 5 layers |

The Layer data is made up of 5 repeated chunks of data, each contained in 6 bytes as described below:

| BYTE | DATA           | DESCRIPTION                                  |
| ---- | -------------- | -------------------------------------------- |
| 0    | FLAGS          | bit flags for this Layer                     |
| 1    | COLORS         | the two-color palette for this Layer         |
| 2    | DIMENSIONS     | the X and Y dimensions for this Layer's grid |
| 3    | PATTERN        | the cellular pattern for this Layer          |
| 4    | RULE           | the cellular rule for this Layer             |
| 5    | SCALE_AND_SKIP | the scale and skip values for this Layer     |

### Note: Endianness

The codec uses little-endian to pack and unpack multiple values into a single byte. This was selected to match the endianness of Wolfram's [Elementary Cellular Automata](https://en.wikipedia.org/wiki/Elementary_cellular_automaton) and its well-known set of rules.

## Composition

A _Composition_ is an output of _Cells_ constructed from the given FRAME index and each of the 5 Layers, rendered sequentially. It is the visual output of a single Bitframes encoding.

Each Layer can have independent variables such as COLORS and DIMENSIONS, that defines how the Cells in that layer will be drawn. A Layer is little more than a list of Cells, where each cell is often a filled and colored rectangle (or similar, such as a hatch-filled rectangle).

Below is an animation demonstrating the 5 Layers being drawn, one on top of another, to form the final Composition.

## Header Data

#### VERSION

The version of the codec, you should use `0` which means this specification. This byte is reserved for future updates.

#### FRAME

The animation FRAME of the composition, which allows each composition to have 256 different states that can be stitched together to form an animated sequence. Updating this value will affect the cell positioning of all Layers. This is further documented in the [ECA](#eca) section.

## Layer Data

Each of the 5 Layers can have independent values.

#### FLAGS

The FLAGS contain a number of fields packed into 8 bits.

| BIT INDEX | FLAG      | DESCRIPTION                                 |
| --------- | --------- | ------------------------------------------- |
| 0         | VISIBLE   | binary value, whether this layer is visible |
| 1-2       | SKIP_MODE | a 2-bit crumb, the skip mode                |
| 3-4       | FILL_MODE | a 2-bit crumb, the fill mode                |
| 5-6       | FLIP_MODE | a 2-bit crumb, the flip mode                |
| 7         | WRAP      | a binary value, the wrap mode               |

These are detailed further in the [ECA](#eca) section.

#### COLORS

Each layer can have two COLORS. The two colors are packed together into a single byte. Each color value is a 4-bit index into the [PALETTE](#PALETTE), which is a global color palette shared across all outputs.

Because each color is 4 bits, this means that each color can be one of 16 possible values. The value of `0` for a color means "transparent", i.e. a cell will not be rendered.

#### DIMENSIONS

Each layer is constructed using a 2D grid, sized `columns` (X axis) and `rows` (Y axis). These two dimensions are packed together into a single byte.

Each is a 4-bit index into a predefined list.

#### PATTERN

## ECA

In this spec, ECA is short for [Elementary Cellular Automata](https://en.wikipedia.org/wiki/Elementary_cellular_automaton). This determines the binary state of each cell in a given layer, which is used to paint the cells.

## Apendix

## PALETTE

## Reference

Below is an example decoder in pseudo-code:

```js
VERSION = readByte()
FRAME = readByte()

LAYERS = []
for (let i = 0; i < 5; i++) {
  LAYERS[i] = {
    FLAGS: unpackFlags(readByte()),
    COLORS: [readNibble(), readNibble()],
    DIMENSIONS: [readNibble(), readNibble()]
    PATTERN: byteToBinaryStringLE(readByte()),
    RULE: readByte(),
    SCALE_AND_SKIP: [readNibble(), readNibble()]
  }

  LAYERS[i] = LAYER
}

function byteToBinaryStringLE(byte) {
  let binaryStr = "";
  for (let i = 0; i < 8; i++) {
    // Extract each bit, starting from the least significant bit
    binaryStr += (byte >> i) & 1;
  }
  return binaryStr;
}
```
