import type { Palette } from '@/components/ColorPalette.vue';
import { parse, interpolate, formatCss, colorsNamed, nearest, differenceCiede2000 } from 'culori';
import { roundObjectValues } from '@/services/utils';

function mixColors(color1: string, color2: string, t: number): string {
  const a = parse(color1);
  const b = parse(color2);

  if (!a || !b) {
    throw new Error('Invalid color input');
  }

  const mixOklch = interpolate([a, b], 'oklch');
  const mix = mixOklch(t);

  // round to 2 decimals
  const rounded = roundObjectValues(mix, 2);

  return formatCss(rounded as any) || '';
}

const lightSteps = [50, 100, 200, 300, 400];
const darkSteps = [600, 700, 800, 900, 950];

// These are perceptually tuned distances from the base color, manually adjusted based on random color tests.
// I could have adjusted just the lightness channel, but on my tests, adjusting all channels produced better results.
// But of course, this is subjective and may not work well for all colors; I might tweaks these more, as needed.
const lightIntensities: Record<number, number> = {
  50: 0.066,
  100: 0.166,
  200: 0.351,
  300: 0.558,
  400: 0.789,
};

const darkIntensities: Record<number, number> = {
  600: 0.871,
  700: 0.749,
  800: 0.657,
  900: 0.486,
  950: 0.352,
};

export function generateColorScale(baseColor: string, overrides?: Record<number, string>) {
  const scale: Record<number, string> = {
    500: overrides?.[500] || mixColors(baseColor, baseColor, 1)
  };

  // Light tints
  for (const step of lightSteps) {
    if (overrides?.[step]) {
      scale[step] = overrides[step];
    } else {
      const intensity = lightIntensities[step];
      scale[step] = mixColors('white', baseColor, intensity);
    }
  }

  // Dark shades
  for (const step of darkSteps) {
    if (overrides?.[step]) {
      scale[step] = overrides[step];
    } else {
      const intensity = darkIntensities[step];
      scale[step] = mixColors('black', baseColor, intensity);
    }
  }

  return scale;
}

export function generateColorName(baseColor: string, existingNames: string[] = []): string {
  const allNames = Object.keys(colorsNamed);
  const nearestNamedColors = nearest(allNames, differenceCiede2000());
  const names = nearestNamedColors(baseColor, 4);

  // Try names[1] first
  let candidate = names[1];
  if (candidate && !existingNames.includes(candidate)) {
    return candidate;
  }

  // Try indexes 0, 2, 3
  for (const idx of [0, 2, 3]) {
    candidate = names[idx];
    if (candidate && !existingNames.includes(candidate)) {
      return candidate;
    }
  }

  // If all exist, use names[1] with a numeric suffix
  candidate = names[1] || 'Unnamed Color';
  let suffix = 2;
  let newName = candidate + suffix;
  while (existingNames.includes(newName)) {
    suffix++;
    newName = candidate + suffix;
  }
  return newName;
}

export function generatePaletteFromColor(baseColor: string): Palette {
  const colors = generateColorScale(baseColor)
  const name = generateColorName(baseColor, []);

  const palette: Palette = {
    name,
    colors
  }

  return palette;
}
