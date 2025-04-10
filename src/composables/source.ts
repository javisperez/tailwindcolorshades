import type { Palette } from "./colors";
import { computed } from "vue";

export default function useTailwindTheme(palette: Palette, isV4: boolean = true) {
  // Source code for Tailwind CSS v4
  const getV4Source = () => {
    const themeVariables = computed(() =>
      Object.entries(palette.colors)
        .map(([shade, colorValue]) => `  --color-${palette.name.toLowerCase()}-${shade}: ${colorValue};`)
        .join("\n")
    );

    return `@theme {\n${themeVariables.value}\n}`;
  }

  // Source code for Tailwind CSS v3
  const getV3Source = () => {
    const shades = computed(() => Object.keys(palette.colors));

    const shadesSource = computed(() =>
      shades.value.map(
        (shade: string) => `    '${shade}': '${palette.colors[Number(shade)]}'`
      )
    );

    return `'${palette.name.toLowerCase()}': {
${shadesSource.value.join(", \n")}
}`;
  }

  return isV4 ? getV4Source() : getV3Source();
}
