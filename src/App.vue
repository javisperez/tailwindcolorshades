<script setup lang="ts">
import ColorPicker from '@/components/ColorPicker.vue'
import { useClipboard, useLocalStorage } from '@vueuse/core'
import IconGithub from '~icons/mdi/github'
import IconGear from '~icons/mdi/gear'
import IconCopy from '~icons/mdi/content-copy'
import IconClose from '~icons/mdi/close'
import IconUpload from '~icons/mdi/upload'
import IconFileUpload from '~icons/mdi/file-upload'
import { generateColorScale } from '@/services/colors'
import { COLOR_STEPS, PREFERENCES_STORAGE_KEYS } from '@/constants'
import { computed, ref, watchEffect } from 'vue'
import ColorPalette, { type Palette } from './components/ColorPalette.vue'
import { generatePaletteFromColor, generateColorName } from '@/services/colors'
import { generatePalettesQueryString } from '@/services/utils'
import useSource from '@/composables/source'
import EmptyState from '@/components/EmptyState.vue'
import PreferencePanel from './components/PreferencePanel.vue'
import IconCheck from '~icons/mdi/check'
import { parseConfig } from '@/services/import'
import { trackColorEvent, trackInteraction, trackError } from '@/services/analytics'

type OklchString = `oklch(${number} ${number} ${number})`
type ColorStep = (typeof COLOR_STEPS)[number]
type HexString = `#${string}`

const queryString = new URLSearchParams(window.location.search)
// Update the `currentTheme` based on the user's system preference
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const systemTheme = mediaQuery.matches ? 'dark' : 'light'

const { copy: copyToClipboard, copied: isCopied } = useClipboard()
const configVersion = useLocalStorage(PREFERENCES_STORAGE_KEYS.version, 'v4')
const configFormat = useLocalStorage(PREFERENCES_STORAGE_KEYS.format, 'oklch')
const appTheme = useLocalStorage(PREFERENCES_STORAGE_KEYS.theme, systemTheme)

const palettes = ref<Palette[]>([])
const isOptionsSideOpen = ref(false)
const selectedColor = ref<OklchString | HexString | ''>('')
const paletteToDelete = ref<Palette | null>(null)
const includedColorsPerPalette = ref<Map<string, ColorStep[]>>(new Map())
const isImportModalOpen = ref(false)
const importConfigText = ref('')
const importError = ref('')

const currentNames = computed(() => palettes.value.map(palette => palette.name))

queryString.forEach((value, key) => {
  const colors = generateColorScale(value)
  const name = key

  palettes.value.push({
    name,
    colors
  })

  includedColorsPerPalette.value.set(
    palettes.value[palettes.value.length - 1].name,
    Object.keys(colors).map(s => parseInt(s)) as ColorStep[]
  );
});

const source = useSource(palettes.value, configVersion as any, configFormat as any, includedColorsPerPalette)

function onColorChange(color: string) {
  let palette = generatePaletteFromColor(color)
  // Ensure the palette name is unique
  if (currentNames.value.includes(palette.name)) {
    palette = {
      ...palette,
      name: generateColorName(color, currentNames.value)
    }
  }
  palettes.value.unshift(palette)
  // Update URL with new palette
  const query = generatePalettesQueryString(palettes.value)
  window.history.pushState({}, '', `?${query}`)

  // Track palette generation
  trackColorEvent('generate', {
    color_value: color,
    config_version: configVersion.value as 'v3' | 'v4',
    color_format: configFormat.value as 'hex' | 'oklch'
  })
}

function confirmDeletePalette() {
  if (paletteToDelete.value) {
    const paletteIndex = palettes.value.indexOf(paletteToDelete.value)
    palettes.value.splice(paletteIndex, 1)
    const query = generatePalettesQueryString(palettes.value)
    window.history.pushState({}, '', `?${query}`)
    paletteToDelete.value = null

    // Track palette deletion
    trackInteraction('delete_palette', 'click')
  }
}

function onPaletteUpdate(palette: Palette, data: { includedColors: ColorStep[], name: string }) {
  const paletteIndex = palettes.value.indexOf(palette)
  palettes.value[paletteIndex].name = data.name
  includedColorsPerPalette.value.set(data.name, data.includedColors)

  const query = generatePalettesQueryString(palettes.value)
  window.history.pushState({}, '', `?${query}`)
}

