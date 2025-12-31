<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { PREFERENCES_STORAGE_KEYS } from '@/constants';
import IconLightMode from '~icons/mdi/weather-sunny';
import IconDarkMode from '~icons/mdi/weather-night';
import { watch } from 'vue';
import { trackOption } from '@/services/analytics';

const configVersion = useLocalStorage(PREFERENCES_STORAGE_KEYS.version, 'v4')
const colorFormat = useLocalStorage(PREFERENCES_STORAGE_KEYS.format, 'oklch')
const currentTheme = useLocalStorage(PREFERENCES_STORAGE_KEYS.theme, 'light')

// Track preference changes
watch(configVersion, (newValue) => {
  trackOption('change', {
    setting_name: 'config_version',
    setting_value: newValue
  })
})

watch(colorFormat, (newValue) => {
  trackOption('change', {
    setting_name: 'color_format',
    setting_value: newValue
  })
})

watch(currentTheme, (newValue) => {
  trackOption('change', {
    setting_name: 'theme',
    setting_value: newValue
  })
})
</script>

<template>
<div>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" for="color-format">Color Format</label>
    <select class="select w-full"
      id="color-format"
      v-model="colorFormat">
      <option value="oklch">OKLCH</option>
      <option value="hex">Hex *</option>
    </select>
    <p v-show="colorFormat === 'hex'" class="text-xs dark:text-gray-500 mt-3">
      * Colors are converted in the generated source code, not in the preview.
      HEX values are an approximation because OKLCH is not a linear color space.
    </p>
  </div>


  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" for="config-version">Config Version</label>
    <select class="select w-full"
      id="config-version"
      v-model="configVersion">
      <option value="v4">TailwindCSS v4</option>
      <option value="v3">TailwindCSS v3</option>
    </select>
  </div>

  <div>
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</h3>
    <div class="flex items-center space-x-4">
      <label class="flex items-center space-x-2 p-2 rounded-md border border-transparent w-full justify-center
        has-checked:border-gray-300 has-checked:bg-gray-100 has-checked:text-gray-700">
        <IconLightMode />
        <span class="text-sm font-medium">Light</span>
        <input type="radio" name="theme" value="light" v-model="currentTheme" class="absolute opacity-0" />
      </label>

      <label class="flex items-center space-x-2 p-2 rounded-md border border-transparent w-full justify-center
        has-checked:border-gray-300 has-checked:bg-gray-100 has-checked:text-gray-700
         dark:has-checked:border-zinc-700 dark:has-checked:bg-gray-900 dark:has-checked:text-gray-300">
        <IconDarkMode />
        <span class="text-sm font-medium">Dark</span>
        <input type="radio" name="theme" value="dark" v-model="currentTheme" class="absolute opacity-0" />
      </label>
    </div>
  </div>
</div>
</template>
