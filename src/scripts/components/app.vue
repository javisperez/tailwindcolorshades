<script>
import { mapGetters } from "vuex";
import newColor from "./new-color.vue";
import palette from "./palette.vue";
import paletteCode from "./palette-code.vue";
import { sanitizeColorName } from '../support/utils'

export default {
  name: "app",

  components: {
    palette,
    paletteCode,
    newColor
  },

  data() {
    return {
      duplicatedColor: null,
      inClipboard: null
    };
  },

  mounted() {
    if (this.$route.query) {
      this.$gaTrack("colors", "from-url", window.location.search.substring(1));
      this.setColors();
    }
  },

  methods: {
    setColors() {
      const query = this.$route.query;
      this.$store.commit("RESET_COLORS");

      for (const name in query) {
        const color = `#${query[name]}`;
        const sanitizedName = sanitizeColorName(name)
        if (color.match(/^#([A-f0-9]{6}|[A-f0-9]{3})$/)) {
          this.$store.commit("ADD_COLOR", { name: sanitizedName, color });
        }
      }
    },

    removeColor(index) {
      this.$gaTrack(
        "colors",
        "removed",
        `${this.colors[index].name}:${this.colors[index].color}`
      );
      this.$store.commit("REMOVE_COLOR", { index });
    },

    setColorOutput(index, output) {
      this.$store.commit("SET_COLOR_OUTPUT", { index, output });
    },

    notifyDuplicatedColor(color) {
      if (this.duplicatedColor) {
        return;
      }

      this.duplicatedColor = color;

      this.$gaTrack("errors", "color:duplicated", `${color.name}:${color.color}`);

      setTimeout(() => {
        this.duplicatedColor = null;
      }, 1400);
    },

    isDuplicated(palette) {
      if (!this.duplicatedColor) {
        return false;
      }

      return (
        palette.color.toLowerCase() ===
          this.duplicatedColor.color.toLowerCase() ||
        palette.name.toLowerCase() === this.duplicatedColor.name.toLowerCase()
      );
    },

    copyAllCodes() {
      const text = document.querySelector(".palettes-codes"),
        range = document.createRange();

      if (!text) {
        return;
      }

      range.selectNode(text);
      const sel = window.getSelection();

      sel.removeAllRanges();
      sel.addRange(range);

      document.execCommand("copy");

      sel.removeAllRanges();

      this.inClipboard = "all";

      this.$gaTrack("code", "copied:all", "Copied all code");

      setTimeout(() => {
        this.inClipboard = null;
      }, 5000);
    },

    setTailwindVersion(version = 1) {
      const query = { ...this.$route.query, tv: version };

      this.$router.push({ path: "/", query });
    }
  },

  computed: {
    ...mapGetters(["colors"]),

    tailwindVersion() {
      const query = this.$route.query;
      if (query.hasOwnProperty("tv")) {
        return Number(query.tv);
      }

      // Version 1 by default
      return 1;
    }
  }
};
</script>

<template>
  <div class="app">
    <!-- Header? -->
    <div class="bg-white text-center pt-8 pb-4">
      <div class="logo">
        <img src="images/logo.png" width="80" alt="Color shades for Tailwind CSS">
      </div>
      <h1 class="font-normal pt-0 pb-4 text-3xl">
        Color Shades Generator
        <div class="font-light" style="font-size: 75%;">for Tailwind CSS</div>
      </h1>

      <div class="relative mx-auto" style="max-width: 700px">
        <new-color class="pt-6 pb-4" @color:duplicated="notifyDuplicatedColor"></new-color>
        <div class="text-xs flex justify-between items-center" style="transition: opacity 0.4s;">
          <span>
            Tailwind Version:
            <span
              class="text-link"
              :class="{
                    'font-bold rounded-full px-2 py-1 bg-blue text-white hover:text-white hover:bg-blue-dark': tailwindVersion === 1,
                    'text-grey': tailwindVersion !== 1
                }"
              @click="setTailwindVersion(1)"
            >1.x</span> /
            <span
              class="text-link"
              :class="{
                    'font-bold rounded-full px-2 py-1 bg-blue text-white hover:text-white hover:bg-blue-dark': tailwindVersion === 0,
                    'text-grey': tailwindVersion !== 0
                }"
              @click="setTailwindVersion(0)"
            >0.x</span>
          </span>

          <span
            v-show="inClipboard !== 'all'"
            :class="{
                'pointer-events-none opacity-0': !colors.length,
                'text-link': colors.length
            }"
            @click="copyAllCodes()"
          >
            <i class="far fa-copy"></i> Copy all generated codes
          </span>
          <span
            v-show="inClipboard === 'all'"
            :class="{'pointer-events-none': !colors.length}"
            @click="copyAllCodes()"
          >
            <i class="far fa-check-circle"></i> Copied
          </span>
        </div>
      </div>
    </div>

    <!-- Palettes codes used for the `copy all` button -->
    <div class="palettes-codes opacity-0 absolute" style="z-index: -1">
      <ul class="italic text-grey" v-for="palette in colors" :key="palette.name">
        <li v-if="tailwindVersion === 1">'{{ palette.name }}': {</li>
        <li
          v-for="output in palette.output"
          :key="`${output.name}`"
        >{{ output.label }}: '{{ output.background.toUpperCase() }}',</li>
        <li v-if="tailwindVersion === 1">},</li>
      </ul>
    </div>

    <!-- Palettes -->
    <div name="scale-list" tag="div" class="palettes flex flex-wrap justify-around">
      <div
        class="bg-white p-2 my-4 rounded scale-list-item"
        v-for="(palette, $index) in colors"
        :key="palette.name"
      >
        <palette
          :color="palette.color"
          :name="palette.name"
          :key="$index"
          :version="tailwindVersion"
          @remove="removeColor($index)"
          @generate="setColorOutput($index, $event)"
          @color:duplicated="notifyDuplicatedColor"
          :class="{'duplicated': isDuplicated(palette)}"
        ></palette>

        <palette-code
          :palette="palette"
          :version="tailwindVersion"
          @copy="inClipboard = code.color"
        ></palette-code>
      </div>
    </div>

    <!-- Some about text -->
    <div class="container mx-auto mt-8 mb-8 text-center" v-show="!colors.length">
      <h3>What is this?</h3>

      <p>
        Is a tool to make shades and tints for a given color and generate the proper code
        for the TailwindCSS config file.
      </p>

      <p>
        The idea is to make the custom color generation a bit easier when creating custom color variants
        to use in your app's CSS.
      </p>
    </div>

    <!-- Footer? -->
    <footer class="text-center mb-8 text-xs text-grey-dark" style="margin-top: 6rem;">
      <p>
        Color shades/tints generator for
        <a
          class="text-grey-dark hover:text-grey-darkest"
          href="https://tailwindcss.com"
          target="_blank"
        >TailwindCSS</a>
        by
        <a
          class="text-grey-dark hover:text-grey-darkest"
          href="https://www.github.com/javisperez"
        >Javis Pérez</a>
      </p>
      <p class="mt-2">
        <a
          href="https://www.github.com/javisperez/tailwindcolorshades"
          class="text-grey-dark hover:text-grey-darkest"
        >
          <i class="fab fa-github fa-2x hover:text-grey-darkest"></i>
        </a>
      </p>
    </footer>
  </div>
</template>