function handleImportConfig() {
  importError.value = ''

  const result = parseConfig(importConfigText.value)

  if (result.error) {
    importError.value = result.error
    // Track import error
    trackError('import_config_parse_error', result.error)
    return
  }

  // Add imported palettes, ensuring unique names
  result.palettes.forEach((palette) => {
    let finalPalette = palette;
    if (currentNames.value.includes(palette.name)) {
      finalPalette = {
        ...palette,
        name: generateColorName(palette.colors[500], currentNames.value)
      };
    }
    palettes.value.unshift(finalPalette)

    // Initialize included colors for the new palette
    includedColorsPerPalette.value.set(
      finalPalette.name,
      Object.keys(finalPalette.colors).map(s => parseInt(s)) as ColorStep[]
    )
  })

  // Update URL with new palettes
  const query = generatePalettesQueryString(palettes.value)
  window.history.pushState({}, '', `?${query}`)

  // Track successful import
  trackColorEvent('import', {
    shade_count: result.palettes.length,
    config_version: result.version
  })

  // Close modal and reset
  isImportModalOpen.value = false
  importConfigText.value = ''
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const fileName = file.name.toLowerCase()

    // Extract relevant part based on file extension
    if (fileName.endsWith('.css')) {
      // Extract @theme section for v4 CSS files
      const themeMatch = content.match(/@theme\s*\{[\s\S]*?\n\}/m)
      importConfigText.value = themeMatch ? themeMatch[0] : content
    } else if (fileName.endsWith('.js') || fileName.endsWith('.cjs') || fileName.endsWith('.mjs')) {
      // Extract colors object from JS/CJS config files
      // Look for colors: { ... } or export default { colors: { ... } }
      const colorsMatch = content.match(/colors\s*:\s*\{([\s\S]*?)\n\s*\}(?:\s*,|\s*\})/m)
      if (colorsMatch) {
        importConfigText.value = `{${colorsMatch[1]}\n}`
      } else {
        importConfigText.value = content
      }
    } else {
      // For .json or .txt, use the whole content
      importConfigText.value = content
    }
  }
  reader.readAsText(file)

  // Reset input so the same file can be selected again
  input.value = ''
}

watchEffect(() => {
  // apply an data-theme attribute to the html tag
  document.documentElement.setAttribute('data-theme', appTheme.value)
})
</script>

<template>
<main class="min-h-screen flex flex-col relative">
  <header class="grid grid-cols-1 lg:grid-cols-3 items-center gap-4 py-3 px-4 relative">
    <div class="logo flex items-center justify-between lg:justify-start">
      <a href="/" class="inline-flex items-center gap-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400" aria-label="home">
        <svg class="size-8" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <rect x="14" y="0" width="50" height="12" rx="6" fill="#DBEAFE" />
            <rect x="9" y="17" width="50" height="12" rx="6" fill="#60A5FA" />
            <rect x="5" y="34" width="50" height="12" rx="6" fill="#3B82F6" />
            <rect x="0" y="51" width="50" height="12" rx="6" fill="#1E3A8A" />
          </g>
        </svg>

        <span class="font-bold text-lg">Tailwind Color Shades</span>
      </a>

      <div class="flex lg:hidden items-center gap-3">
        <button @click="isOptionsSideOpen = !isOptionsSideOpen; trackInteraction('preferences_panel_toggle', 'click')">
          <IconGear class="size-6 transition-transform" :class="{
            'rotate-30': isOptionsSideOpen,
          }" />
        </button>
        <a href="https://github.com/javisperez/tailwindcolorshades" target="_blank">
          <IconGithub class="size-6" />
        </a>
      </div>
    </div>
    <div class="w-full">
      <ColorPicker class="mx-auto" v-model="selectedColor"
        @change="onColorChange" />
    </div>
    <div class="flex items-center justify-center lg:justify-end gap-2 xl:gap-4 flex-wrap md:flex-nowrap">
      <button class="whitespace-nowrap button button-borderless text-xs bg-gray-200 rounded-4xl px-3 gap-2"
        @click="isImportModalOpen = true; trackInteraction('import_modal_open', 'click')">
        <IconUpload class="size-4" />
        <span>Import config</span>
      </button>
      <button class="whitespace-nowrap button button-borderless text-xs bg-gray-200 rounded-4xl px-3 gap-2"
        @click="copyToClipboard(source); trackColorEvent('copy', { shade_count: palettes.length, color_format: configFormat as 'hex' | 'oklch', config_version: configVersion as 'v3' | 'v4' })">
        <Component :is="!isCopied ? IconCopy : IconCheck" class="size-4" />
        <span>{{ isCopied ? 'Copied!' : 'Copy config' }}</span>
      </button>
      <!-- Desktop: Settings and GitHub icons -->
      <button class="hidden lg:block" @click="isOptionsSideOpen = !isOptionsSideOpen; trackInteraction('preferences_panel_toggle', 'click')">
        <IconGear class="size-6 transition-transform" :class="{
          'rotate-30': isOptionsSideOpen,
        }" />
      </button>
      <a href="https://github.com/javisperez/tailwindcolorshades" target="_blank" class="hidden lg:block">
        <IconGithub class="size-6" />
      </a>
    </div>
  </header>

  <section class="xl:container xl:mx-auto flex-1">
    <template v-if="!palettes.length">
      <EmptyState class="mt-12 mb-48" />
    </template>

    <template v-else>
      <div>
        <div class="grid palette-grid px-2 mt-14 h-16 py-6 sticky top-0 z-1 bg-white dark:bg-gray-900 dark:text-gray-300 gap-1 md:gap-4 items-center">
          <div class="hidden md:block md:col-span-2"></div>
          <div v-for="step in COLOR_STEPS" :key="step" class="text-center [writing-mode:vertical-lr] md:[writing-mode:horizontal-tb]">{{ step }}</div>
        </div>
        <div>
          <ColorPalette
            v-for="palette in palettes"
            :key="palette.name"
            :data="palette"
            @update="onPaletteUpdate(palette, $event)"
            @delete="($event: Palette) => paletteToDelete = $event"
          />
        </div>
      </div>
    </template>
  </section>

  <transition
    enter-active-class="transition"
    leave-active-class="transition"
    enter-from-class="opacity-0 transform translate-x-full"
    enter-to-class="opacity-100 transform translate-x-0"
    leave-from-class="opacity-100 transform translate-x-0"
    leave-to-class="opacity-0 transform translate-x-full">
    <aside v-if="isOptionsSideOpen" class="absolute right-0 w-80 inset-y-0 shadow-lg bg-gray-50 dark:bg-gray-800 p-4 z-10">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-300">Preferences</h2>

        <button aria-label="close-preferences-panel"
          class="button button-borderless text-gray-500 hocus:text-black hocus:dark:text-white"
          @click="isOptionsSideOpen = false">
          <IconClose class="size-6" />
        </button>
      </div>

      <PreferencePanel class="mt-10 space-y-6" />
    </aside>
  </transition>
