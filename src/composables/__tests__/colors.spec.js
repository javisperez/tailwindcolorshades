import { describe, expect, it, vi } from 'vitest'
import getColorPalette, { getColorName, getTextColor } from '../colors';

vi.mock('color-namer', () => ({
  default: vi.fn().mockReturnValue({
    ntc: [
      { name: 'red', },
    ],
  }),
}));

describe('getColorPalette', () => {
  it('returns undefined when baseColor is not provided', () => {
    expect(getColorPalette()).toBeUndefined();
  });

  it('returns a palette object with the correct name and colors', () => {
    const baseColor = 'FF0000';
    const palette = getColorPalette(baseColor);

    expect(palette).toEqual({
      name: 'red',
      colors: {
        500: '#FF0000',
        50: expect.any(String),
        100: expect.any(String),
        200: expect.any(String),
        300: expect.any(String),
        400: expect.any(String),
        600: expect.any(String),
        700: expect.any(String),
        800: expect.any(String),
        900: expect.any(String),
        950: expect.any(String),
      },
    });
  });

  // Add more tests as needed for different cases or edge cases
});

describe('getTextColor', () => {
  it('returns "#FFF" for a dark color', () => {
    const darkColor = '#000000';
    expect(getTextColor(darkColor)).toBe('#FFF');
  });

  it('returns "#333" for a light color', () => {
    const lightColor = '#FFFFFF';
    expect(getTextColor(lightColor)).toBe('#333');
  });

  // Add more tests as needed for different cases or edge cases
});

describe('getColorName', () => {
  it('returns the correct color name', () => {
    const color = 'FF0000';
    const colorName = getColorName(color);
    expect(colorName).toBe('red');
  });
});
