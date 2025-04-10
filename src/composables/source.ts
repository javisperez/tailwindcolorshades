import type { Palette } from "./colors";
import { computed } from "vue";

export default function useTailwindTheme(palette: Palette) {
  const themeVariables = computed(() =>
    Object.entries(palette.colors)
      .map(([shade, colorValue]) => `  --color-${palette.name.toLowerCase()}-${shade}: ${colorValue};`)
      .join("\n")
  );

  return `@theme {\n${themeVariables.value}\n}`;
}
