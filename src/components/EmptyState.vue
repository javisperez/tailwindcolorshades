<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatCss, parse } from 'culori'
import IconShuffle from '~icons/mdi/shuffle'
import IconBarChart from '~icons/mdi/bar-chart'
import IconArrowForward from '~icons/mdi/arrow-forward'
import IconAwesome from '~icons/mdi/auto-awesome'
import { generatePalettesQueryString } from '@/services/utils'
import { generatePaletteFromColor } from '@/services/colors'
import { trackColorEvent, trackInteraction } from '@/services/analytics'

export type SamplePalette = {
  background: string
  text: string
  primary: string
  secondary: string
  accent: string
  highlight: string
}

const palettes = ref<SamplePalette[]>([])

function randomOKLCHColor() {
  return {
    mode: 'oklch' as const,
    l: (0.5 + Math.random() * 0.2).toFixed(2) as unknown as number,
    c: (0.1 + Math.random() * 0.2).toFixed(2) as unknown as number,
    h: Math.floor(Math.random() * 360)
  }
}

function rotateHue(color: ReturnType<typeof randomOKLCHColor>, deg: number) {
  return { ...color, h: (color.h + deg + 360) % 360 }
}

function generateSamplePalette(): SamplePalette {
  const primary = randomOKLCHColor()
  const isDark = Math.random() < 0.5

  const background = isDark
    ? { ...primary, l: 0.2, c: 0.02 }
    : { ...primary, l: 0.97, c: 0.01 }

  const text = isDark
    ? { ...primary, l: 0.98, c: 0.03 }
    : { ...primary, l: Math.max(primary.l - 0.3, 0.12), c: primary.c * 1.1 }

  return {
    background: formatCss(background) || '',
    text: formatCss(text) || '',
    primary: formatCss(primary) || '',
    secondary: formatCss(rotateHue(primary, 30)) || '',
    accent: formatCss(rotateHue(primary, 180)) || '',
    highlight: formatCss({ ...primary, l: Math.min(primary.l + 0.2, 0.98), c: primary.c * 0.5 }) || '',
  }
}

function generateSamplePalettes(count: number) {
  palettes.value = Array.from({ length: count }, () => generateSamplePalette())
}

function randomizePaletteColors(paletteIndex: number) {
  const newPalette = generateSamplePalette()
  palettes.value[paletteIndex] = newPalette

  // Track sample randomization
  trackInteraction('randomize_sample', 'click')
}

function generateRandomColor() {
  const random = formatCss(randomOKLCHColor()) || ''
  // format as palette
  return generatePaletteFromColor(random)
}

function convertSampleToPalettes(sample?: SamplePalette) {
  // Safety check for undefined sample
  if (!sample) {
    return [generatePaletteFromColor(formatCss(randomOKLCHColor()) || '')]
  }

  // Generate a palette for each color in the sample
  // Filter out any invalid colors using Culori's parse function
  const palettesToGenerate: Array<{ color: string; name: string }> = [
    { color: sample.background, name: 'background' },
    { color: sample.text, name: 'text' },
    { color: sample.primary, name: 'primary' },
    { color: sample.secondary, name: 'secondary' },
    { color: sample.accent, name: 'accent' },
    { color: sample.highlight, name: 'highlight' },
  ]

  return palettesToGenerate
    .filter(({ color }) => {
      // Check if color is a valid string and can be parsed by Culori
      if (!color || color.trim() === '') return false
      const parsed = parse(color)
      return parsed !== undefined
    })
    .map(({ color, name }) => ({
      ...generatePaletteFromColor(color),
      name
    }))
}

onMounted(() => {
  generateSamplePalettes(3)
})
</script>

