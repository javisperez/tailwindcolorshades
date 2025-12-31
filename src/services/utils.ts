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
      params.set(palette.name, palette.colors[500])
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
