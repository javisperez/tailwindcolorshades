<script lang="ts">
import { defineComponent } from "vue";
import { getColorName } from "../composables/colors";

export default defineComponent({
  name: "EmptyHome",

  computed: {
    randomColor() {
      return `000000${((Math.random() * 0xffffff) << 0).toString(16)}`.slice(
        -6
      );
    }
  },

  methods: {
    onColorClick() {
      const name = getColorName(this.randomColor);
      this.$router.push({
        path: "/",
        query: {
          [name]: this.randomColor
        }
      });
    }
  }
});
</script>

<template>
  <span
    class="absolute left-1/2 mt-40 md:mt-28 top-0 transform -translate-x-40"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 85 50"
      class="w-32 text-primary-400"
    >
      <g
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-miterlimit="10"
        stroke-width="1.5"
      >
        <path
          d="M2.475 48.096c-.198-5.312-.229-11.854 1.055-16.943 14.913.752 29.873 1.715 44.812 1.59 7.222-.062 21.494 1.166 27.234-4.655 6.149-6.237-1.756-13.486.899-20.658"
        />
        <path
          d="M69.489 10.186c4.023-1.749 5.278-5.886 8.726-8.281.585 3.148 2.062 9.479 4.413 11.897"
        />
      </g>
    </svg>
  </span>
  <div
    class="flex items-center justify-center text-gray-600 text-3xl font-handwritten pt-6 mt-52 md:mt-0"
  >
    Start here. Try something like
    <span
      class="px-2 text-yellow-600 hover:underline cursor-pointer hover:text-yellow-700"
      @click="onColorClick"
      >#{{ randomColor }}</span
    >
    and click go!
  </div>
</template>
