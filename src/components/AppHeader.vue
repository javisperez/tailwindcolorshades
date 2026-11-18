<script setup lang="ts">
import IconGithub from '~icons/mdi/github'
import IconUpload from '~icons/mdi/upload'
import IconSun from '~icons/mdi/weather-sunny'
import IconMoon from '~icons/mdi/weather-night'
import ColorPicker from './ColorPicker.vue'
import { usePreferences } from '@/composables/preferences'
import { GITHUB_URL } from '@/constants'
import { trackInteraction, type ColorSource } from '@/services/analytics'

defineProps<{
  // Once there are palettes the color input lives in the header; before that it is in the hero.
  hasPalettes: boolean
}>()

const emit = defineEmits<{
  (e: 'generate', color: string, source: ColorSource): void
  (e: 'import'): void
}>()

const { theme } = usePreferences()
const homeUrl = import.meta.env.BASE_URL

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line bg-canvas/75 backdrop-blur-xl">
    <div class="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 lg:px-6">
      <a :href="homeUrl" class="mr-auto inline-flex items-center gap-2.5 rounded-lg md:mr-0" aria-label="Tailwind Color Shades, home">
        <svg class="size-7" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="14" y="0" width="50" height="12" rx="6" fill="var(--accent-b)" opacity="0.35" />
          <rect x="9" y="17" width="50" height="12" rx="6" fill="var(--accent-b)" opacity="0.65" />
          <rect x="5" y="34" width="50" height="12" rx="6" fill="var(--accent-a)" />
          <rect x="0" y="51" width="50" height="12" rx="6" fill="var(--accent-a)" opacity="0.6" />
        </svg>
        <span class="font-display text-lg font-bold tracking-tight">
          <span class="sm:hidden">Color Shades</span>
          <span class="max-sm:hidden">Tailwind Color Shades</span>
        </span>
      </a>

      <div v-if="hasPalettes" class="order-last w-full md:order-none md:mx-auto md:w-auto md:max-w-md md:flex-1">
        <ColorPicker @change="(color, source) => emit('generate', color, source)" />
      </div>
      <div v-else class="hidden md:block md:flex-1"></div>

      <div class="flex items-center gap-1.5">
        <button type="button" class="button button-outline button-sm max-md:size-8 max-md:px-0" aria-label="Import config"
          @click="emit('import'); trackInteraction('import_modal_open')">
          <IconUpload class="size-4" />
          <span class="max-md:hidden">Import</span>
        </button>

        <button type="button" class="icon-button" :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="toggleTheme">
          <IconSun v-if="theme === 'dark'" class="size-5" />
          <IconMoon v-else class="size-5" />
        </button>

        <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer" class="icon-button" aria-label="View source on GitHub">
          <IconGithub class="size-5" />
        </a>
      </div>
    </div>
  </header>
</template>
