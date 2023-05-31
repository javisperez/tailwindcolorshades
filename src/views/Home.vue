<script lang="ts">
import { defineComponent } from "vue";
import trackAnalytics from "../composables/analytics";
import useColors from "../composables/colors";
import type { Palette } from "../composables/colors"
import ColorsPalette from "../components/Palette.vue";
import InputColor from "../components/InputColor.vue";
import EmptyHome from "../components/EmptyHome.vue";

export default defineComponent({
  components: {
    ColorsPalette,
    InputColor,
    EmptyHome
  },

  data() {
    return {
      shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
      palettes: [] as Palette[],
      error: "",
      wiggle: false,
      isSourceCopied: false,
      configCode: ""
    };
  },

  mounted() {
    const query = this.$route.query || {};

    // Set the palettes values from the query-string
    this.palettes = Object.keys(query).map(name => {
      const color = query[name] as string;
      const palette = useColors(color);

      return {
        name,
        colors: palette.colors
      };
    });

    // Send the stats to google analytics
    trackAnalytics("colors", "from-url", window.location.search.substring(1));
  },

  methods: {
    isColorDuplicated(color: string) {
      return this.palettes.some(
        palette => palette.colors[500].toLowerCase() === color.toLowerCase()
      );
    },

    onGenerate(palette: Palette) {
      if (this.isColorDuplicated(palette.colors[500])) {
        this.error = "You already have this color";
        return;
      }

      this.palettes.unshift(palette);

      const query: { [key: string]: string } = {};
      this.palettes.forEach(palette => {
        query[palette.name] = palette.colors[500].replace("#", "");
      });

      this.$router.push({
        path: "/",
        query
      });

      this.wiggle = true;

      setTimeout(() => {
        this.wiggle = false;
      }, 2500);
    },

    removePalette(baseColor: string) {
      const index = this.palettes.findIndex(p => p.colors[500] === baseColor);

      // If the given color doesnt exist, dont do anything
      if (index === -1) {
        return;
      }

      // Track the action into google analytics before removing it, so we get the name and value
      trackAnalytics(
        "colors",
        "removed",
        `${this.palettes[index].name}:${baseColor}`
      );

      // Remove it from the list
      this.palettes.splice(index, 1);

      // Prepare the query string update
      const query: { [key: string]: string } = {};

      this.palettes.forEach(palette => {
        query[palette.name] = palette.colors[500].replace("#", "");
      });

      // And go to the updated query
      this.$router.push({
        path: "/",
        query
      });
    },

    copySource() {
      // Read the source code for each palette to respect the values that are hidden,
      // instead of generating it again from the source.
      this.getConfigCode();

      // And once that gets rendered, lets copy it.
      this.$nextTick(() => {
        const text = document.querySelector("#config-source-code");
        const range = document.createRange();
        if (!text) {
          return;
        }
        range.selectNode(text);
        const sel = window.getSelection();
        if (!sel) {
          return;
        }
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
        // Toggle the "copied" feedback to true
        this.isSourceCopied = true;

        // After 4 seconds lets reset the state so the user can copy again
        setTimeout(() => {
          this.isSourceCopied = false;
        }, 4000);
      });
    },

    /**
     * Get all the source from all the palettes
     */
    getConfigCode() {
      this.configCode = this.palettes
        .map((palette: Palette) => {
          const paletteSource = document.querySelector(
            `pre.hex${palette.colors[500].replace("#", "")}`
          );

          if (paletteSource) {
            return paletteSource.textContent;
          }

          return "";
        })
        .join(",");
    }
  }
});
</script>

