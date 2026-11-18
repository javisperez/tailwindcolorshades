<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatCss } from 'culori'
import IconChevronDown from '~icons/mdi/chevron-down'
import type { Palette } from './ColorPalette.vue'
import { usePreferences } from '@/composables/preferences'
import { generateColorScale } from '@/services/colors'
import { formatRatio, contrastLevel, contrastRatio, shadeContrast } from '@/services/contrast'
import { hueOf } from '@/services/format'
import { track, trackInteraction } from '@/services/analytics'

const props = defineProps<{ palettes: Palette[] }>()

const { preview: isOpen } = usePreferences()

const AUTO = '__auto__'
const MIXED = '__mixed__'
const primaryName = ref(props.palettes[0]?.name ?? '')
const neutralName = ref(AUTO)

// Palettes can be renamed or deleted while the preview is open
watch(() => props.palettes.map((p) => p.name), (names) => {
  const isValid = names.includes(primaryName.value) || (primaryName.value === MIXED && names.length > 1)
  if (!isValid) {
    primaryName.value = names[0] ?? ''
  }
  if (neutralName.value !== AUTO && !names.includes(neutralName.value)) {
    neutralName.value = AUTO
  }
})

const isMixed = computed(() => primaryName.value === MIXED && props.palettes.length > 1)
const primary = computed(() => props.palettes.find((p) => p.name === primaryName.value) ?? props.palettes[0])

// Which palette colors each part of the UI. A single palette colors everything;
// "Mixed" spreads the palettes over the components, in the order they are listed.
const roles = computed(() => {
  if (isMixed.value) {
    const [brand, secondary, accent = brand, extra = secondary, highlight = accent] = props.palettes.map((p) => p.colors)
    return { brand, secondary, accent, extra, highlight }
  }

  const colors = primary.value.colors
  return { brand: colors, secondary: colors, accent: colors, extra: colors, highlight: colors }
})

// "Auto" gives you slate-like neutrals that carry a hint of the primary hue
const neutral = computed(() => {
  const chosen = props.palettes.find((p) => p.name === neutralName.value)
  if (chosen) {
    return chosen.colors
  }

  const hue = hueOf(primary.value.colors[500])
  return generateColorScale(formatCss({ mode: 'oklch', l: 0.55, c: 0.025, h: hue }))
})

type Mode = 'light' | 'dark'

function theme(mode: Mode) {
  const { brand: b, secondary: s, accent: a, extra: e, highlight: h } = roles.value
  const n = neutral.value
  const isLight = mode === 'light'

  const bg = isLight ? n[50] : n[950]
  const text = isLight ? n[900] : n[50]
  const brand = isLight ? b[600] : b[500]
  const toggle = isLight ? a[600] : a[500]
  const onColor = (color: string) => shadeContrast(color).best === 'white' ? '#ffffff' : '#000000'
  const onBrand = onColor(brand)

  return {
    vars: {
      '--bg': bg,
      '--surface': isLight ? '#ffffff' : n[900],
      '--text': text,
      '--muted': isLight ? n[500] : n[400],
      '--border': isLight ? n[200] : n[800],
      '--brand': brand,
      '--on-brand': onBrand,
      '--ring': isLight ? b[300] : b[700],
      '--tag': isLight ? s[100] : s[950],
      '--tag-text': isLight ? s[800] : s[200],
      '--tag-border': isLight ? s[200] : s[900],
      '--alert': isLight ? a[100] : a[950],
      '--alert-text': isLight ? a[800] : a[200],
      '--alert-border': isLight ? a[200] : a[900],
      '--toggle': toggle,
      '--on-toggle': onColor(toggle),
      '--bar-soft': isLight ? e[200] : e[800],
      '--bar-strong': isLight ? h[500] : h[400]
    },
    checks: [
      { label: 'Button text', ratio: contrastRatio(onBrand, brand) ?? 1 },
      { label: 'Body text', ratio: contrastRatio(text, bg) ?? 1 }
    ]
  }
}

const modes = computed(() => (['light', 'dark'] as Mode[]).map((mode) => ({ mode, ...theme(mode) })))

function onPrimaryChange(event: Event) {
  const mode = (event.target as HTMLSelectElement).value === MIXED ? 'mixed' : 'single'
  track('preview_primary', { mode })
}

function toggle() {
  isOpen.value = !isOpen.value
  trackInteraction('preview_toggle')
}
</script>

