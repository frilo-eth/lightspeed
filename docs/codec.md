# Codec

The Bitframes codec is contained in 32 bytes of data. The first 2 bytes act as a header. The remaining 30 bytes denote the _Layer_ data that makes up the artwork.

| BYTE    | DATA         | DESCRIPTION                                          |
| ------- | ------------ | ---------------------------------------------------- |
| 0       | SYSTEM       | which system palette to use, `0` or `1` is supported |
| 1       | FRAME        | the animation frame, between `0 .. 255`              |
| 2 .. 30 | (LAYER DATA) | the encoded data for each of the 5 layers            |

### Note: Endianness, Nibbles, Crumbs

The codec uses little-endian to pack and unpack multiple values into a single byte. This was selected to match the endianness of Wolfram's [Elementary Cellular Automata](https://en.wikipedia.org/wiki/Elementary_cellular_automaton) and its well-known set of rules.

In this spec, a nibble is a 4-bit value (16 possible values each), and a crumb is a 2-bit value (4 possible values each). Booleans are expressed with a single bit (1 == true).

## Composition

A _Composition_ is an output of _Cells_ constructed from the given FRAME index and each of the 5 LAYERS, rendered sequentially. It is the visual output of a single Bitframes encoding.

Each layer can have independent variables such as COLORS and DIMENSIONS, that defines how the Cells in that layer will be drawn. A layer is little more than a list of Cells, where each cell is often a filled and colored rectangle (or similar, such as a hatch-filled rectangle).

## Header Data

#### SYSTEM

The SYSTEM flag changes the global palette when rendering: `0` uses the default colorful palette, and `1` leads to an inverted black & white palette. Other values are reserved for future use; this byte could be used to create a new version of this codec that is backwards-compatible.

> _Note:_ In the Bitframes website, the System `0x01` is reserved for the 32 Bit Editions, and minting is only possible on System `0x00` (default palette).

#### FRAME

The animation FRAME of the composition, which allows each composition to have 256 different states that can be stitched together to form an animated sequence. Updating this value will affect the cell positioning of all Layers.

## Layer Data

Each LAYER is made up of 5 repeated chunks of data, each contained in 6 bytes as described below:

| BYTE | DATA           | DESCRIPTION                                  |
| ---- | -------------- | -------------------------------------------- |
| 0    | FLAGS          | bit flags for this Layer                     |
| 1    | COLORS         | the two-color palette for this Layer         |
| 2    | DIMENSIONS     | the X and Y dimensions for this Layer's grid |
| 3    | PATTERN        | the cellular pattern for this Layer          |
| 4    | RULE           | the cellular rule for this Layer             |
| 5    | SCALE_AND_SKIP | the scale and skip values for this Layer     |

#### FLAGS

The FLAGS contain a number of fields packed into 8 bits.

| BIT INDEX | FLAG      | DESCRIPTION                                 |
| --------- | --------- | ------------------------------------------- |
| 0         | VISIBLE   | binary value, whether this layer is visible |
| 1-2       | SKIP_MODE | a 2-bit crumb, the skip mode                |
| 3-4       | FILL_MODE | a 2-bit crumb, the fill mode                |
| 5-6       | FLIP_MODE | a 2-bit crumb, the flip mode                |
| 7         | WRAP      | a binary value, the wrap mode               |

These are detailed later in this spec.

#### COLORS

Each layer can have two COLORS. The two colors (each is one nibble) are packed together into a single byte. Each color value is a 4-bit index into the current system palette, which is shared across all layers.

Because each color is 4 bits, this means that each color can be one of 16 possible values. The first color (index 0) is a special case of "transparent" meaning the cell is not rendered. The color at this index in the system palette is instead used for painting the background fill.

> _Note:_ The global palette depends on the `SYSTEM` flag.

Colors are indexed into the global palette, so for example the byte `37` unpacks to the nibbles `[5, 2]`. If the cell state is "on", it will use the first nibble `5`, otherwise use `2`. This becomes the index into the palette; e.g.

