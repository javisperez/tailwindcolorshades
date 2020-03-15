<script>
import { mapGetters } from "vuex";
import colorNamer from "color-namer";

export default {
  name: "new-color",

  data() {
    return {
      newColor: {},
      isErrorVisible: false,
      errorMessage: "",
      tailwindVersion: 1
    };
  },

  mounted() {
    this.reset();
    if (this.$route.query && this.$route.query.tv !== undefined) {
      this.tailwindVersion = this.$route.query.tv;
    }
  },

  methods: {
    reset() {
      this.newColor = {
        name: "",
        color: ""
      };

      this.$refs.colorCode.focus();
    },

    addColor(e) {
      // We need the color to be able to generate a name (if none provided)
      if (!this.newColor.color) {
        this.$gaTrack(
          "errors",
          "color:generation",
          `Empty value for color (${this.newColor.name}:${this.newColor.color})`
        );
        this.isErrorVisible = true;
        return;
      }

      // if color is invalid, log the error and ignore that color
      if (!this.validateColor(this.newColor.color)) {
        this.$gaTrack(
          "errors",
          "color:generation",
          `Invalid color ${this.newColor.color}`
        );
        this.isErrorVisible = true;
        this.errorMessage = "That color code is not valid";
        return;
      }

      // If no name was provided, use a matching name from the color-namer library
      if (!this.newColor.name) {
        this.newColor.name = colorNamer(`#${this.newColor.color}`.replace('##', '#')).ntc[0].name
        this.$gaTrack(
          "colors",
          "color:generation",
          `No name provided for color: ${
          this.newColor.color}). Using the automated name: ${this.newColor.name}`
        );
      }

      const isColorAlreadyAdded =
        this.colors.findIndex(c => (
            c.name.toLowerCase() === this.newColor.name.toLowerCase() ||
            c.color.toLowerCase() === this.newColor.color.toLowerCase()
        )) > -1;

      if (isColorAlreadyAdded) {
        this.$emit("color:duplicated", this.newColor);
        return;
      }

      this.$store.commit("ADD_COLOR", this.newColor);
      this.reset();

      // Now the query string
      const query = {};
      this.colors.forEach(i => {
        query[i.name] = i.color;
      });

      // Store the Tailwind version too
      query.tv = this.tailwindVersion;

      this.$router.push({ path: "/", query });
    },

    validateNameInput(e) {
      if (e.which === 13) {
        this.isErrorVisible = !this.newColor.name || !this.newColor.color;
        return;
      }
    },

    validateColorInput(e) {
      const safeKeys = [
        13, // enter
        8, // backspace
        9, // tab
        37, // left arrow
        39 // right arrow
      ];

      const charCode = e.charCode || e.which;

      if (charCode === 13) {
        this.isErrorVisible = !this.newColor.name || !this.newColor.color;
        return;
      }

      if (safeKeys.includes(charCode)) {
        return true;
      }

      const key = String.fromCharCode(charCode).toLowerCase(),
        isValid = /^([#0-9A-F])$/gi.test(key),
        isInteracting =
          (e.metaKey || e.ctrlKey) && (key === "v" || key === "a");

      if (
        (!isValid || (this.newColor.color.length > 0 && key === "#")) &&
        !isInteracting
      ) {
        e.preventDefault();
      }

      if (
        this.newColor.color.length > 5 &&
        this.newColor.color.indexOf("#") === -1 &&
        !isInteracting
      ) {
        e.preventDefault();
      }

      return isValid;
    },

    validateColor(color) {
      if (!color) {
        return false;
      }

      return /^#?[0-9A-F]{6}$/i.test(color);
    },

    validatePaste(e) {
      const pastingText = e.clipboardData.getData("text/plain");

      // If pasting an invalid color code, remove all invalid characters
      if (!this.validateColor(pastingText)) {
        this.$nextTick(() => {
          this.newColor.color = this.newColor.color
            .replace(/[^#0-9A-F]/gi, "")
            .slice(0, 6);
        });
      }
    }
  },

  computed: {
    ...mapGetters(["colors"]),

    isDisabled() {
      return !this.validateColor(this.newColor.color) && this.newColor.color;
    }
  },

  watch: {
    isErrorVisible: {
      immediate: true,
      handler(v) {
        if (v === false) {
          this.errorMessage = "Color code is required";
        }
      }
    }
  }
};
</script>

<template>
  <div class="new-color">
    <form @submit.prevent="addColor" class="flex flex-wrap justify-around flex-1 mx-auto">
      <div class="mr-2 flex flex-col flex-1">
        <label class="block text-left font-bold">
          Hex code
          <span class="text-red">*</span>
        </label>
        <input
          type="text"
          class="input orange bg-grey-lighter"
          v-model="newColor.color"
          placeholder="eg. #E24E42"
          @keydown="validateColorInput"
          maxlength="7"
          @paste="validatePaste"
          @input="isErrorVisible = null"
          ref="colorCode"
        >
      </div>

      <div class="mr-2 flex flex-col flex-1">
        <label class="block text-left font-bold">
          Color name
        </label>
        <input
          type="text"
          class="input orange bg-grey-lighter"
          v-model="newColor.name"
          placeholder="eg. valencia"
          @keydown="validateNameInput"
          @input="isErrorVisible = null"
        >
      </div>

      <div class="mt-6 cursor-pointer">
        <input type="submit" class="btn btn-orange" :disabled="isDisabled" value="Generate">
      </div>
    </form>

    <transition name="error-msg">
      <div
        v-if="isErrorVisible"
        class="absolute container top-0 flex items-center bg-red text-white text-sm font-bold px-4 py-3"
        style="left: 50%; transform: translateX(-50%);"
        role="alert"
      >
        <svg
          class="fill-current w-4 text-3xl mr-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path
            d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z"
          ></path>
        </svg>
        <p>{{ errorMessage }}</p>
      </div>
    </transition>
  </div>
</template>
