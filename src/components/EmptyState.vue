<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useIntervalFn, useMediaQuery } from '@vueuse/core'
import { formatCss, formatHex, parse } from 'culori'
import IconShuffle from '~icons/mdi/shuffle'
import IconBarChart from '~icons/mdi/bar-chart'
import IconArrowForward from '~icons/mdi/arrow-forward'
import IconAwesome from '~icons/mdi/auto-awesome'
import IconEye from '~icons/mdi/eye-outline'
import IconTailwind from '~icons/mdi/tailwind'
import IconContrast from '~icons/mdi/contrast-circle'
import IconLink from '~icons/mdi/link-variant'
import ColorPicker from './ColorPicker.vue'
import type { Palette } from './ColorPalette.vue'
import { COLOR_STEPS, QUICK_COLORS } from '@/constants'
import { setAmbient } from '@/composables/ambient'
import { generateColorScale, generatePaletteFromColor } from '@/services/colors'
import { formatColorValue } from '@/services/format'
import { trackInteraction, type ColorSource } from '@/services/analytics'

export type SamplePalette = {
  background: string
  text: string
  primary: string
  secondary: string
  accent: string
  highlight: string
}

const emit = defineEmits<{
  (e: 'generate', color: string, source: ColorSource): void
  (e: 'use-palettes', palettes: Palette[], source: string): void
}>()
const showcase = QUICK_COLORS.map((color) => ({ ...color, colors: generateColorScale(color.hex) }))
const activeIndex = ref(0)
const active = computed(() => showcase[activeIndex.value])
const activeVariable = computed(
  () => `--color-${active.value.name}-500: ${formatColorValue(active.value.colors[500], 'oklch')};`
)

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

function showColor(index: number) {
  activeIndex.value = index
  setAmbient(showcase[index].colors)
}

const { pause, resume } = useIntervalFn(() => showColor((activeIndex.value + 1) % showcase.length), 3400, {
  immediate: false
})

function previewChip(index: number) {
  pause()
  showColor(index)
}

function resumeCycle() {
  if (!prefersReducedMotion.value) {
    resume()
  }
}

onMounted(() => {
  showColor(0)
  resumeCycle()
})

onBeforeUnmount(pause)
const palettes = ref<SamplePalette[]>([])

function randomOKLCHColor() {
  return {
    mode: 'oklch' as const,
    l: Number((0.5 + Math.random() * 0.2).toFixed(2)),
    c: Number((0.1 + Math.random() * 0.2).toFixed(2)),
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
    highlight: formatCss({ ...primary, l: Math.min(primary.l + 0.2, 0.98), c: primary.c * 0.5 }) || ''
  }
}

function randomizeSample(index: number) {
  palettes.value[index] = generateSamplePalette()
  trackInteraction('randomize_sample')
}

function convertSampleToPalettes(sample?: SamplePalette): Palette[] {
  if (!sample) {
    return []
  }

  const colors: Array<{ color: string, name: string }> = [
    { color: sample.background, name: 'background' },
    { color: sample.text, name: 'text' },
    { color: sample.primary, name: 'primary' },
    { color: sample.secondary, name: 'secondary' },
    { color: sample.accent, name: 'accent' },
    { color: sample.highlight, name: 'highlight' }
  ]

  return colors
    .filter(({ color }) => Boolean(color) && parse(color) !== undefined)
    .map(({ color, name }) => ({ ...generatePaletteFromColor(color), name }))
}

function useSample(index: number, source: string) {
  emit('use-palettes', convertSampleToPalettes(palettes.value[index]), source)
}

function surpriseMe() {
  emit('generate', formatHex(randomOKLCHColor()), 'surprise_me')
}

palettes.value = Array.from({ length: 3 }, generateSamplePalette)

const features = [
  { icon: IconEye, title: 'Perceptually even', text: 'Shades are mixed in OKLCH, so steps look evenly spaced and keep their character.' },
  { icon: IconTailwind, title: 'Tailwind v3 and v4', text: 'Copy an @theme block or a config object, in OKLCH or HEX.' },
  { icon: IconContrast, title: 'WCAG contrast built in', text: 'Every shade shows its AA / AAA rating against white and black text.' },
  { icon: IconLink, title: 'Shareable by URL', text: 'Your palettes live in the link. Send it to a teammate, no account needed.' }
]
</script>

