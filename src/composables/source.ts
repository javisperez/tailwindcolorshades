import type { Palette } from "./colors";
import { computed } from "vue";

export default function (palette: Palette) {
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
