# Palette

> See [codec.md](./codec.md) for further details

There are currently two fixed color palettes in the Bitframes spec, and which palette an artwork will use is determined by the value of the SYSTEM flag in the encoding.

The palettes are selected with a set of OKLrCH primaries, allowing them to operate in wide-gamut, and be easily transformed across color spaces. They are not clipped to any specific gamut, but clipping will be required before rendering.

## OKLrCH

OKLrCH is the cylindrical form of [OKLab](https://bottosson.github.io/posts/oklab/) but with a modified lightness estimate (Lr instead of L). This lightness estimate is the same as used in [OKHSL](https://bottosson.github.io/posts/colorpicker/), and the code for it is described below:

```js
const K1 = 0.206;
const K2 = 0.03;
const K3 = (1.0 + K1) / (1.0 + K2);

const LToLr = (x) =>
  0.5 *
  (K3 * x - K1 + Math.sqrt((K3 * x - K1) * (K3 * x - K1) + 4 * K2 * K3 * x));

const LrToL = (x) => (x ** 2 + K1 * x) / (K3 * (x + K2));
```

## Chroma

Aside from the background (beige) and achromatic colors (black, white, gray), all colors will have a maximum chroma (`Cmax`) of `0.225`. However, after gamut mapping to the desired gamut, this value may be lower.

## Gamut Mapping

If the color is out of gamut, it is mapped by reducing the chroma until the point lies along the approximate edge of the gamut; lightness and hue is preserved. This can use OKLab's [fast and approximate clipping methods](https://bottosson.github.io/posts/gamutclipping/) to gamut map primaries to sRGB, DisplayP3, and so on.

## `0x00` (Colorful)

| Index | Name           | OKLrCH              | sRGB Hex  |
| ----- | -------------- | ------------------- | --------- |
| 0     | `"background"` | `[0.9, 0.02, 85]`   | `#e9e2d4` |
| 1     | `"black"`      | `[0, 0, 0]`         | `#000000` |
| 2     | `"white"`      | `[1, 0, 0]`         | `#ffffff` |
| 3     | `"gray"`       | `[0.65, 0, 0]`      | `#9e9e9e` |
| 4     | `"red"`        | `[0.5, Cmax, 30]`   | `#dd1706` |
| 5     | `"orange"`     | `[0.68, Cmax, 55]`  | `#f88100` |
| 6     | `"brown"`      | `[0.465, Cmax, 60]` | `#a25900` |
| 7     | `"yellow"`     | `[0.85, Cmax, 95]`  | `#fad200` |
| 8     | `"green"`      | `[0.55, Cmax, 145]` | `#00a02a` |
| 9     | `"teal"`       | `[0.7, Cmax, 175]`  | `#00c7a6` |
| 10    | `"dark blue"`  | `[0.3, Cmax, 220]`  | `#004e60` |
| 11    | `"light blue"` | `[0.55, Cmax, 255]` | `#0081f8` |
| 12    | `"indigo"`     | `[0.4, Cmax, 270]`  | `#3444da` |
| 13    | `"purple"`     | `[0.4, Cmax, 310]`  | `#841bb9` |
| 14    | `"light pink"` | `[0.85, Cmax, 325]` | `#fcbaff` |
| 15    | `"hot pink"`   | `[0.75, Cmax, 345]` | `#ff8cd0` |

## `0x01` (Inverted Black & White)

In the inverted paletet, the background is black, and the layers use one of three colors: black, white, or gray. After the background, the three shades are repeated evenly across the 15 remaining slots.

> _Note:_ In the Bitframes website and crowdfund, this system is reserved for the 32 Bit Editions. If you try to mint with en encoding using System `0x01`, the blockchain will still store this as `0x00` (default palette).

| Index | Name           | OKLrCH         | sRGB Hex  |
| ----- | -------------- | -------------- | --------- |
| 0     | `"background"` | `[0, 0, 0]`    | `#000000` |
| 1     | `"black"`      | `[0, 0, 0]`    | `#000000` |
| 2     | `"white"`      | `[1, 0, 0]`    | `#ffffff` |
| 3     | `"gray"`       | `[0.65, 0, 0]` | `#9e9e9e` |
| 4     | `"black"`      | `[0, 0, 0]`    | `#000000` |
| 5     | `"white"`      | `[1, 0, 0]`    | `#ffffff` |
| 6     | `"gray"`       | `[0.65, 0, 0]` | `#9e9e9e` |
| 7     | `"black"`      | `[0, 0, 0]`    | `#000000` |
| 8     | `"white"`      | `[1, 0, 0]`    | `#ffffff` |
| 9     | `"gray"`       | `[0.65, 0, 0]` | `#9e9e9e` |
| 10    | `"black"`      | `[0, 0, 0]`    | `#000000` |
| 11    | `"white"`      | `[1, 0, 0]`    | `#ffffff` |
| 12    | `"gray"`       | `[0.65, 0, 0]` | `#9e9e9e` |
| 13    | `"black"`      | `[0, 0, 0]`    | `#000000` |
| 14    | `"white"`      | `[1, 0, 0]`    | `#ffffff` |
| 15    | `"gray"`       | `[0.65, 0, 0]` | `#9e9e9e` |
