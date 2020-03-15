<script>
export default {
  name: "palette-code",

  props: {
    palette: {
      required: true
    },
    version: {
      type: Number,
      default: 1
    }
  },

  data() {
    return {
      inClipboard: null
    };
  },

  methods: {
    copyCode(code) {
      const text = document.querySelector(`.palette-code.hex${code.color}`),
        range = document.createRange();

      range.selectNode(text);
      const sel = window.getSelection();

      sel.removeAllRanges();
      sel.addRange(range);

      document.execCommand("copy");

      sel.removeAllRanges();

      this.inClipboard = code.color;

      this.$emit("copied", code.color);

      this.$gaTrack("code", "copied", `${code.name}:${code.color}`);

      setTimeout(() => {
        this.inClipboard = null;
      }, 5000);
    }
  }
};
</script>

<template>
  <div class="color-output mt-4">
    <span class="label">Tailwind code:</span>
    <span
      :class="[
            'btn btn-blue btn-xs float-right -mt-1 cursor-pointer',
            inClipboard === palette.color ? 'btn-green' : ''
        ]"
      @click="copyCode(palette)"
    >
      <span>
        <i class="far fa-check-circle" v-show="inClipboard === palette.color"></i>
        {{ inClipboard === palette.color ? 'copied' : 'copy to clipboard' }}
      </span>
    </span>
    <ul :class="`italic text-grey p-4 palette-code hex${palette.color}`">
      <li class="pb-2" v-if="version === 1">'{{ palette.name }}': {</li>
      <li
        class="pb-2"
        v-for="output in palette.output"
        :key="output.name"
      >{{ output.label }}: '{{ output.background.toUpperCase() }}',</li>
      <li class="pb-2" v-if="version === 1">},</li>
    </ul>
  </div>
</template>