```
palette = SYSTEM_PALETTES[SYSTEM]
draw_background(palette[0])

// ... when rendering each cell...
  id = COLORS[cellIsOn ? 0 : 1]
  if (id > 0)
    draw_cell(x, y, palette[id])
```

#### System Palettes

For details on the values of the system palettes, see [here](./palette.md).

#### DIMENSIONS

Each layer is constructed using a 2D grid, sized `columns` (X axis) and `rows` (Y axis). These two dimensions are packed together into a single byte.

Each is a 4-bit index into a predefined array of sizes:

```
[1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256]
```

This list is computed by taking the first 16 factors of 768.

#### PATTERN, RULE, SCALE_AND_SKIP

These additional bytes define various flags for the [ECA](#ECA) cell constructor, and are described in more detail in the sections below.

## ECA

In this spec, ECA is short for [Elementary Cellular Automata](https://en.wikipedia.org/wiki/Elementary_cellular_automaton). This determines the binary state of each cell in a given layer, which is used to paint the cells. A state of `1` is considered 'on', i.e. the cell will use the first color in the pair, otherwise the second color in the pair is used.

PATTERN defines eight booleans to use as initial data (after converting the byte to a binary sequence).

RULE defines the mode of interaction with the cellular automata, matching the same 256 rules as in Wolfram's system.

The flags that define the ECA are described below:

- `pattern`
- `rule`
- `skipMode`
- `fillMode`
- `flipMode`
- `scale`
- `skip`

## Steps

#### **1. Setup and Parameters**

- **Visibility Check**:
  - If `VISIBLE` is `false`, the layer has no cells, and can be skipped
  - If both `COLOR` values are zero (i.e. the byte is `0x00`), the layer is transparent, with no visible cells, and can be skipped
- **Set Parameters**:
  - **Flip Mode**: Determines cell transformations, affecting the `(x, y)` coordinates
    - `0x00 (NONE)`: No flip
    - `0x01 (HORIZONTAL)`: Horizontally flip `cols - x - 1`
    - `0x02 (VERTICAL)`: Vertical flip `rows - y - 1`
    - `0x03 (BOTH)`: Both horizontal and vertical flip
  - **Grid Dimensions**: Turn the DIMENSIONS nibbles into a `(columns, rows)` tuple, by indexing into the fixed grid sizes (16 first factors of 768)
  - **Pattern Scale**: Compute a `patternScale` value. If `SCALE` is zero, set this value to 8, otherwise multiply `SCALE` by the number of `columns` in the grid
  - **Skip Value**: Compute a `skipBoundary` value. After every `skipBoundary` cells iterated upon, increment the iterator by `skip` number of cells (therefore skipping some from being shown)
    - `0x00 (BINARY)`: `skipBoundary` will be 8 (length of the binary PATTERN)
    - `0x01 (COLUMNS)`: `skipBoundary` will be the length of `columns`
    - `0x02 (SCALED_COLUMNS)`: `skipBoundary` will be set to `patternScale`
    - `0x03 (EQUAL)`: `skipBoundary` will be set to `skip`

#### **2. Initialize Cellular Automaton**

Build a elementary cellular automata system with the following features:

- **Init Row**: The initial state of the cellular automata is determined by PATTERN (eight bits in little-endian) and RULE, and the flags below.
- **Rule Number**: This `RULE` is per Wolfram's original cellular automata. Some rules are notable: 51 (complement), 204 (identity), 170 (left shift), 110 (right shift).
- **Fill Mode (`fillMode`)**: The initial row is filled to the length of `patternScale` based on the PATTERN and fill mode:
  - `0x00 (REPEAT)`: Repeats the 8 bits over the length of the row (modulo)
  - `0x01 (LEFT)`: Aligns the 8 bits to the left, and fills the rest of the row with zero
  - `0x02 (RIGHT)`: Aligns the 8 bits to the right of the row, and fills the beginning with zero
  - `0x03 (CENTER)`: Aligns the 8 bits to the center of the row, filling the rest with zero
- **Wrap Mode**: When sampling from the previous rows, this determines whether neighbouring values should wrap-around the number of columns, or be clamped to edges, based on `WRAP` (a boolean).

#### **3. Generate Pattern and Process Cells**

- Create a `pointer` value set to `0`
- For each cell `i` from `0` to `cols * rows`:
  - **Position**: Calculate `x = i % cols`, `y = floor(i / cols)`.
  - **Cell State**: Determine the cell `state` from the cellular automata (`0` or `1`)
  - **Assign Color**: If `state` is 1 ("on"), use the first COLOR in the byte, otherwise use the second. If the color index of this cell is `0`, skip rendering. This index is then used to index into the global [Palette](#palette).
  - **Apply Flip Transformation**: Adjust `(x, y)` based on `flipMode`
  - **Frame Offset**: Apply another transformation based on FRAME, like so:
    - `i2 = ((x + y * cols) + frame) % (cols * rows)`
    - `x = i2 % cols`, `y = floor(i2 / cols)`
  - **Render Cell**: Place or record the cell at `(x, y)` with the currently assigned color
  - **Skip Forward**:
    - Increment `pointer` by one.
    - Set an `increment` value to 1
    - If `pointer` has reached `skipBoundary`, reset `pointer` to zero and set `increment` to `cellSkip`
    - Increment `i` by `increment`

## Decoding Reference

To decode the 32 bytes into a set of options for a given composition, some pseudocode is referenced below:

```js
VERSION = readByte();
FRAME = readByte();

LAYERS = [];
for (let i = 0; i < 5; i++) {
  LAYERS[i] = {
    FLAGS: unpackFlags(readByte()),
    COLORS: unpackNibblesLE(),
    DIMENSIONS: unpackNibblesLE(),
    PATTERN: byteToBinaryStringLE(readByte()),
    RULE: readByte(),
    SCALE_AND_SKIP: unpackNibblesLE(),
  };

  LAYERS[i] = LAYER;
}

function byteToBinaryStringLE(byte) {
  let binaryStr = "";
  for (let i = 0; i < 8; i++) {
    // Extract each bit, starting from the least significant bit
    binaryStr += (byte >> i) & 1;
  }
  return binaryStr;
}

function unpackNibblesLE(byte) {
  const lowNibble = byte & 0x0f; // Extract the lower nibble
  const highNibble = (byte >> 4) & 0x0f; // Extract the higher nibble by shifting right
  return [lowNibble, highNibble];
}

function unpackFlags(byte) {
  return {
    visible: Boolean((byte >> 0) & 0x01),
    skipMode: (byte >> 1) & 0x03,
    fillMode: (byte >> 3) & 0x03,
    flipMode: (byte >> 5) & 0x03,
    wrap: Boolean((byte >> 7) & 0x01),
  };
}
```

## Margin

Bitframes are typically rendered with a margin, allowing the background color to be visible. The default margin factor for SYSTEM `0` is `0.1`, and for SYSTEM `1` it is `0.2`, and this factor is multiplied by `min(width, height)`.

## Notes

- Encodings can be easily serialized as a hex string
- Renderers may choose different aesthetic qualities when rendering a Bitframes composition; for example, using filled rectangles, or hatch-filled rectangles, as long as the overall structure remains intact
- Specific rendering styles might be better utilized for certain applications, such as rendering for print or rendering for a e-ink screen, or using rectangles as a fast and low-quality preview for a more complex rendering
- If randomness is used during the rendering, it should be deterministic, and the seed for this should be based on the 30 trailing bytes of the Bitframes encoding, to ensure the changing the SYSTEM palette and FRAME will not lead to significant visual changes
- The colors are not specific to a gamut or sRGB color space, and the codec can support wide-gamut color spaces such as Display P3
