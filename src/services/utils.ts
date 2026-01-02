import type { Palette } from '@/components/ColorPalette.vue';

export function generatePalettesQueryString(palettes: (Palette | Record<string, string>)[]): string {
  // filter empty values from the palettes array
  palettes = palettes.filter((palette) => Boolean(palette))

  if (palettes.length === 0) {
    return '';
  }

  const params = new URLSearchParams()

  palettes.forEach(palette => {
    if ('name' in palette && 'colors' in palette && palette?.name && palette?.colors) {
      // If palette has anchors, check if we need to encode them
      if (palette.anchors && Object.keys(palette.anchors).length > 0) {
        const anchorSteps = Object.keys(palette.anchors).map(Number);

        // Use anchor format if:
        // 1. Multiple anchors, OR
        // 2. Single anchor that's not at step 500
        if (anchorSteps.length > 1 || (anchorSteps.length === 1 && anchorSteps[0] !== 500)) {
          // Format: name=step1:color1,step2:color2,step3:color3
          const anchorPairs = Object.entries(palette.anchors)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([step, color]) => `${step}:${color}`)
          params.set(palette.name, anchorPairs.join(','))
        } else {
          // Single anchor at 500 - use simple format
          params.set(palette.name, palette.colors[500])
        }
      } else {
        // No anchors - use simple format
        params.set(palette.name, palette.colors[500])
      }
    } else {
      Object.entries(palette).forEach(([key, value]) => {
        params.set(key, String(value))
      })
    }
  })

  return params.toString()
}

// Round a given object’s numeric values to a specified number of decimal places
export function roundObjectValues(obj: Record<string, any>, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === 'number' ? Math.round(v * factor) / factor : v,
    ])
  );
}
