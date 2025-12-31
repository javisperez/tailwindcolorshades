import { generateColorScale } from './colors'
import type { Palette } from '@/components/ColorPalette.vue'

type ImportResult = {
  palettes: Palette[],
  version?: 'v3' | 'v4',
  error?: string
}

/**
 * Parses Tailwind CSS v4 @theme config with CSS custom properties
 * Example format:
 * @theme {
 *   --color-primary-50: #f0f9ff;
 *   --color-primary-100: #e0f2fe;
 *   --color-brand: #3b82f6;
 * }
 */
function parseV4Config(config: string): ImportResult {
  const palettes: Palette[] = []
  const paletteMap = new Map<string, Record<string, string>>()
  const singleColors = new Map<string, string>()

  try {
    // Remove @theme wrapper and extract content
    const themeMatch = config.match(/@theme\s*\{([^}]+)\}/s)
    if (!themeMatch) {
      return { palettes, error: 'Invalid v4 config format. Expected @theme { ... }' }
    }

    const content = themeMatch[1]

    // First pass: Match colors with shades --color-name-shade: value;
    const shadedPropertyRegex = /--color-([a-zA-Z0-9-_]+)-(\d+)\s*:\s*([^;]+);/g
    let match

    while ((match = shadedPropertyRegex.exec(content)) !== null) {
      const [, paletteName, shade, colorValue] = match

      // Clean up color value (remove quotes, var() references, etc.)
      const cleanColor = colorValue.trim().replace(/['"]/g, '')

      // Skip if it's a var() reference or not a valid color
      if (cleanColor.startsWith('var(')) {
        continue
      }

      if (!paletteMap.has(paletteName)) {
        paletteMap.set(paletteName, {})
      }

      paletteMap.get(paletteName)![shade] = cleanColor
    }

    // Second pass: Match single color values --color-name: value;
    // But exclude those that already have shades
    const singlePropertyRegex = /--color-([a-zA-Z0-9-_.]+)\s*:\s*([^;]+);/g

    while ((match = singlePropertyRegex.exec(content)) !== null) {
      const [, colorName, colorValue] = match

      // Skip if this is actually a shaded color (contains a digit at the end)
      if (/\d+$/.test(colorName)) {
        continue
      }

      // Skip if we already have a palette with this base name
      if (paletteMap.has(colorName)) {
        continue
      }

      // Clean up color value (remove quotes, var() references, etc.)
      const cleanColor = colorValue.trim().replace(/['"]/g, '')

      // Skip if it's a var() reference or not a valid color (starts with #)
      if (cleanColor.startsWith('var(') || !cleanColor.startsWith('#')) {
        continue
      }

      singleColors.set(colorName, cleanColor)
    }

    // Convert shaded palettes map to palettes array
    paletteMap.forEach((colors, name) => {
      // Get the middle color (500) as base to regenerate full scale
      const baseColor = colors['500']
      if (baseColor) {
        // Convert string keys to numbers for overrides
        const overrides: Record<number, string> = {}
        Object.entries(colors).forEach(([shade, color]) => {
          overrides[parseInt(shade)] = color
        })

        const generatedColors = generateColorScale(baseColor, overrides)
        palettes.push({
          name,
          colors: generatedColors
        })
      }
    })

    // Convert single colors to palettes by generating scales from them
    singleColors.forEach((colorValue, name) => {
      const generatedColors = generateColorScale(colorValue)
      palettes.push({
        name,
        colors: generatedColors
      })
    })

    if (palettes.length === 0) {
      return { palettes, error: 'No valid color palettes found in v4 config' }
    }

    return { palettes, version: 'v4' }
  } catch (error) {
    return {
      palettes,
      error: `Failed to parse v4 config: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Parses Tailwind CSS v3 config with JSON or JS object format
 * Example format:
 * {
 *   'primary': {
 *     '50': '#f0f9ff',
 *     '100': '#e0f2fe'
 *   }
 * }
 * or JS object format:
 * {
 *   primary: {
 *     50: '#f0f9ff',
 *     100: '#e0f2fe'
 *   }
 * }
 */
function parseV3Config(config: string): ImportResult {
  const palettes: Palette[] = []

  try {
    // Try to extract just the colors object if it's a full config
    let colorsConfig = config.trim()

    // If it starts with 'colors:', extract just that part
    if (colorsConfig.includes('colors:')) {
      const colorsMatch = colorsConfig.match(/colors\s*:\s*\{([\s\S]*)\}[\s,]*\}/m)
      if (colorsMatch) {
        colorsConfig = `{${colorsMatch[1]}}`
      }
    }

    // Clean up the config to make it valid JSON
    colorsConfig = colorsConfig
      .replace(/'/g, '"')  // Replace single quotes with double quotes
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      // Convert unquoted keys to quoted keys (JS object -> JSON)
      .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      .trim()

    // Check if config starts with an opening brace (it's already wrapped)
    const startsWithBrace = colorsConfig.startsWith('{')

    // Ensure the config has proper closing braces
    // Count opening and closing braces
    const openBraces = (colorsConfig.match(/\{/g) || []).length
    const closeBraces = (colorsConfig.match(/\}/g) || []).length

    // Add missing closing braces
    if (openBraces > closeBraces) {
      colorsConfig += '\n' + '}'.repeat(openBraces - closeBraces)
    }

    // If it doesn't start with a brace, it might be a partial config, wrap it
    if (!startsWithBrace && openBraces === 1) {
      // Single palette without wrapper, keep as is
      colorsConfig = `{"palette":${colorsConfig}}`
    }

    const parsed = JSON.parse(colorsConfig)

    // Iterate through each color palette
    Object.entries(parsed).forEach(([name, shades]) => {
      if (typeof shades === 'object' && shades !== null) {
        const colors = shades as Record<string, string>

        // Get the middle color (500) as base to regenerate full scale
        const baseColor = colors['500']
        if (baseColor) {
          // Convert string keys to numbers for overrides
          const overrides: Record<number, string> = {}
          Object.entries(colors).forEach(([shade, color]) => {
            const shadeNum = parseInt(shade)
            if (!isNaN(shadeNum)) {
              overrides[shadeNum] = color
            }
          })

          const generatedColors = generateColorScale(baseColor, overrides)
          palettes.push({
            name,
            colors: generatedColors
          })
        }
      }
    })

    if (palettes.length === 0) {
      return { palettes, error: 'No valid color palettes found in v3 config' }
    }

    return { palettes, version: 'v3' }
  } catch (error) {
    return {
      palettes,
      error: `Failed to parse v3 config: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Detects config format and parses accordingly
 */
export function parseConfig(config: string): ImportResult {
  const trimmed = config.trim()

  // Detect v4 format by @theme directive
  if (trimmed.includes('@theme')) {
    return parseV4Config(trimmed)
  }

  // Try v3 JSON format
  return parseV3Config(trimmed)
}
