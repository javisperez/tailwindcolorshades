import { formatHex } from 'culori'

// Same bars as the logo in the header: [x, y, width, color, opacity]
const BARS = [
  [14, 0, 50, 'b', 0.35],
  [9, 17, 50, 'b', 0.65],
  [5, 34, 50, 'a', 1],
  [0, 51, 50, 'a', 0.6]
] as const

const SIZE = 64
const BAR_HEIGHT = 12

function draw(a: string, b: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')
  if (!context) {
    return ''
  }

  const colors = { a: formatHex(a) ?? a, b: formatHex(b) ?? b }
  const radius = BAR_HEIGHT / 2

  BARS.forEach(([x, y, width, color, opacity]) => {
    context.globalAlpha = opacity
    context.fillStyle = colors[color]
    context.beginPath()
    context.moveTo(x + radius, y)
    context.arcTo(x + width, y, x + width, y + BAR_HEIGHT, radius)
    context.arcTo(x + width, y + BAR_HEIGHT, x, y + BAR_HEIGHT, radius)
    context.arcTo(x, y + BAR_HEIGHT, x, y, radius)
    context.arcTo(x, y, x + width, y, radius)
    context.fill()
  })

  return canvas.toDataURL('image/png')
}

/**
 * Paints the tab icon with the same bars and colors as the logo.
 * A PNG is used because not every browser accepts an SVG favicon.
 */
export function setFavicon(a: string, b: string) {
  const href = draw(a, b)
  if (!href) {
    return
  }

  // One icon replaces the static ones, so browsers cannot pick an outdated file
  document.head.querySelectorAll('link[rel="icon"]').forEach((link) => link.remove())

  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  link.href = href
  document.head.appendChild(link)
}
