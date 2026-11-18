import { describe, expect, it } from 'vitest'
import { contrastLevel, contrastRatio, formatRatio, shadeContrast } from '../contrast'

describe('contrast', () => {
  it('computes the WCAG ratio between black and white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it('accepts OKLCH colors', () => {
    expect(contrastRatio('oklch(0.2 0 0)', 'white')).toBeGreaterThan(10)
  })

  it('returns null for colors it cannot parse', () => {
    expect(contrastRatio('not-a-color', '#fff')).toBeNull()
  })

  it('maps ratios to WCAG levels', () => {
    expect(contrastLevel(7)).toBe('AAA')
    expect(contrastLevel(4.5)).toBe('AA')
    expect(contrastLevel(3)).toBe('AA Large')
    expect(contrastLevel(2.99)).toBe('Fail')
  })

  it('picks the more readable text color for a shade', () => {
    expect(shadeContrast('#f0f9ff').best).toBe('black')
    expect(shadeContrast('#172554').best).toBe('white')
    expect(shadeContrast('#172554').bestLevel).toBe('AAA')
  })

  it('formats ratios', () => {
    expect(formatRatio(4.5)).toBe('4.50:1')
  })
})