<template>
  <section aria-labelledby="preview-title">
    <h2 id="preview-title">
      <button type="button" class="flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-panel/60 px-4 py-3 text-left transition hover:bg-panel"
        :aria-expanded="isOpen" aria-controls="live-preview" @click="toggle">
        <span>
          <span class="block font-display text-lg font-bold tracking-tight">See it in a real UI</span>
          <span class="block text-sm font-normal text-muted">Your palette on typical components, in light and dark mode.</span>
        </span>
        <IconChevronDown class="size-5 shrink-0 text-muted transition-transform" :class="{ 'rotate-180': isOpen }" />
      </button>
    </h2>

    <div v-if="isOpen" id="live-preview" class="mt-4">
      <div class="mb-4 flex flex-wrap items-end justify-end gap-3">
        <label class="text-xs font-semibold text-muted">
          <span class="eyebrow mb-1 block">Primary</span>
          <select v-model="primaryName" class="field select-field w-40 py-1.5" @change="onPrimaryChange">
            <option v-if="palettes.length > 1" :value="MIXED">Mixed (all palettes)</option>
            <option v-for="palette in palettes" :key="palette.name" :value="palette.name">{{ palette.name }}</option>
          </select>
        </label>
        <label class="text-xs font-semibold text-muted">
          <span class="eyebrow mb-1 block">Neutrals</span>
          <select v-model="neutralName" class="field select-field w-40 py-1.5" @change="trackInteraction('preview_neutral')">
            <option :value="AUTO">Auto (tinted)</option>
            <option v-for="palette in palettes" :key="palette.name" :value="palette.name">{{ palette.name }}</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div v-for="item in modes" :key="item.mode">
          <div class="overflow-hidden rounded-2xl border border-line bg-(--bg) text-(color:--text) transition-colors duration-500"
            :style="item.vars" aria-hidden="true">
            <!-- Nav -->
            <div class="flex items-center justify-between gap-3 border-b border-(color:--border) px-4 py-3">
              <div class="flex items-center gap-2 text-sm font-bold">
                <span class="size-5 rounded-md bg-(--brand)"></span> Acme
              </div>
              <div class="hidden gap-3 text-xs text-(color:--muted) sm:flex">
                <span>Product</span><span>Pricing</span><span>Docs</span>
              </div>
              <span class="rounded-full bg-(--brand) px-3 py-1 text-xs font-semibold text-(color:--on-brand)">Sign up</span>
            </div>

            <div class="space-y-4 p-4">
              <!-- Hero -->
              <div>
                <span class="rounded-full border border-(color:--tag-border) bg-(--tag) px-2.5 py-0.5 text-[11px] font-semibold text-(color:--tag-text)">New</span>
                <h3 class="mt-2.5 text-xl leading-tight font-extrabold tracking-tight">Ship colors with confidence</h3>
                <p class="mt-1 text-sm text-(color:--muted)">A palette that holds up in every component.</p>
                <div class="mt-3 flex gap-2">
                  <span class="rounded-lg bg-(--brand) px-3.5 py-2 text-sm font-semibold text-(color:--on-brand)">Get started</span>
                  <span class="rounded-lg border border-(color:--border) bg-(--surface) px-3.5 py-2 text-sm font-semibold">Learn more</span>
                </div>
              </div>

              <!-- Form -->
              <div class="rounded-xl border border-(color:--border) bg-(--surface) p-3.5">
                <p class="text-xs font-semibold">Email</p>
                <div class="mt-1.5 rounded-lg border border-(color:--brand) px-3 py-2 text-sm text-(color:--muted)"
                  style="box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 55%, transparent)">
                  you@example.com
                </div>
                <div class="mt-3 flex items-center justify-between text-sm">
                  <span>Email me product updates</span>
                  <span class="relative h-5 w-9 rounded-full bg-(--toggle)">
                    <span class="absolute top-0.5 right-0.5 size-4 rounded-full bg-(--on-toggle)"></span>
                  </span>
                </div>
              </div>

              <!-- Alert -->
              <div class="rounded-xl border border-(color:--alert-border) bg-(--alert) px-3.5 py-3 text-sm text-(color:--alert-text)">
                <span class="font-semibold">Heads up.</span> Your trial ends in 3 days.
              </div>

              <!-- Chart -->
              <div class="flex h-12 items-end gap-1.5">
                <span v-for="(height, i) in [40, 62, 48, 75, 58, 90, 70]" :key="i" class="flex-1 rounded-t-md"
                  :style="{ height: `${height}%`, backgroundColor: i === 5 ? 'var(--bar-strong)' : 'var(--bar-soft)' }"></span>
              </div>
            </div>
          </div>

          <div class="mt-2.5 flex items-center justify-between gap-3 px-1 text-xs text-muted">
            <span class="font-semibold capitalize text-ink">{{ item.mode }} mode</span>
            <span class="flex flex-wrap justify-end gap-x-3">
              <span v-for="check in item.checks" :key="check.label">
                {{ check.label }} {{ formatRatio(check.ratio) }}
                <strong :class="contrastLevel(check.ratio) === 'Fail' ? 'text-red-500' : 'text-ink'">{{ contrastLevel(check.ratio) }}</strong>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
