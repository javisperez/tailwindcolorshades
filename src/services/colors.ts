import type { Palette } from '@/components/ColorPalette.vue';
import { parse, interpolate, formatCss, colorsNamed, nearest, differenceCiede2000 } from 'culori';
import { roundObjectValues } from '@/services/utils';

const LIGHT_STEPS = [50, 100, 200, 300, 400] as const;
const DARK_STEPS = [600, 700, 800, 900, 950] as const;
const ALL_STEPS = [...LIGHT_STEPS, 500, ...DARK_STEPS] as const;

// Perceptually tuned intensity values for mixing colors toward white/black
// These values were manually adjusted based on testing with various colors
const LIGHT_INTENSITIES: Record<number, number> = {
  50: 0.066,
  100: 0.166,
  200: 0.351,
  300: 0.558,
  400: 0.789,
};

const DARK_INTENSITIES: Record<number, number> = {
  600: 0.871,
  700: 0.749,
  800: 0.657,
  900: 0.486,
  950: 0.352,
};

/**
 * Mixes two colors using OKLCH interpolation
 * @param color1 - First color (hex or OKLCH format)
 * @param color2 - Second color (hex or OKLCH format)
 * @param t - Interpolation factor (0-1, where 0 = color1, 1 = color2)
 * @returns Mixed color in OKLCH format
 */
function mixColors(color1: string, color2: string, t: number): string {
  const a = parse(color1);
  const b = parse(color2);

  if (!a || !b) {
    throw new Error('Invalid color input');
  }

  const mixOklch = interpolate([a, b], 'oklch');
  const mix = mixOklch(t);
  const rounded = roundObjectValues(mix, 2);

  return formatCss(rounded as any) || '';
}

/**
 * Generates a complete color scale from a base color
 * @param baseColor - The base color (typically used as shade 500)
 * @param overrides - Optional anchor colors for specific shades
 * @param forceOriginalAlgorithm - If true, uses simple white/black mixing even with anchors
 * @returns Object mapping shade numbers to color values
 */
export function generateColorScale(
  baseColor: string,
  overrides?: Record<number, string>,
  forceOriginalAlgorithm: boolean = false
): Record<number, string> {
  // Use anchor-based generation when overrides exist (unless forcing original algorithm)
  if (overrides && Object.keys(overrides).length > 0 && !forceOriginalAlgorithm) {
    return generateColorScaleFromAnchors(overrides, baseColor);
  }

  // Original single-color generation logic
  return generateSimpleColorScale(baseColor, overrides);
}

/**
 * Generates a color scale using simple white/black mixing from a single base color
 */
function generateSimpleColorScale(
  baseColor: string,
  overrides?: Record<number, string>
): Record<number, string> {
  let actualBaseColor = baseColor;
  let baseStep = 500;

  // Determine the base color from overrides if available
  if (overrides) {
    if (overrides[500]) {
      actualBaseColor = overrides[500];
      baseStep = 500;
    } else {
      // Find the step closest to 500 to use as base
      const pinnedSteps = Object.keys(overrides).map(Number).sort((a, b) => a - b);
      if (pinnedSteps.length > 0) {
        baseStep = pinnedSteps.reduce((prev, curr) =>
          Math.abs(curr - 500) < Math.abs(prev - 500) ? curr : prev
        );
        actualBaseColor = overrides[baseStep];
      }
    }
  }

  const scale: Record<number, string> = {
    [baseStep]: actualBaseColor
  };

  // Generate light tints by mixing toward white
  for (const step of LIGHT_STEPS) {
    if (overrides?.[step]) {
      scale[step] = overrides[step];
    } else {
      const intensity = LIGHT_INTENSITIES[step];
      scale[step] = mixColors('white', actualBaseColor, intensity);
    }
  }

  // Generate dark shades by mixing toward black
  for (const step of DARK_STEPS) {
    if (overrides?.[step]) {
      scale[step] = overrides[step];
    } else {
      const intensity = DARK_INTENSITIES[step];
      scale[step] = mixColors('black', actualBaseColor, intensity);
    }
  }

  return scale;
}

/**
 * Generates a color scale by intelligently interpolating between anchor colors
 * - When between two anchors: smoothly interpolates
 * - When only left anchor exists: mixes toward black
 * - When only right anchor exists: mixes toward white
 * @param anchors - Object with color values at specific steps
 * @param baseColor - Fallback base color if 500 is not in anchors
 */
function generateColorScaleFromAnchors(
  anchors: Record<number, string>,
  baseColor: string
): Record<number, string> {
  const scale: Record<number, string> = {};

  // Ensure 500 is always an anchor (the center of the palette)
  if (!anchors[500]) {
    anchors = { ...anchors, 500: baseColor };
  }

  const anchorSteps = Object.keys(anchors).map(Number).sort((a, b) => a - b);

  // Generate color for each step
  for (const step of ALL_STEPS) {
    if (anchors[step]) {
      // Use anchor color directly
      scale[step] = anchors[step];
    } else {
      // Find surrounding anchors
      const leftAnchor = anchorSteps.filter(s => s < step).pop();
      const rightAnchor = anchorSteps.find(s => s > step);

      if (leftAnchor !== undefined && rightAnchor !== undefined) {
        // Interpolate between two anchors
        const range = rightAnchor - leftAnchor;
        const position = step - leftAnchor;
        const t = position / range;
        scale[step] = mixColors(anchors[leftAnchor], anchors[rightAnchor], t);
      } else if (leftAnchor !== undefined) {
        // Only left anchor exists - mix toward black
        const intensity = DARK_INTENSITIES[step];
        scale[step] = mixColors('black', anchors[leftAnchor], intensity);
      } else if (rightAnchor !== undefined) {
        // Only right anchor exists - mix toward white
        const intensity = LIGHT_INTENSITIES[step];
        scale[step] = mixColors('white', anchors[rightAnchor], intensity);
      } else {
        // Fallback (shouldn't happen since we ensure 500 exists)
        scale[step] = baseColor;
      }
    }
  }

  return scale;
}

/**
 * Generates a unique color name based on the nearest named color
 * @param baseColor - The color to name
 * @param existingNames - Array of names already in use
 * @returns A unique color name
 */
export function generateColorName(baseColor: string, existingNames: string[] = []): string {
  const allNames = Object.keys(colorsNamed);
  const nearestNamedColors = nearest(allNames, differenceCiede2000());
  const names = nearestNamedColors(baseColor, 4);

  // Try the second-nearest name first (usually better than the closest)
  let candidate = names[1];
  if (candidate && !existingNames.includes(candidate)) {
    return candidate;
  }

  // Try other nearby names
  for (const idx of [0, 2, 3]) {
    candidate = names[idx];
    if (candidate && !existingNames.includes(candidate)) {
      return candidate;
    }
  }

  // If all names are taken, add a numeric suffix
  candidate = names[1] || 'Unnamed Color';
  let suffix = 2;
  let newName = candidate + suffix;
  while (existingNames.includes(newName)) {
    suffix++;
    newName = candidate + suffix;
  }
  return newName;
}

/**
 * Generates a complete palette from a single color
 * @param baseColor - The base color to generate a palette from
 * @returns A palette object with name and colors
 */
export function generatePaletteFromColor(baseColor: string): Palette {
  const colors = generateColorScale(baseColor);
  const name = generateColorName(baseColor, []);

  return {
    name,
    colors
  };
}