</main>

<Teleport to="#modals">
<template v-if="Boolean(paletteToDelete)">
  <div class="fixed inset-0 dark:bg-black/40 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-96">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Delete Palette
      </h3>
      <p class="mb-6 text-gray-700 dark:text-gray-300">
        Are you sure you want to delete the palette <span class="font-bold">{{ paletteToDelete?.name }}</span>?
      </p>
      <div class="flex justify-end gap-3">
        <button
          class="button button-borderless px-4 py-2 rounded text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="paletteToDelete = null">
          Cancel
        </button>
        <button
          class="button bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          @click="confirmDeletePalette">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<template v-if="isImportModalOpen">
  <div class="fixed inset-0 dark:bg-black/40 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-[600px] max-w-[90vw]">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Import Config
      </h3>
      <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Paste your Tailwind CSS v3 (JSON) or v4 (CSS vars) config, or upload a file.
      </p>

      <div class="mb-4">
        <textarea
          v-model="importConfigText"
          class="w-full h-64 p-3 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste config here...&#10;&#10;Example v4:&#10;@theme {&#10;  --color-primary-500: #3b82f6;&#10;}&#10;&#10;Example v3:&#10;{&#10;  'primary': {&#10;    '500': '#3b82f6'&#10;  }&#10;}"
        ></textarea>
      </div>

      <div class="mb-4">
        <label class="button button-borderless bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded cursor-pointer inline-flex items-center gap-2">
          <IconFileUpload class="size-5" />
          Import from file
          <input
            type="file"
            accept=".css,.cjs,.mjs,.js,.json,.txt"
            class="hidden"
            @change="handleFileUpload"
          />
        </label>
      </div>

      <div v-if="importError" class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-300 text-sm">
        {{ importError }}
      </div>

      <div class="flex justify-end gap-3">
        <button
          class="button button-borderless px-4 py-2 rounded text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="isImportModalOpen = false; importConfigText = ''; importError = ''">
          Cancel
        </button>
        <button
          class="button bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!importConfigText.trim()"
          @click="handleImportConfig">
          Import
        </button>
      </div>
    </div>
  </div>
</template>
</Teleport>
</template>
