// @ts-ignore
import colorNamer from "color-namer";
// @ts-ignore
import convert from "color-convert";

export type Palette = {
  name: string;
  colors: {
    [key: number]: string;
  }
};

const CMY_HUES = [180, 300, 60];
const RGB_HUES = [360, 240, 120, 0];

export function getTextColor(color: string): "#FFF" | "#333" {
  const rgbColor = convert.hex.rgb(color);

  if (!rgbColor) {
    return "#333";
  }

  const [r, g, b] = rgbColor;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luma < 120 ? "#FFF" : "#333";
}

function hueShift(hues: Array<number>, hue: number, intensity: number) {
  const closestHue = hues.sort((a, b) => (Math.abs(a - hue) - Math.abs(b - hue)))[0],
    hueShift = closestHue - hue;
  return Math.round(intensity * hueShift * 0.5);
}

function lighten(hex: string, intensity: number): string {
  if (!hex) {
    return "";
  }

  const [h, s, v] = convert.hex.hsv(hex);
  const hue = h + hueShift(CMY_HUES, h, intensity);
  const saturation = s - Math.round(s * intensity);
  const value = v + Math.round((100 - v) * intensity);

  return `#${convert.hsv.hex([hue, saturation, value])}`;
}

function darken(hex: string, intensity: number): string {
  if (!hex) {
    return "";
  }

  const inverseIntensity =  (1 - intensity);
  const [h, s, v] = convert.hex.hsv(hex);
  const hue = h + hueShift(RGB_HUES, h, inverseIntensity);
  const saturation = s + Math.round((100 - s) * inverseIntensity);
  const value = v - Math.round(v * inverseIntensity);

  return `#${convert.hsv.hex([hue, saturation, value])}`;
}

export function isValidHexColorCode(str: string) {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(str);
}

export function getColorName(color: string): string {
  const { name } = colorNamer(`#${color}`.replace("##", "#")).ntc[0];
  const sanitizedName = name
    .replace(/['/]/gi, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  return sanitizedName;
}

export function sixDigitsColorHex (hexColor: string) {
  const hexValue = hexColor.replace('#', '')
  return `#${(hexValue.length === 3 ? hexValue.replace(/(.)/g, '$1$1') : hexValue.padEnd(6, '0'))}`;
}

export default function (baseColor?: string): Palette | undefined {
  if (!baseColor) {
    return
  }

  const fullColorCode = sixDigitsColorHex(baseColor)

  const name = getColorName(fullColorCode);

  const response: Palette = {
    name,
    colors: {
      500: fullColorCode
    }
  };

  const intensityMap: {
    [key: number]: number;
  } = {
    50: 0.95,
    100: 0.9,
    200: 0.75,
    300: 0.6,
    400: 0.3,
    600: 0.9,
    700: 0.75,
    800: 0.6,
    900: 0.45,
    950: 0.29
  };

  [50, 100, 200, 300, 400].forEach(level => {
    response.colors[level] = lighten(fullColorCode, intensityMap[level]);
  });

  [600, 700, 800, 900, 950].forEach(level => {
    response.colors[level] = darken(fullColorCode, intensityMap[level]);
  });

  return response as Palette;
}
