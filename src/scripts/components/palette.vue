<script>
import { sanitizeColorName } from '../support/utils'

export default {
  name: "palette",

  props: {
    name: String,
    color: String,
    version: {
      type: Number,
      default: 1
    }
  },

  created() {
    this.colorName = sanitizeColorName(this.name);
  },

  filters: {
    unquoted(text) {
      return text.replace(/'(.*?)'/g, "$1");
    }
  },

  data() {
    return {
      newName: "",

      colorName: "",

      isRenaming: false,

      tintsPerVersion: {
        1: {
          50: 0.95,
          100: 0.9,
          200: 0.75,
          300: 0.6,
          400: 0.3
        },
        0: {
          lightest: 0.9,
          lighter: 0.6,
          light: 0.3
        }
      },

      shadesPerVersion: {
        1: {
          600: 0.9,
          700: 0.6,
          800: 0.45,
          900: 0.3
        },
        0: {
          dark: 0.9,
          darker: 0.6,
          darkest: 0.3
        }
      },

      colors: []
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.generate();
    });
  },

  methods: {
    remove() {
      this.$emit("remove");
    },

    hexPart: c => `0${c.toString(16)}`.slice(-2),

    hexToRgb(hex) {
      const color = `#${hex}`,
        components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);

      if (!components) {
        return null;
      }

      return {
        r: parseInt(components[1], 16),
        g: parseInt(components[2], 16),
        b: parseInt(components[3], 16)
      };
    },

    rgbToHex(r, g, b) {
      return `#${this.hexPart(r)}${this.hexPart(g)}${this.hexPart(b)}`;
    },

    tint(hex, intensity) {
      const color = this.hexToRgb(hex),
        r = Math.round(color.r + (255 - color.r) * intensity),
        g = Math.round(color.g + (255 - color.g) * intensity),
        b = Math.round(color.b + (255 - color.b) * intensity);

      return this.rgbToHex(r, g, b);
    },

    shade(hex, intensity) {
      const color = this.hexToRgb(hex),
        r = Math.round(color.r * intensity),
        g = Math.round(color.g * intensity),
        b = Math.round(color.b * intensity);

      return this.rgbToHex(r, g, b);
    },

    getTextColor(color) {
      const { r, g, b } = this.hexToRgb(color.replace(/#/gi, "")),
        luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      return luma < 120 ? "#FFFFFF" : "#333333";
    },

    generate() {
      // Reset the colors
      this.colors = [];

      const isVersion1 = this.version === 1;
      const name = sanitizeColorName(this.colorName);
      const label = isVersion1 ? "500" : `'${name}'`;

      // Tints
      for (const key in this.tints) {
        const tint = this.tints[key],
          tinted = this.tint(this.color, tint),
          label = isVersion1 ? key : `'${name}-${key}'`;

        this.colors.push({
          name: `${name}-${key}`,
          label,
          background: tinted,
          text: this.getTextColor(tinted)
        });
      }

      // Base
      this.colors.push({
        name,
        label,
        background: `#${this.color}`,
        text: this.getTextColor(this.color)
      });

      // Shades
      for (const key in this.shades) {
        const shade = this.shades[key],
          shaded = this.shade(this.color, shade),
          label = isVersion1 ? key : `'${name}-${key}'`;

        this.colors.push({
          name: `${name}-${key}`,
          label,
          background: shaded,
          text: this.getTextColor(shaded)
        });
      }

      this.$gaTrack("colors", "generated", `${this.name}:${this.color}`);

      // Notify our parent that we're done
      this.$emit("generate", this.colors);
    },

    rename() {
      if (this.newName === this.colorName) {
        this.isRenaming = false;
        return;
      }

      const sanitizedNewName = sanitizeColorName(this.newName)

      const isColorAlreadyAdded =
        this.allColors.findIndex(
          c => c.name.toLowerCase() === sanitizedNewName.toLowerCase()
        ) > -1;

      if (isColorAlreadyAdded) {
        this.$emit("color:duplicated", {
          name: sanitizedNewName,
          color: this.color
        });
        return;
      }

      this.$store.commit("RENAME_COLOR", {
        currentName: this.colorName,
        newName: sanitizedNewName
      });
      this.$gaTrack("colors", "renamed", `${this.colorName} to ${sanitizedNewName}`);
      this.colorName = sanitizedNewName;
      this.generate();
      this.isRenaming = false;
    }
  },

  watch: {
    isRenaming(value) {
      if (!value) return;

      this.newName = sanitizeColorName(this.colorName);

      this.$nextTick(_ => {
        this.$refs.newName.focus();
      });
    }
  },

  computed: {
    allColors() {
      return this.$store.getters.colors;
    },

    text() {
      return this.getTextColor(this.color);
    },

    tints() {
      return this.tintsPerVersion[this.version];
    },

    shades() {
      return this.shadesPerVersion[this.version];
    }
  }
};
</script>

<template>
  <div class="palette">
    <span class="close float-right m-4 cursor-pointer" @click="remove()">
      <i class="far fa-trash-alt text-white"></i>
    </span>
    <ul>
      <li
        :style="{
            backgroundColor: '#'+color,
            color: text
        }"
      >
        <div
          v-if="!isRenaming"
          class="cursor-pointer hover:opacity-75"
          @click="isRenaming = true"
        >{{ colorName }}</div>
        <div v-else>
          <input
            class="input xs"
            autofocus
            ref="newName"
            type="text"
            @keyup.enter="rename()"
            @keyup.esc="isRenaming = false"
            v-model="newName"
          >
        </div>
        <div class="color-code">#{{ color }}</div>
      </li>
      <!-- Tints and shades -->
      <li
        v-for="(color, $index) in colors"
        :style="{
                    backgroundColor: color.background,
                    color: color.text
                }"
        :key="$index"
      >
        <span>{{ color.label | unquoted }}</span>
        <span class="color-code float-right">{{ color.background.toUpperCase() }}</span>
      </li>
    </ul>
  </div>
</template>