<template>
  <div class="relative">
    <div class="hero-grid" aria-hidden="true"></div>

    <!-- Hero -->
    <div class="mx-auto max-w-4xl px-4 pt-12 text-center md:pt-20">
      <p class="pill animate-rise">
        <span class="size-1.5 rounded-full bg-emerald-500"></span>
        Free · No sign-up · Runs in your browser
      </p>

      <h1 class="animate-rise mt-6 font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-tight [animation-delay:60ms] sm:text-6xl md:text-7xl">
        Turn any color into a
        <span class="text-gradient">Tailwind palette</span>
      </h1>

      <p class="animate-rise mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted [animation-delay:120ms] md:text-lg">
        Get a balanced 50–950 scale in OKLCH or HEX, with WCAG contrast checks and a live UI preview.
        Paste it straight into Tailwind v4 or v3.
      </p>

      <div class="animate-rise mx-auto mt-8 max-w-xl [animation-delay:180ms]">
        <ColorPicker size="lg" @change="(color, source) => emit('generate', color, source)" />
      </div>

      <div class="animate-rise mt-5 flex flex-wrap items-center justify-center gap-2 [animation-delay:240ms]"
        @mouseleave="resumeCycle">
        <span class="mr-1 text-xs font-medium text-faint">Or start from</span>
        <button v-for="(color, index) in showcase" :key="color.name" type="button"
          class="button button-outline button-sm gap-1.5 capitalize" @mouseenter="previewChip(index)" @focus="previewChip(index)"
          @click="emit('generate', color.hex, 'quick_color')">
          <span class="size-3 rounded-full ring-1 ring-black/10" :style="{ backgroundColor: color.hex }"></span>
          {{ color.name }}
        </button>
        <button type="button" class="button button-ghost button-sm gap-1.5"
          @click="surpriseMe()">
          <IconAwesome class="size-4" />
          Surprise me
        </button>
      </div>
    </div>

    <!-- Live showcase -->
    <div class="animate-rise mx-auto mt-14 max-w-4xl px-4 [animation-delay:300ms]">
      <div class="card p-3 sm:p-4" aria-hidden="true">
        <div class="grid grid-cols-11 gap-1.5 sm:gap-2">
          <div v-for="(step, index) in COLOR_STEPS" :key="step" class="flex flex-col items-center gap-2">
            <div class="h-24 w-full rounded-lg ring-1 ring-black/5 transition-colors duration-700 sm:h-32 sm:rounded-xl md:h-36"
              :style="{ backgroundColor: active.colors[step], transitionDelay: `${index * 40}ms` }"></div>
            <span class="text-[10px] font-semibold text-faint sm:text-xs">{{ step }}</span>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3 rounded-xl bg-sunken px-3.5 py-2.5 text-xs">
          <code class="truncate text-muted">
            <span class="text-ink">{{ activeVariable.split(':')[0] }}</span>:
            <span class="tok-val" style="color: var(--code-val)">{{ activeVariable.split(': ')[1] }}</span>
          </code>
          <span class="shrink-0 font-semibold capitalize text-faint">{{ active.name }}</span>
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="mx-auto mt-16 grid max-w-5xl gap-3 px-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="feature in features" :key="feature.title" class="rounded-2xl border border-line bg-panel/60 p-5 backdrop-blur">
        <component :is="feature.icon" class="size-6 text-accent-a" />
        <h3 class="mt-3 font-display font-bold">{{ feature.title }}</h3>
        <p class="mt-1.5 text-sm leading-relaxed text-muted">{{ feature.text }}</p>
      </div>
    </div>

    <!-- Samples -->
    <div class="mx-auto mt-24 max-w-[1200px] px-4 lg:px-6">
      <div class="text-center">
        <p class="eyebrow">Not sure where to start?</p>
        <h2 class="mt-2 font-display text-3xl font-extrabold tracking-tight">Try a ready-made combination</h2>
        <p class="mt-2 text-muted">Each one generates a full set of palettes: background, text, primary, secondary, accent and highlight.</p>
      </div>

      <div class="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <!-- Profile -->
        <article class="card flex flex-col justify-between p-5">
          <div class="flex flex-1 flex-col">
            <h3 class="mb-3 font-display font-bold">Profile card</h3>
            <div class="flex-1 rounded-xl border border-line p-4 transition-colors duration-500" aria-hidden="true"
              :style="{ backgroundColor: palettes[0]?.background, color: palettes[0]?.text }">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="grid size-9 place-items-center rounded-full text-sm font-bold"
                    :style="{ backgroundColor: palettes[0]?.primary, color: palettes[0]?.background }">O</span>
                  <div>
                    <p class="text-sm font-semibold" :style="{ color: palettes[0]?.primary }">Olivia</p>
                    <p class="text-xs" :style="{ color: palettes[0]?.secondary }">Product Designer</p>
                  </div>
                </div>
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :style="{ backgroundColor: palettes[0]?.highlight, color: palettes[0]?.text }">PRO</span>
              </div>
              <p class="mb-4 text-sm">“This new feature is a game-changer for our workflow. Highly recommend!”</p>
              <div class="flex gap-2">
                <span class="flex-1 rounded-lg py-2 text-center text-sm font-semibold"
                  :style="{ backgroundColor: palettes[0]?.primary, color: palettes[0]?.background }">Upgrade</span>
                <span class="flex-1 rounded-lg border py-2 text-center text-sm font-semibold"
                  :style="{ borderColor: palettes[0]?.secondary }">Learn more</span>
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between gap-2">
            <button type="button" class="button button-primary button-sm" @click="useSample(0, 'sample_profile')">Use this palette</button>
            <button type="button" class="button button-ghost button-sm" @click="randomizeSample(0)">
              <IconShuffle class="size-4" /> Randomize
            </button>
          </div>
        </article>

        <!-- Dashboard -->
        <article class="card flex flex-col justify-between p-5">
          <div class="flex flex-1 flex-col">
            <h3 class="mb-3 font-display font-bold">SaaS dashboard</h3>
            <div class="flex-1 rounded-xl border border-line p-4 transition-colors duration-500" aria-hidden="true"
              :style="{ backgroundColor: palettes[1]?.background, color: palettes[1]?.text }">
              <div class="mb-3 flex items-center gap-2">
                <IconBarChart class="size-5" :style="{ color: palettes[1]?.primary }" />
                <h4 class="text-sm font-semibold">Monthly sales</h4>
              </div>
              <p class="text-4xl font-extrabold tracking-tight">$23,458</p>
              <p class="mt-1 flex items-center text-sm font-medium" :style="{ color: palettes[1]?.primary }">
                <IconArrowForward class="mr-1 size-4 -rotate-45" /> 12% from last month
              </p>
              <div class="mt-4 flex h-14 items-end gap-1.5">
                <span v-for="(height, i) in [38, 55, 42, 70, 60, 85, 100]" :key="i" class="flex-1 rounded-t-md"
                  :style="{ height: `${height}%`, backgroundColor: i === 6 ? palettes[1]?.accent : palettes[1]?.highlight }"></span>
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between gap-2">
            <button type="button" class="button button-primary button-sm" @click="useSample(1, 'sample_dashboard')">Use this palette</button>
            <button type="button" class="button button-ghost button-sm" @click="randomizeSample(1)">
              <IconShuffle class="size-4" /> Randomize
            </button>
          </div>
        </article>

        <!-- Blog -->
        <article class="card flex flex-col justify-between p-5 md:col-span-2 lg:col-span-1">
          <div class="flex flex-1 flex-col">
            <h3 class="mb-3 font-display font-bold">Blog post</h3>
            <div class="flex-1 overflow-hidden rounded-xl border border-line transition-colors duration-500" aria-hidden="true"
              :style="{ backgroundColor: palettes[2]?.background, color: palettes[2]?.text }">
              <svg viewBox="0 0 320 120" class="block h-28 w-full" preserveAspectRatio="xMidYMid slice">
                <rect width="320" height="120" :fill="palettes[2]?.highlight" />
                <circle cx="248" cy="38" r="16" :fill="palettes[2]?.accent" />
                <path d="M0 120 L70 46 L120 92 L190 24 L270 120 Z" :fill="palettes[2]?.secondary" />
                <path d="M60 120 L140 64 L210 120 Z" :fill="palettes[2]?.primary" />
              </svg>
              <div class="p-4">
                <span class="text-xs font-semibold uppercase" :style="{ color: palettes[2]?.primary }">Travel</span>
                <h4 class="mt-1 mb-2 font-bold" :style="{ color: palettes[2]?.secondary }">Exploring the Alps</h4>
                <p class="mb-3 text-sm">A journey through stunning landscapes and picturesque villages.</p>
                <span class="flex items-center text-sm font-semibold" :style="{ color: palettes[2]?.primary }">
                  Read more <IconArrowForward class="ml-1 size-4" />
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between gap-2">
            <button type="button" class="button button-primary button-sm" @click="useSample(2, 'sample_blog')">Use this palette</button>
            <button type="button" class="button button-ghost button-sm" @click="randomizeSample(2)">
              <IconShuffle class="size-4" /> Randomize
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
