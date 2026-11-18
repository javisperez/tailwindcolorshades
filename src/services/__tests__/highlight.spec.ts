import { describe, expect, it } from 'vitest'
import { highlightConfig } from '../highlight'

describe('highlightConfig', () => {
  it('highlights v4 variables and adds a color dot', () => {
    const html = highlightConfig('  --color-indigo-500: #6366f1;')
    expect(html).toContain('<span class="tok-var">--color-indigo-500</span>')
    expect(html).toContain('<span class="tok-val">#6366f1</span>')
    expect(html).toContain('background:#6366f1')
  })

  it('highlights v3 entries', () => {
    const html = highlightConfig("  '500': 'oklch(0.58 0.2 277)'")
    expect(html).toContain('<span class="tok-key">\'500\'</span>')
    expect(html).toContain('<span class="tok-val">oklch(0.58 0.2 277)</span>')
  })

  it('escapes HTML coming from palette names', () => {
    const html = highlightConfig("'<img src=x onerror=alert(1)>': {")
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('never puts untrusted values in the inline style', () => {
    const html = highlightConfig('  --color-x-500: red" onmouseover="alert(1);')
    expect(html).not.toContain('style=')
    expect(html).not.toContain('onmouseover="')
  })

  it('keeps line breaks', () => {
    expect(highlightConfig('a\nb').split('\n')).toHaveLength(2)
  })
})
