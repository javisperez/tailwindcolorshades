<script setup lang="ts">
import { computed, ref } from "vue";
import { isValidHexColorCode, sixDigitsColorHex } from '@/composables/colors'
// @ts-ignore
import Codemirror from "codemirror-editor-vue3";
// language
import "codemirror/mode/javascript/javascript.js";
// theme
import "codemirror/theme/idea.css"

const emit = defineEmits(['close', 'submit'])

const code = ref('')
const jsonCode = ref()
const isCodeInvalid = ref(false)

const cmOptions = {
  mode: {
    name: "javascript",
    json: true,
    statementIndent: 2
  },
  lineNumbers: false,
  theme: "idea",
}

const colorsToImport  = computed(() => {
  if (!jsonCode.value) {
    return []
  }

  return Object.keys(jsonCode.value).filter((colorName) => {
    return (typeof jsonCode.value[colorName] === 'object') || isValidHexColorCode(jsonCode.value[colorName])
  })
})

const close = () => {
  emit('close')
}

function stringToObject(str: string) {
  // Check if the input is a valid JSON string
  try {
    const parsed = JSON.parse(str);
    return parsed
  } catch (error) {
    // Not a valid JSON, assume it's a JavaScript object and normalize
    try {
      const normalized = str
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"')
        .replace(/,(\s*})/g, '$1'); // Remove trailing commas before closing curly brackets
      return JSON.parse(normalized); // Wrap the normalized string with curly braces to make it valid JSON
    }
    catch (_) {
      return null
    }
  }
}

const onChange = (value: string) => {
  isCodeInvalid.value = false

  if (!value.trim().startsWith("{")) {
    value = `{${value}`
  }

  if (!value.trim().endsWith("}")) {
    value = `${value}}`
  }

  try {
    jsonCode.value = stringToObject(value)
  }
  catch(_) {
    jsonCode.value = undefined
  }
}

const submit = () => {
  if (!jsonCode.value || !code.value) {
    isCodeInvalid.value = true
    return
  }

  const result: {
    [key: string]: object | string
  } = {}

  colorsToImport.value.forEach((colorName: string) => {
    const color = jsonCode.value[colorName]
    result[colorName] = sixDigitsColorHex(color[500] || color)
  })

  emit('submit', result)
  emit('close')
}
</script>

<template>
  <div class="relative">
    <h1 class="text-lg font-medium text-gray-600">Import your custom colors</h1>
    <h2 class="text-sm text-gray-500">Add a custom <strong>json</strong> value to import, or just paste your current ones from your tailwind config file.</h2>
    <button class="absolute top-0 right-0 text-lg hover:text-black focus:text-black text-gray-500 px-1.5" aria-label="Close the import modal" @click="close">
      &times;
    </button>
  </div>

  <div class="border rounded border-gray-300 p-1.5 mt-6">
    <Codemirror
      v-model:value="code"
      :options="cmOptions"
      border
      placeholder="test placeholder"
      :height="200"
      @change="onChange" />
    <div class="border-b border-gray-200 p-1.5 -mx-1.5 text-xs">
      <template v-if="jsonCode">
        <ul class="flex flex-wrap gap-1.5" v-if="colorsToImport.length">
          <li v-for="colorName in colorsToImport" :key="colorName">
            <span class="flex items-center gap-0.5 bg-gray-100 rounded-3xl pl-1.5 pr-3 py-0.5 text-gray-500 border border-green-400"
              title="This color will be imported">
              <svg xmlns="http://www.w3.org/2000/svg"
                class="toe-icon ti ti-success text-green-500"
                width="16" height="16"
                viewBox="0 0 64 64" fill="currentColor"
                stroke="currentColor"
                stroke-width="0"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M56.103 16.824L22.807 50.121 8.026 35.341l2.767-2.767 11.952 11.952 30.53-30.53 2.828 2.828z" fill-rule="nonzero"></path>
              </svg> {{ colorName }}
            </span>
          </li>
        </ul>
        <div v-else>Nothing to import</div>
      </template>
      <div v-else-if="isCodeInvalid" class="text-red-500 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 64 64"
          fill="currentColor" stroke="currentColor" stroke-width="0" stroke-linecap="round" stroke-linejoin="round">
          <g fill-rule="nonzero">
            <path d="M32.427 7.987c2.183.124 4 1.165 5.096 3.281l17.936 36.208c1.739 3.66-.954 8.585-5.373
              8.656H13.967c-4.022-.064-7.322-4.631-5.352-8.696l18.271-36.207c.342-.65.498-.838.793-1.179 1.186-1.375
              2.483-2.111 4.748-2.063zm-.295 3.997a2.034 2.034 0 00-1.659 1.017C24.161 24.98 18.076 37.082 12.172
              49.268c-.546 1.225.391 2.797 1.762 2.863 12.06.195 24.125.195 36.185 0 1.325-.064 2.321-1.584
              1.769-2.85-5.793-12.184-11.765-24.286-17.966-36.267-.366-.651-.903-1.042-1.79-1.03z"></path>
            <path d="M33.631 40.581h-3.348l-.368-16.449h4.1l-.384 16.449zm-3.828 5.03c0-.609.197-1.113.592
              -1.514.396-.4.935-.601 1.618-.601.684 0 1.223.201 1.618.601.395.401.593.905.593 1.514 0 .587-.193 1.078
              -.577 1.473-.385.395-.929.593-1.634.593-.705 0-1.249-.198-1.634-.593-.384-.395-.576-.886-.576-1.473z"></path>
          </g>
        </svg> Invalid JSON
      </div>
    </div>

    <div class="flex justify-end items-center gap-1.5 pt-1.5">
      <button type="button"
        class="rounded-md bg-red-500 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-red-700 hover:text-red-100"
        @click="close">
        Cancel
      </button>
      <button type="button"
        @click="submit"
        class="rounded-md bg-primary-300 px-2.5 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-500 hover:text-primary-100">
        Import
      </button>
    </div>
  </div>

</template>

<style>
.codemirror-container.bordered {
  @apply !rounded-t !rounded-none !border-none;
}

.CodeMirror * {
  @apply !text-sm !font-sans;
}
</style>