import { converter, formatCss } from 'culori'
import type { Palette } from '@/components/ColorPalette.vue'

const toOklch = converter('oklch')

function shifted(color: string, hueShift: number): string {
  const parsed = toOklch(color)
  if (!parsed) {
    return color
  }

  return formatCss({ ...parsed, h: ((parsed.h ?? 0) + hueShift + 360) % 360 })
}

/**
 * Tints the page chrome (ambient glow, gradient headline) with a palette, so the whole UI
 * takes on the color you are working with. Pass `null` to go back to the default look.
 */
export function setAmbient(colors: Palette['colors'] | null) {
  const root = document.documentElement.style

  if (!colors) {
    ;['--glow-a', '--glow-b', '--accent-a', '--accent-b'].forEach((name) => root.removeProperty(name))
    return
  }

  root.setProperty('--glow-a', colors[400])
  root.setProperty('--glow-b', shifted(colors[500], 50))
  root.setProperty('--accent-a', colors[600])
  root.setProperty('--accent-b', shifted(colors[500], 50))
}
