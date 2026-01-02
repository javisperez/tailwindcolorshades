import type { Palette } from "@/components/ColorPalette.vue";
import { ref, unref, watchEffect } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { COLOR_STEPS } from "@/constants";
import { parse, formatHex, formatCss, converter } from 'culori';

type ColorFormat = 'oklch' | 'hex';
type ColorSteps = typeof COLOR_STEPS;
type ConfigVersion = 'v4' | 'v3';
type ColorsToInclude = Map<string, ColorSteps[number][]>;

const toOklch = converter('oklch')

// given a color string in either oklch or hex format, return it in the format of the preference
function formatColorValue(color: string, format: ColorFormat): string {
  const parsed = parse(color);
  if (!parsed) {
    return color;
  }

  return format === 'oklch' ? formatCss(toOklch(parsed)) : formatHex(parsed);
}

// Source code for Tailwind CSS v4
function getV4Config(palettes: Palette[], colorFormat: ColorFormat, colorsToIncludePerPalette: ColorsToInclude) {
  const themeVariables = palettes.map((palette) =>
    Object.entries(palette.colors)
      .map(([shade, colorValue]) => {
        const shadeNum = parseInt(shade) as (typeof COLOR_STEPS)[number];
        if (!colorsToIncludePerPalette.get(palette.name)?.includes(shadeNum)) {
          return '';
        }

        return `  --color-${palette.name.toLowerCase()}-${shade}: ${formatColorValue(colorValue, colorFormat)};`
      })
      .filter(line => line !== '')
      .join("\n")
  ).join("\n\n");

  return `@theme {\n${themeVariables}\n}`;
}

// Source code for Tailwind CSS v3
function getV3Config(palettes: Palette[], colorFormat: ColorFormat, colorsToIncludePerPalette: ColorsToInclude) {
  const configValues = palettes.map((palette) => {
    const shades = Object.keys(palette.colors);
    const shadesSource = shades.map(
      (shade: string) => {
        const colorValue = formatColorValue(palette.colors[Number(shade)], colorFormat);
        const shadeNum = parseInt(shade) as (typeof COLOR_STEPS)[number];
        if (!colorsToIncludePerPalette.get(palette.name)?.includes(shadeNum)) {
          return '';
        }
        return `  '${shade}': '${colorValue}'`;
      }
    ).filter(line => line !== '');

    return `'${palette.name.toLowerCase()}': {
${shadesSource.join(",\n")}
}`;
  }).join(",\n");

  return configValues;
}

export default function useTailwindConfig(
  palettes: MaybeRefOrGetter<Palette[]>,
  configVersion: MaybeRefOrGetter<ConfigVersion> = 'v4',
  colorFormat: MaybeRefOrGetter<ColorFormat> = 'oklch',
  colorsToIncludePerPalette: MaybeRefOrGetter<ColorsToInclude> = new Map()
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

    result.value = configPerVersion[unrefVersion](unrefPalettes, unrefFormat, unrefColorsToIncludePerPalette);
  })

  return result;
}
