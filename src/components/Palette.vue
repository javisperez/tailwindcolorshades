<script lang="ts">
import { defineComponent } from "vue";
import { getTextColor } from "../composables/colors";
import trackAnalytics from "../composables/analytics";
import useSource from "../composables/source";

export default defineComponent({
  name: "Palette",

  props: {
    name: {
      type: String,
      required: true
    },

    colors: {
      type: Object,
      required: true
    }
  },

  emits: ["remove"],

  data() {
    return {
      isEditing: false,
      colorName: this.name,
      isSourceVisible: false,
      isSourceCopied: false,
      includeInSource: Object.keys(this.colors)
    };
  },

  watch: {
    isEditing(isEditing, wasEditing) {
      // When done editing, if the name changes we need to update the url
      if (wasEditing && !isEditing) {
        const query = this.$route.query;
        const newQuery = {
          ...query,
          [this.name]: undefined,
          [this.colorName]: query[this.name]
        };

        // Update the query string with the renamed colors
        this.$router.push({
          path: "/",
          query: newQuery
        });
      }
    }
  },

  computed: {
    // Everything runs around the 500 color
    baseColor() {
      return this.colors[500];
    },

    // The source code of this palette
    source() {
      return useSource({
        name: this.colorName.toLowerCase(),
        colors: this.includeInSource.reduce(
          (acc: { [key: string]: string }, shade: string) => {
            acc[shade] = this.colors[shade];
            return acc;
          },
          {}
        )
      });
    }
  },

  methods: {
    // The color of the text based on the bg color
    getTextColor(color: string) {
      return getTextColor(color);
    },

    // Remove the palette
    remove() {
      this.$emit("remove", this.baseColor);
    },

    // Copy the source code in the clipboard
    copySource() {
      const text = document.querySelector(
        `pre.hex${this.baseColor.replace("#", "")}`
      );
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

      trackAnalytics("code", "copied", `${this.name}:${this.baseColor}`);

      this.isSourceCopied = true;

      setTimeout(() => {
        this.isSourceCopied = false;
      }, 3500);
    },

    // Toggle the "include" check in the palette for the given shade
    toggleIncludeShade(shade: string) {
      if (this.includeInSource.includes(shade)) {
        const index = this.includeInSource.findIndex(s => s === shade);
        this.includeInSource.splice(index, 1);
        return;
      }

      this.includeInSource.push(shade);
    },

    // Tell if a given shade is included in the source
    isIncludedInTheSource(shade: string) {
      return this.includeInSource.includes(shade);
    }
  }
});
</script>

