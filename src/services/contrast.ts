import { clampRgb, parse, wcagContrast } from 'culori'

export type ContrastLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail'

export type ShadeContrast = {
  /** Contrast ratio of white text on the color */
  white: number
  /** Contrast ratio of black text on the color */
  black: number
  /** Whichever of white / black reads better on the color */
  best: 'white' | 'black'
  bestRatio: number
  bestLevel: ContrastLevel
  whiteLevel: ContrastLevel
  blackLevel: ContrastLevel
}

/** WCAG 2.x contrast ratio between two CSS colors, or null when either is unparsable. */
export function contrastRatio(a: string, b: string): number | null {
  const colorA = parse(a)
  const colorB = parse(b)
  if (!colorA || !colorB) {
    return null
  }

  // Out-of-gamut OKLCH colors must be clamped, otherwise the luminance is skewed.
  return wcagContrast(clampRgb(colorA), clampRgb(colorB))
}

/** WCAG level reached by a ratio, for normal-size text (large text is reported separately). */
export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

export function shadeContrast(color: string): ShadeContrast {
  const white = contrastRatio(color, '#ffffff') ?? 1
  const black = contrastRatio(color, '#000000') ?? 1
  const best = white >= black ? 'white' : 'black'
  const bestRatio = Math.max(white, black)

  return {
    white,
    black,
    best,
    bestRatio,
    bestLevel: contrastLevel(bestRatio),
    whiteLevel: contrastLevel(white),
    blackLevel: contrastLevel(black)
  }
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`
}
