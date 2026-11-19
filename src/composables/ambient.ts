import { converter, formatCss } from 'culori'
import type { Palette } from '@/components/ColorPalette.vue'
import { setFavicon } from './favicon'

const toOklch = converter('oklch')

// Same as the defaults of --accent-a and --accent-b in main.css
const DEFAULT_ACCENTS = ['oklch(0.55 0.2 275)', 'oklch(0.62 0.21 335)'] as const

function shifted(color: string, hueShift: number): string {
  const parsed = toOklch(color)
  if (!parsed) {
    return color
  }

  return formatCss({ ...parsed, h: ((parsed.h ?? 0) + hueShift + 360) % 360 })
}

/**
 * Tints the page chrome (ambient glow, gradient headline, tab icon) with a palette, so the whole UI
 * takes on the color you are working with. Pass `null` to go back to the default look.
 */
export function setAmbient(colors: Palette['colors'] | null) {
  const root = document.documentElement.style

  if (!colors) {
    ;['--glow-a', '--glow-b', '--accent-a', '--accent-b'].forEach((name) => root.removeProperty(name))
    setFavicon(...DEFAULT_ACCENTS)
    return
  }

  root.setProperty('--glow-a', colors[400])
  root.setProperty('--glow-b', shifted(colors[500], 50))
  root.setProperty('--accent-a', colors[600])
  root.setProperty('--accent-b', shifted(colors[500], 50))
  setFavicon(colors[600], shifted(colors[500], 50))
}