<template>
  <div class="capitalize text-xs lg:h-24 mb-8 flex flex-col lg:flex-row">
    <!-- Color name -->
    <div
      class="max-w-64 w-full lg:text-right pr-4 h-24 flex items-center lg:justify-end font-medium uppercase text-gray-900 hover:text-black"
    >
      <div v-if="isEditing">
        <label for="color-cde" class="sr-only">color code</label>
        <input
          type="text"
          name="color-code"
          id="color-code"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm
          border-gray-300 rounded-md lg:text-right"
          v-model="colorName"
        />
      </div>
      <span v-else>{{ colorName }}</span>
    </div>

    <!-- Color palette -->
    <div
      v-for="(color, shade, i) in colors"
      :key="color"
      class="text-center text-xs lg:max-w-24 basis-24 lg:basis-auto w-full min-h-[6rem] h-24 relative overflow-hidden"
      :class="{
        'lg:rounded-l-lg': i === 0,
        'lg:rounded-r-lg': i === 10,
      }">
      <!-- Palette -->
      <div
        class="w-full h-24 lg:h-full flex lg:items-center lg:justify-center transition p-3"
        :class="!isIncludedInTheSource(shade) && 'opacity-25'"
        :style="`background-color: ${color}; ${!isIncludedInTheSource(shade) &&
          `background-image: linear-gradient(45deg,
              rgba(0, 0, 0, 0.125) 12.5%,
              rgba(255, 255, 255, 0.5) 12.5%,
              rgba(255, 255, 255, 0.5) 37.5%,
              rgba(0, 0, 0, 0.125) 37.5%,
              rgba(0, 0, 0, 0.125) 62.5%,
              rgba(255, 255, 255, 0.5) 62.5%,
              rgba(255, 255, 255, 0.5) 87.5%,
              rgba(0, 0, 0, 0.125) 87.5%
            );
            background-size: 25px 25px; background-position: 0px 0px;`}`
          "
      >
        <div class="block lg:hidden text-left">{{  shade }}</div>
        <transition
          :enter-active-class="`transition delay-${shade}`"
          :leave-active-class="`transition delay-${shade}`"
          enter-from-class="transform -translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform -translate-y-2 opacity-0"
        >
          <button
            class="bg-gray-700 cursor-pointer flex items-center justify-center p-1 rounded-full text-white"
            :class="{
              'line-through': !isIncludedInTheSource(shade),
              'bg-opacity-50': isIncludedInTheSource(shade)
            }"
            v-show="isEditing"
            @click="toggleIncludeShade(shade)"
            :title="!isIncludedInTheSource(shade)
              ? 'This shade will be ignored from the source'
              : 'This shade will be included in the source'
              "
          >
            <span class="bg-black h-4 w-4 mr-1 rounded-full inline-block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="ti ti-success toe-icon"
                viewBox="0 0 64 64"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="0"
                stroke-linecap="round"
                stroke-linejoin="round"
                v-show="isIncludedInTheSource(shade)"
              >
                <path
                  d="M56.103 16.824L22.807 50.121 8.026 35.341l2.767-2.767 11.952 11.952 30.53-30.53 2.828 2.828z"
                  fill-rule="nonzero"
                ></path>
              </svg>
            </span>

            Include
          </button>
        </transition>
      </div>

      <!-- Hex code -->
      <span
        class="absolute bottom-2 left-3 lg:left-1/2 transform lg:-translate-x-1/2 lowercase"
        :style="`color: ${getTextColor(color)}`"
      >
        {{ color }}
      </span>
    </div>

    <!-- Actions -->
    <div
      class="max-w-24 w-full text-right pl-4 h-24 flex flex-col items-start justify-evenly"
    >
      <!-- Copy source -->
      <button
        class="flex items-center text-xs text-gray-500 cursor-pointer hover:text-black transition transform hover:translate-x-1 font-medium"
        @click="copySource"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="toe-icon ti ti-clipboard-copy h-4 w-4"
          viewBox="0 0 64 64"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="0"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-if="!isSourceCopied"
        >
          <path
            d="M49.979 40l-.021 10.005A5.998 5.998 0 0143.963 56H15.974a5.997 5.997 0 01-5.995-5.995L10 18.535a5.997 5.997 0 015.995-5.995h4.479V12a1.013 1.013 0 011.016-1.016h5.59s.07-2.956 2.899-2.956 2.871 2.956 2.871 2.956h5.515c.561 0 1.016.455 1.016 1.016v.54h4.603a5.997 5.997 0 015.995 5.995v10.72h-3.998l-.001-9.726a2.991 2.991 0 00-2.989-2.989h-3.61v.973c0 .562-.455 1.016-1.016 1.016H21.49a1.016 1.016 0 01-1.016-1.016v-.973h-3.486a2.991 2.991 0 00-2.989 2.989l-.021 29.481a2.99 2.99 0 002.989 2.989H42.97a2.99 2.99 0 002.989-2.989L45.98 40h3.999zm-20-30.618a1.521 1.521 0 010 3.041 1.521 1.521 0 010-3.041z"
          ></path>
          <path
            fill-rule="nonzero"
            d="M18 23h13.5v2H18zM18 28.244h10.457v2H18zM17.979 33.488h8.02v2h-8.02zM18 38.731h10.457v2H18zM18 43.975h13.5v2H18zM54 32.484v4.006H34.891l7.413 7.413-2.832 2.832-12.246-12.246.001-.001-.001-.001 12.246-12.246 2.832 2.832-7.411 7.411H54z"
          ></path>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="toe-icon ti ti-success h-4 w-4"
          width="24"
          height="24"
          viewBox="0 0 64 64"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="0"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-else
        >
          <path
            d="M56.103 16.824L22.807 50.121 8.026 35.341l2.767-2.767 11.952 11.952 30.53-30.53 2.828 2.828z"
            fill-rule="nonzero"
          ></path>
        </svg>
        {{ !isSourceCopied ? "Copy" : "Copied" }}
      </button>

      <!-- View source -->
      <button
        class="flex items-center text-xs text-gray-500 cursor-pointer mt-2 hover:text-black transition transform hover:translate-x-1 font-medium"
        v-show="!isEditing"
        @click="isSourceVisible = true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="toe-icon ti ti-eye w-4 h-4"
          viewBox="0 0 64 64"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="0"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M32.513 13.926C43.087 14.076 51.654 23.82 56 32c0 0-1.422 2.892-2.856 4.895a46.344 46.344 0 01-2.191 2.826 41.265 41.265 0 01-1.698 1.898c-5.237 5.5-12.758 9.603-20.7 8.01C19.732 47.859 12.823 40.131 8.497 32c0 0 1.248-2.964 2.69-4.964a45.105 45.105 0 012.034-2.617 41.618 41.618 0 011.691-1.897c4.627-4.876 10.564-8.63 17.601-8.596zm-.037 4c-5.89-.022-10.788 3.267-14.663 7.35a37.553 37.553 0 00-1.527 1.713 41.472 41.472 0 00-1.854 2.386c-.544.755-1.057 1.805-1.451 2.59 3.773 6.468 9.286 12.323 16.361 13.742 6.563 1.317 12.688-2.301 17.016-6.846a37.224 37.224 0 001.534-1.715c.7-.833 1.366-1.694 1.999-2.579.557-.778 1.144-1.767 1.588-2.567-3.943-6.657-10.651-13.944-19.003-14.074z"
          ></path>
          <path
            d="M32.158 23.948c4.425 0 8.018 3.593 8.018 8.017a8.021 8.021 0 01-8.018 8.017 8.021 8.021 0 01-8.017-8.017 8.022 8.022 0 018.017-8.017zm0 4.009a4.01 4.01 0 014.009 4.008 4.01 4.01 0 01-4.009 4.009 4.01 4.01 0 01-4.008-4.009 4.01 4.01 0 014.008-4.008z"
          ></path>
        </svg>
        View
      </button>

      <!-- Remove -->
      <button
        class="flex items-center text-xs text-red-500 hover:text-red-700 cursor-pointer mt-2 transition transform hover:translate-x-1 font-medium"
        @click="remove"
        v-show="isEditing"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="toe-icon ti ti-trash w-4 h-4"
          viewBox="0 0 64 64"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="0"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <g fill-rule="nonzero">
            <path
              d="M19.186 16.493v-1.992c.043-3.346 2.865-6.296 6.277-6.427 3.072-.04 10.144-.04 13.216 0 3.346.129 6.233 3.012 6.277 6.427v1.992h9.106v4H49.62v29.11c-.043 3.348-2.865 6.296-6.278 6.428-7.462.095-14.926.002-22.39.002-3.396-.044-6.385-2.96-6.429-6.43v-29.11H10.08v-4h9.106zm26.434 4H18.521c-.014 9.72-.122 19.441.002 29.16.049 1.25 1.125 2.33 2.379 2.379a875.45 875.45 0 0022.338 0c1.273-.049 2.363-1.163 2.38-2.455V20.493zm-4.701-4c-.014-.83 0-1.973 0-1.973s-.059-2.418-2.343-2.447a723.348 723.348 0 00-13.01 0c-1.273.049-2.363 1.162-2.38 2.454v1.966h17.733z"
            ></path>
            <path
              d="M22.58 28.099h3v16.327h-3zM30.571 28.099h3v16.327h-3zM38.58 28.099h3v16.327h-3z"
            ></path>
          </g>
        </svg>
        Remove
      </button>

      <!-- Edit -->
      <button
        class="flex items-center text-xs mt-2 transition transform font-medium text-gray-500 cursor-pointer hover:text-black hover:translate-x-1"
        @click="isEditing = true"
        v-if="!isEditing"
      >
        <!-- Pen icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="toe-icon ti ti-pencil w-4 h-4"
          viewBox="0 0 64 64"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="0"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M55.944 51.712v4.201l-33.652-.027 4.71-4.174h28.942zM48.389 8c1.649 0 2.505.128 4.752 2.011 2.294 1.921 2.707 3.419 2.803 5.087.102 1.795-.504 3.976-2.188 5.681L21.795 52.74c-.52.475-.629.45-.977.553L10.592 55.85c-1.472.299-2.854-1.049-2.55-2.55l2.557-10.226c.1-.334.133-.517.553-.976 10.696-10.697 21.195-21.594 32.09-32.087C44.663 8.676 46.739 8 48.389 8zM16.014 43.182l-1.477 1.477-1.566 6.262 6.262-1.566 1.479-1.474-4.698-4.699zM46.19 22.609l-4.802-4.801-22.493 22.493 4.712 4.713c7.549-7.448 15.196-14.801 22.583-22.405zm2.826-2.936c.618-.648 1.234-1.298 1.848-1.951 1.673-1.826.443-5.454-2.307-5.578-.056-.002-.112-.002-.168-.002a3.406 3.406 0 00-2.312.977l-1.807 1.808 4.746 4.746z"
            fill-rule="nonzero"
          ></path>
        </svg>
        Edit
      </button>

      <!-- Done -->
      <button
        :disabled="!colorName"
        :title="!colorName ? 'The name for this palette is not valid' : ''"
        class="flex items-center text-xs mt-2 transition transform font-medium"
        :class="{
          'cursor-not-allowed': !colorName,
          'text-green-500 cursor-pointer hover:text-black hover:translate-x-1': colorName
        }"
        v-else
        @click="isEditing = false"
      >
        <!-- Checkmark icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="toe-icon ti ti-success h-4 w-4"
          width="24"
          height="24"
          viewBox="0 0 64 64"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="0"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M56.103 16.824L22.807 50.121 8.026 35.341l2.767-2.767 11.952 11.952 30.53-30.53 2.828 2.828z"
            fill-rule="nonzero"
          ></path>
        </svg>
        Done
      </button>
    </div>

    <!-- Source code -->
    <div
      class="fixed left-0 right-0 top-0 bottom-0 bg-black bg-opacity-50 z-20 opacity-0 pointer-events-none transition-opacity"
      :class="{
        'opacity-100 pointer-events-auto': isSourceVisible
      }"
    >
      <div
        class="w-full max-w-2xl absolute py-4 px-8 shadow-lg rounded top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white"
      >
        <h2
          class="uppercase font-bold flex justify-between items-center text-base mb-4"
        >
          <span class="flex-1">{{ colorName }}</span>
          <span
            class="flex items-center text-xs font-medium rounded-md px-2 py-1 normal-case"
            :class="{
              'text-white bg-blue-500 hover:bg-blue-700 cursor-pointer': !isSourceCopied,
              'text-black': isSourceCopied
            }"
            @click="copySource"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="toe-icon ti ti-clipboard-copy h-4 w-4"
              viewBox="0 0 64 64"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="0"
              stroke-linecap="round"
              stroke-linejoin="round"
              v-if="!isSourceCopied"
            >
              <path
                d="M49.979 40l-.021 10.005A5.998 5.998 0 0143.963 56H15.974a5.997 5.997 0 01-5.995-5.995L10 18.535a5.997 5.997 0 015.995-5.995h4.479V12a1.013 1.013 0 011.016-1.016h5.59s.07-2.956 2.899-2.956 2.871 2.956 2.871 2.956h5.515c.561 0 1.016.455 1.016 1.016v.54h4.603a5.997 5.997 0 015.995 5.995v10.72h-3.998l-.001-9.726a2.991 2.991 0 00-2.989-2.989h-3.61v.973c0 .562-.455 1.016-1.016 1.016H21.49a1.016 1.016 0 01-1.016-1.016v-.973h-3.486a2.991 2.991 0 00-2.989 2.989l-.021 29.481a2.99 2.99 0 002.989 2.989H42.97a2.99 2.99 0 002.989-2.989L45.98 40h3.999zm-20-30.618a1.521 1.521 0 010 3.041 1.521 1.521 0 010-3.041z"
              ></path>
              <path
                fill-rule="nonzero"
                d="M18 23h13.5v2H18zM18 28.244h10.457v2H18zM17.979 33.488h8.02v2h-8.02zM18 38.731h10.457v2H18zM18 43.975h13.5v2H18zM54 32.484v4.006H34.891l7.413 7.413-2.832 2.832-12.246-12.246.001-.001-.001-.001 12.246-12.246 2.832 2.832-7.411 7.411H54z"
              ></path>
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="toe-icon ti ti-success h-4 w-4"
              width="24"
              height="24"
              viewBox="0 0 64 64"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="0"
              stroke-linecap="round"
              stroke-linejoin="round"
              v-else
            >
              <path
                d="M56.103 16.824L22.807 50.121 8.026 35.341l2.767-2.767 11.952 11.952 30.53-30.53 2.828 2.828z"
                fill-rule="nonzero"
              ></path>
            </svg>
            {{ !isSourceCopied ? "Copy" : "Copied" }}
          </span>
          <span
            class="inline-block ml-4 cursor-pointer hover:text-black text-gray-700"
            @click="isSourceVisible = false"
          >
            <!-- Close modal -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="toe-icon ti ti-times h-6 w-6"
              width="24"
              height="24"
              viewBox="0 0 64 64"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="0"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M32.033 29.19l15.55-15.55 2.863 2.863-15.55 15.55 15.55 15.55-2.863 2.863-15.55-15.55-15.55 15.55-2.863-2.863 15.55-15.55-15.55-15.55 2.863-2.863 15.55 15.55z"
              ></path>
              <path
                d="M32.033 29.19l15.55-15.55 2.863 2.863-15.55 15.55 15.55 15.55-2.863 2.863-15.55-15.55-15.55 15.55-2.863-2.863 15.55-15.55-15.55-15.55 2.863-2.863 15.55 15.55z"
              ></path>
            </svg>
          </span>
        </h2>
        <pre
          class="lowercase text-sm bg-gray-900 rounded-lg p-4 text-gray-300 "
          :class="`hex${baseColor.replace('#', '')}`"
          >{{ source }}</pre
        >
      </div>
    </div>
  </div>
</template>
