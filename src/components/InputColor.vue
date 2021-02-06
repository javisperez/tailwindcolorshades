<script lang="ts">
import useColors, { Palette } from "@/composables/colors";
import { defineComponent } from "vue";

let throttle = 0;

export default defineComponent({
  name: "InputColor",

  data() {
    return {
      color: "",
      isMac: /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    };
  },

  computed: {
    newColorInHex() {
      if (!this.color || ![4, 7].includes(this.color.length)) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const color = this.color;

      if (this.color.length === 4) {
        const [, r, g, b] = color.split("");
        return `#${r}${r}${g}${g}${b}${b}`;
      }

      return color;
    }
  },

  mounted() {
    document.addEventListener("keydown", e => {
      const isCmd = this.isMac ? e.metaKey : e.ctrlKey;

      if (isCmd && e.key === "k") {
        e.preventDefault();
        (this.$refs.inputColor as HTMLInputElement).focus();
      }
    });
  },

  methods: {
    generate(color: string) {
      if (!this.isColorValid(color)) {
        return;
      }

      this.$emit("generate", useColors(color) as Palette);
      this.color = "";
    },

    isColorValid(color: string) {
      if (!color) {
        return false;
      }

      return /^#?[0-9A-F]{6}$/i.test(color);
    },

    addPrefixValue() {
      if (!this.color) {
        this.color = "#";
      }

      this.color = `#${this.cleanUpColorValue(this.color)}`;
    },

    clearValue() {
      if (this.color === "#") {
        this.color = "";
      }
    },

    cleanUpColorValue(color: string) {
      return color.replace(/[^0-9A-F]/gi, "").slice(0, 6);
    },

    /**
     * We are throttling this because this updates everytie
     * the color picker is dragged, which causes lag and delay
     */
    updateInputColorValue(e: KeyboardEvent) {
      if (throttle) {
        return;
      }

      throttle = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        this.color = e.target.value;
        throttle = 0;
      }, 120);
    },

    cleanUpClipboardValue(e: ClipboardEvent) {
      const pastingText = e.clipboardData?.getData("text/plain");
      this.$nextTick(() => {
        this.color = this.cleanUpColorValue(pastingText || "");
      });
    },

    handleKeydown(e: KeyboardEvent) {
      const isCmd = this.isMac ? e.metaKey : e.ctrlKey;

      if (isCmd && e.key === "ArrowDown") {
        e.preventDefault();
        (this.$refs.inputColorPicker as HTMLInputElement).click();
      }
    }
  }
});
</script>

<template>
  <div class="w-full sm:max-w-xs flex">
    <label for="color-code" class="sr-only">Color Hex Code</label>
    <div class="relative rounded-md shadow-sm w-full md:w-auto">
      <!-- Color sample -->
      <span
        class="inline-block h-4 w-4 rounded-full absolute left-0 ml-3 top-1/2 transform -translate-y-1/2 items-center border"
        :style="`background-color: #${color.replace('#', '')}`"
      ></span>

      <!-- Input -->
      <input
        id="color-code"
        v-model="color"
        type="text"
        class="focus:ring-primary-500 focus:border-primary-500 block w-full px-10 tracking-wide sm:text-sm border-gray-300 rounded-md"
        :placeholder="`Color hex code (${isMac ? '⌘' : 'Ctrl+'}K)`"
        maxlength="7"
        ref="inputColor"
        @input="addPrefixValue"
        @blur="clearValue"
        @focus="addPrefixValue"
        @paste="cleanUpClipboardValue"
        @keyup.enter="generate(newColorInHex)"
        @keydown="handleKeydown"
      />

      <!-- Eye dropper -->
      <span
        class="inline-block hover:text-white hover:bg-black p-1 rounded-full absolute right-0 mr-3 top-1/2 transform -translate-y-1/2 items-center cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="toe-icon ti ti-eye-dropper h-4 w-4"
          viewBox="0 0 64 64"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="0"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M32.132 21.23L42.644 32l-20.85 20.848c-.52.476-.63.45-.977.555L10.59 55.959c-1.47.299-2.853-1.051-2.55-2.55l2.557-10.225c.1-.335.133-.52.555-.977 10.694-10.696 20.979-20.976 20.979-20.976zm4.775 10.56l-4.788-4.605-17.581 17.581-1.567 6.264 6.263-1.568L36.907 31.79zM42.768 10.337s4.213-5.685 10.578.678c5.655 5.657.023 10.254.023 10.254l-7.186 7.02 3.413 3.444-2.615 2.618-17.686-17.686 2.612-2.598 3.56 3.53 7.3-7.26z"
            fill-rule="nonzero"
          ></path>
        </svg>

        <input
          type="color"
          :value="newColorInHex"
          @input="updateInputColorValue"
          ref="inputColorPicker"
          class="opacity-0 w-full h-full inline-block absolute top-0 left-0"
        />
      </span>
    </div>
    <button
      type="button"
      :disabled="!isColorValid(color)"
      class="ml-2 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium
        rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      :class="{
        'bg-primary-600 hover:bg-primary-700': isColorValid(color),
        'bg-gray-300 text-gray-600 cursor-not-allowed': !isColorValid(color)
      }"
      @click="generate(newColorInHex)"
    >
      Go!
    </button>
  </div>
</template>