<template>
<div>
  <div class="text-center">
    <div class="flex justify-center mb-6">
      <div class="w-16 h-16 rounded-full bg-pink-200 dark:bg-pink-500 -mr-4 border-4 border-gray-50 dark:border-gray-900"></div>
      <div class="w-16 h-16 rounded-full bg-purple-200 dark:bg-purple-500 -mr-4 border-4 border-gray-50 dark:border-gray-900"></div>
      <div class="w-16 h-16 rounded-full bg-blue-200 dark:bg-blue-500 -mr-4 border-4 border-gray-50 dark:border-gray-900"></div>
      <div class="w-16 h-16 rounded-full bg-green-200 dark:bg-green-500 -mr-4 border-4 border-gray-50 dark:border-gray-900"></div>
      <div class="w-16 h-16 rounded-full bg-yellow-200 dark:bg-yellow-500 border-4 border-gray-50 dark:border-gray-900"></div>
    </div>
    <h1 class="text-3xl font-bold text-zinc-900 dark:text-white mb-2">TailwindCSS palette generator</h1>
    <p class="text-zinc-500 dark:text-slate-500">Enter a color or let us surprise you!</p>
    <a :href="`?${generatePalettesQueryString([generateRandomColor()])}`"
      class="button button-borderless px-9 bg-zinc-900 dark:bg-sky-600 dark:text-slate-900 text-white mt-6"
      @click="trackColorEvent('generate', { color_value: 'random' })">
      Surprise Me
      <IconAwesome class="ml-3" />
    </a>
  </div>
  <div class="text-center mt-24">
    <h3 class="text-xl font-bold text-zinc-900 dark:text-white">Sample Random Palettes</h3>
    <p class="text-zinc-500 dark:text-slate-500 flex items-center justify-center"> Get started with these combinations </p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
    <div class="empty-state-sample-card">
      <div class="*:transition-colors">
        <h4 class="font-semibold text-lg text-zinc-900 dark:text-white mb-4">E-commerce</h4>
        <div class="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4"
          :style="{
            'backgroundColor': palettes[0]?.background,
            'color': palettes[0]?.text
          }">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center space-x-2">
              <img alt="User Avatar" class="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp8cwM-FOW_vg0jYX15NP_4vTLM-ZEc4x8j00VMuTG5LpzBXRbiY1kRZM6fHLlcE6oi0_3-y11uavKsyifeLBnugvoHsp-99Bm90V7zTRZsFIoQuVZ2yFike2ZzIQCKj5eq3r1v5IkpWjm_LEPxuBEIlF6fbOPaWBZAIz6l-nwhsWvo6gp6TmC5EwTYQS3E26j-CrBnKoDIgnIxeZGMwX9jzoCqe4dBaqsBDq2K87oJV-t-Dx-O6FWLJjDQiFYEq19Uy2CueS3i-c" />
              <div>
                <p class="font-medium text-sm"
                  :style="{ color: palettes[0]?.primary}">Olivia</p>
                <p class="text-zinc-500 dark:text-slate-500 text-xs"
                  :style="{ color: palettes[0]?.secondary}">Product Designer</p>
              </div>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
              :style="{ backgroundColor: palettes[0]?.highlight, color: palettes[0]?.text }">PRO</span>
          </div>
          <p class="text-sm mb-4" > "This new feature is a game-changer for our workflow. Highly recommend!" </p>
          <div class="flex items-center space-x-2">
            <button class="flex-1 button border-transparent!"
              :style="{ backgroundColor: palettes[0]?.primary, color: palettes[0]?.text }">
              Upgrade
            </button>
            <button class="flex-1 border-zinc-200 dark:border-zinc-700 button"
              :style="{ color: palettes[0]?.text }">
              Learn More</button>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 justify-between mt-4">
        <a :href="`?${generatePalettesQueryString(convertSampleToPalettes(palettes[0]))}`"
          class="button bg-zinc-900 text-white"
          @click="trackColorEvent('generate', { color_value: 'sample_ecommerce' })">
          Use this palette
        </a>
        <button class="button button-borderless text-zinc-500 dark:text-slate-500"
          @click="randomizePaletteColors(0)">
          <IconShuffle />
          <span>Randomize</span>
        </button>
      </div>
    </div>
    <div class="empty-state-sample-card">
      <div class="*:transition-colors">
        <h4 class="font-semibold text-lg text-zinc-900 dark:text-white mb-4">SaaS Dashboard</h4>
        <div class="border border-zinc-200 rounded-xl p-4"
          :style="{
            'backgroundColor': palettes[1]?.background,
            'color': palettes[1]?.text
          }">
          <div class="flex items-center mb-3">
            <IconBarChart class="mr-2" :style="{ color: palettes[1]?.primary }"></IconBarChart>
            <h5 class="font-semibold">Monthly Sales</h5>
          </div>
          <p class="text-4xl font-extrabold mb-1" :style="{ color: palettes[1]?.text }">$23,458</p>
          <p class="text-sm flex items-center" :style="{ color: palettes[1]?.primary }">
            <IconArrowForward class="text-base mr-1"></IconArrowForward> 12% from last month
          </p>
          <div class="mt-4 h-2 w-full bg-zinc-200 rounded-full">
            <div class="h-2 rounded-full" :style="{ width: '75%', backgroundColor: palettes[1]?.accent }"></div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 justify-between mt-4">
        <a :href="`?${generatePalettesQueryString(convertSampleToPalettes(palettes[1]))}`"
          class="button bg-zinc-900! text-white"
          @click="trackColorEvent('generate', { color_value: 'sample_dashboard' })">
          Use this palette
        </a>
        <button class="button button-borderless text-zinc-500 dark:text-slate-500"
          @click="randomizePaletteColors(1)">
          <IconShuffle />
          <span>Randomize</span>
        </button>
      </div>
    </div>
    <div class="empty-state-sample-card">
      <div class="*:transition-colors">
        <h4 class="font-semibold text-lg text-zinc-900 dark:text-white mb-4">Blog Post</h4>
        <div class="border border-zinc-200 rounded-xl overflow-hidden"
          :style="{
            'backgroundColor': palettes[2]?.background,
            'color': palettes[2]?.text
          }">
          <img alt="Mountain landscape" class="w-full h-32 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6S78Djh93QcxrYxnHA_9-Q0gU4wM4ZBDTYDne5xKQj_skD6fNqa67l5A185-j5GEjgtpofy0_ZbV4Q1wPqemIJjDPEEL9pDxhDah2DCwOrV5Py2FNVcYl-nyGRAJVhoHlrza4j52_BrxrLIrfhlro5SlaPezXVBGDVcxBFPvwZsS_AoUJuduBkqa-JOkwdOEWSjuSQeUIp4omR5-DwjOoTf5ZW4jFJGcJqFpvp6S7M9bwvtuYnMdhBhlRF6l6xhv27HSsemW2ftE" />
          <div class="p-4">
            <span class="text-xs font-semibold uppercase"
              :style="{ color: palettes[2]?.primary }">Travel</span>
            <h5 class="font-bold mt-1 mb-2"
              :style="{ color: palettes[2]?.secondary }">Exploring the Alps</h5>
            <p class="text-sm mb-4"> A journey through stunning landscapes and picturesque villages. </p>
            <a class="font-semibold hover:underline text-sm flex items-center" href="#"
              :style="{ color: palettes[2]?.primary }"> Read More <IconArrowForward class="text-base ml-1"></IconArrowForward>
            </a>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 justify-between mt-4">
        <a :href="`?${generatePalettesQueryString(convertSampleToPalettes(palettes[2]))}`"
          class="button bg-zinc-900! text-white"
          @click="trackColorEvent('generate', { color_value: 'sample_blog' })">
          Use this palette
        </a>
        <button class="button button-borderless text-zinc-500 dark:text-slate-500"
          @click="randomizePaletteColors(2)">
          <IconShuffle />
          <span>Randomize</span>
        </button>
      </div>
    </div>
  </div>
</div>
</template>
