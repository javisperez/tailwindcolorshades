import type { Palette } from "@/components/ColorPalette.vue";
import { ref, unref, watchEffect } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { COLOR_STEPS } from "@/constants";
import { formatColorValue, type ColorFormat } from "@/services/format";

type ColorSteps = typeof COLOR_STEPS;
type ConfigVersion = 'v4' | 'v3';
type ColorsToInclude = Map<string, ColorSteps[number][]>;

// Palettes that were never customized (no entry in the map) include every shade.
function isIncluded(palette: Palette, shade: number, colorsToIncludePerPalette: ColorsToInclude) {
  const included = colorsToIncludePerPalette.get(palette.name);
  return included ? included.includes(shade as ColorSteps[number]) : true;
}

// Source code for Tailwind CSS v4
function getV4Config(palettes: Palette[], colorFormat: ColorFormat, colorsToIncludePerPalette: ColorsToInclude, includeWrapper: boolean) {
  const themeVariables = palettes.map((palette) =>
    Object.entries(palette.colors)
      .map(([shade, colorValue]) => {
        if (!isIncluded(palette, parseInt(shade), colorsToIncludePerPalette)) {
          return '';
        }

        return `  --color-${palette.name.toLowerCase()}-${shade}: ${formatColorValue(colorValue, colorFormat)};`
      })
      .filter(line => line !== '')
      .join("\n")
  ).join("\n\n");

  return includeWrapper ? `@theme {\n${themeVariables}\n}` : themeVariables;
}

// Source code for Tailwind CSS v3
function getV3Config(palettes: Palette[], colorFormat: ColorFormat, colorsToIncludePerPalette: ColorsToInclude, includeWrapper: boolean) {
  const configValues = palettes.map((palette) => {
    const shades = Object.keys(palette.colors);
    const shadesSource = shades.map(
      (shade: string) => {
        if (!isIncluded(palette, parseInt(shade), colorsToIncludePerPalette)) {
          return '';
        }
        const colorValue = formatColorValue(palette.colors[Number(shade)], colorFormat);
        return `  '${shade}': '${colorValue}'`;
      }
    ).filter(line => line !== '');

    return `'${palette.name.toLowerCase()}': {
${shadesSource.join(",\n")}
}`;
  }).join(",\n");

  return includeWrapper ? `colors: {\n${configValues}\n}` : configValues;
}

export default function useTailwindConfig(
  palettes: MaybeRefOrGetter<Palette[]>,
  configVersion: MaybeRefOrGetter<ConfigVersion> = 'v4',
  colorFormat: MaybeRefOrGetter<ColorFormat> = 'oklch',
  colorsToIncludePerPalette: MaybeRefOrGetter<ColorsToInclude> = new Map(),
  includeWrapper: MaybeRefOrGetter<boolean> = false
) {
  const result = ref<string>("");

  const configPerVersion = {
    'v4': getV4Config,
    'v3': getV3Config
  }

  watchEffect(() => {
    const unrefPalettes = unref(palettes) as Palette[]
    const unrefFormat = unref(colorFormat) as ColorFormat
    const unrefVersion = unref(configVersion) as ConfigVersion
    const unrefColorsToIncludePerPalette = unref(colorsToIncludePerPalette) as ColorsToInclude

    result.value = configPerVersion[unrefVersion](unrefPalettes, unrefFormat, unrefColorsToIncludePerPalette, !!unref(includeWrapper));
  })

  return result;
}