<template>
  <header class="fixed top-0 left-0 right-0 bg-white z-20">
    <div
      class="max-w-7xl mx-auto lg:divide-y lg:divide-gray-200 md:px-2 lg:px-8 border-b border-gray-200 py-6 flex items-center justify-between"
    >
      <div class="relative flex justify-between w-full flex-col md:flex-row">
        <!-- Branding / Logo -->
        <div class="flex-shrink-0 flex items-center mb-4 md:mb-0 px-2 md:px-0">
          <img
            class="block h-8 w-auto"
            src="../assets/images/logo.png"
            alt="Logo"
          />
          <div class="text-lg font-medium leading-5 ml-2">
            SHADES GENERATOR
            <div class="text-sm font-light leading-3 text-gray-600">
              for Tailwind CSS
            </div>
          </div>
        </div>

        <div
          class="relative z-0 flex-1 flex items-center justify-center sm:absolute sm:inset-0 mb-4 md:mb-0 px-2"
        >
          <!-- Color Input -->
          <InputColor @generate="onGenerate" />
        </div>

        <div class="relative lg:z-10 lg:ml-4 flex items-center md:px-0 px-2">
          <!-- Copy all source -->
          <transition
            enter-active-class="animate-wiggle"
            leave-active-class="transition duration-300"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-50 opacity-0"
          >
            <button
              type="button"
              class="inline-flex items-center md:px-3 md:py-2 p-3 border border-transparent text-sm leading-4 font-medium rounded-md
              text-primary-700 bg-primary-200 hover:bg-primary-300 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-primary-500 mr-2 focus:bg-primary-600 focus:text-primary-100
              w-full text-center md:w-auto md:text-left"
              :class="wiggle && 'animate-wiggle'"
              v-show="palettes.length > 0"
              @click="copySource"
            >
              {{ !isSourceCopied ? "Copy Config Code" : "Copied!" }}
            </button>
          </transition>
          <!-- Github Icon -->
          <a
            href="https://github.com/javisperez/tailwindcolorshades"
            class="cursor-pointer text-gray-700 hover:text-black hidden md:inline-block"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="toe-icon ti ti-github h-8 w-8"
              viewBox="0 0 64 64"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="0"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M32.029 8.345C18.759 8.345 8 19.104 8 32.378c0 10.617 6.885 19.624 16.435 22.803 1.202.22 1.64-.522 1.64-1.16 0-.569-.02-2.081-.032-4.086-6.685 1.452-8.095-3.222-8.095-3.222-1.093-2.775-2.669-3.514-2.669-3.514-2.182-1.492.165-1.462.165-1.462 2.412.171 3.681 2.477 3.681 2.477 2.144 3.672 5.625 2.611 6.994 1.997.219-1.553.838-2.612 1.526-3.213-5.336-.606-10.947-2.669-10.947-11.877 0-2.623.937-4.769 2.474-6.449-.247-.608-1.072-3.051.235-6.36 0 0 2.018-.646 6.609 2.464 1.917-.533 3.973-.8 6.016-.809 2.041.009 4.097.276 6.017.809 4.588-3.11 6.602-2.464 6.602-2.464 1.311 3.309.486 5.752.239 6.36 1.54 1.68 2.471 3.826 2.471 6.449 0 9.232-5.62 11.263-10.974 11.858.864.742 1.632 2.208 1.632 4.451 0 3.212-.029 5.804-.029 6.591 0 .644.432 1.392 1.652 1.157 9.542-3.185 16.421-12.186 16.421-22.8 0-13.274-10.76-24.033-24.034-24.033"
                fill="currentColor"
              ></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </header>

  <main class="md:mt-32 mt-52 relative">
    <EmptyHome v-if="!palettes.length" />

    <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8" v-else>
      <!-- Shades top row -->
      <transition
        enter-active-class="transition-opacity"
        leave-active-class="transition-opacity"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          class="flex sticky top-20 bg-white z-10 py-1"
          v-show="palettes.length"
        >
          <div class="max-w-64 w-full capitalize text-center"></div>
          <div
            v-for="shade in shades"
            :key="shade"
            class="max-w-24 w-full text-center text-xs"
          >
            {{ shade }}
          </div>
          <div class="max-w-24 w-full capitalize text-center"></div>
        </div>
      </transition>

      <!-- Palettes -->
      <div class="mt-4">
        <transition-group
          enter-active-class="transition"
          leave-active-class="transition"
          enter-from-class="transform -translate-y-5 scale-95 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-from-class="transform translate-y-0 absolute opacity-100"
          leave-to-class="transform -translate-y-5 scale-95 opacity-0"
          move-class="transition"
        >
          <ColorsPalette
            :name="palette.name"
            :colors="palette.colors"
            v-for="palette in palettes"
            :key="palette.name"
            @remove="removePalette"
          />
        </transition-group>
      </div>
    </div>
  </main>

  <!-- All source -->
  <pre
    id="config-source-code"
    class="fixed text-xs opacity-0 pointer-events-none top-0 overflow-hidden"
    >{{ configCode }}</pre
  >
</template>
