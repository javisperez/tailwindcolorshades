import { converter, formatCss, formatHex, parse, type Oklch } from 'culori'
import { roundObjectValues } from '@/services/utils'

export type ColorFormat = 'oklch' | 'hex'

const toOklch = converter('oklch')

/**
 * Converts any parsable color string to the requested output format.
 * OKLCH values are rounded to 3 decimals (the precision Tailwind's own palette uses),
 * so a typed hex color does not export as `oklch(0.6958730755134862 …)`.
 */
export function formatColorValue(color: string, format: ColorFormat): string {
  const parsed = parse(color)
  if (!parsed) {
    return color
  }

  if (format === 'hex') {
    return formatHex(parsed)
  }

  return formatCss(roundObjectValues(toOklch(parsed), 3) as Oklch)
}

/** Compact label for UI chips: `#6366f1` or `0.58 0.20 277`. */
export function shortColorLabel(color: string, format: ColorFormat): string {
  const parsed = parse(color)
  if (!parsed) {
    return color
  }

  if (format === 'hex') {
    return formatHex(parsed)
  }

  const { l, c, h } = toOklch(parsed)
  return `${l.toFixed(2)} ${c.toFixed(2)} ${Math.round(h ?? 0)}`
}

/** Hue (0–360) of a color, 0 for achromatic colors. */
export function hueOf(color: string): number {
  const parsed = parse(color)
  return parsed ? (toOklch(parsed).h ?? 0) : 0
}
