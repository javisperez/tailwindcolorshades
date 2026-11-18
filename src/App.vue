<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useClipboard } from '@vueuse/core'
import IconCopy from '~icons/mdi/content-copy'
import IconCheck from '~icons/mdi/check'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import BaseModal from '@/components/BaseModal.vue'
import ColorPalette, { type Palette } from '@/components/ColorPalette.vue'
import DonateNudge from '@/components/DonateNudge.vue'
import EmptyState from '@/components/EmptyState.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import ImportModal from '@/components/ImportModal.vue'
import LivePreview from '@/components/LivePreview.vue'
import useSource from '@/composables/source'
import { setAmbient } from '@/composables/ambient'
import { useDonations } from '@/composables/donations'
import { usePreferences } from '@/composables/preferences'
import { COLOR_STEPS } from '@/constants'
import { generateColorName, generateColorScale, generatePaletteFromColor } from '@/services/colors'
import { generatePalettesQueryString } from '@/services/utils'
import { track, trackInteraction, type ColorSource, type CopySource } from '@/services/analytics'

type ColorStep = (typeof COLOR_STEPS)[number]

const { version: configVersion, format: configFormat, wrapper: includeWrapper, theme, contrast: showContrast } = usePreferences()
const { registerCopy } = useDonations()
const { copy: copyToClipboard, copied: isCopied } = useClipboard({ copiedDuring: 1800 })

const palettes = ref<Palette[]>([])
const includedColorsPerPalette = ref<Map<string, ColorStep[]>>(new Map())
const paletteToDelete = ref<Palette | null>(null)
const isImportModalOpen = ref(false)

const currentNames = computed(() => palettes.value.map(palette => palette.name))
new URLSearchParams(window.location.search).forEach((value, name) => {
  try {
    let colors: Record<number, string>
    let anchors: Record<number, string> | undefined

    if (value.includes(':')) {
      // Anchor format: "700:#ff0000" or "200:#ff0000,500:#00ff00,800:#0000ff"
      anchors = {}
      value.split(',').forEach(pair => {
        const [step, color] = pair.split(':')
        if (step && color) {
          anchors![parseInt(step)] = color
        }
      })

      // Base color for generation: 500 when available, otherwise the first anchor
      colors = generateColorScale(anchors[500] || Object.values(anchors)[0], anchors)
    } else {
      colors = generateColorScale(value)
    }

    palettes.value.push({ name, colors, ...(anchors && { anchors }) })
    includedColorsPerPalette.value.set(name, Object.keys(colors).map(s => parseInt(s)) as ColorStep[])
  } catch {
    // A color in the link could not be read: skip that palette instead of breaking the page
  }
})

// Opened with palettes in the link: someone shared it, or this is a reload of your own work
if (palettes.value.length) {
  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]

  if (navigation?.type !== 'reload') {
    track('share_link_opened', { palette_count: palettes.value.length })
  }
}

const source = useSource(palettes.value, configVersion, configFormat, includedColorsPerPalette, includeWrapper)
function syncUrl() {
  window.history.pushState({}, '', `?${generatePalettesQueryString(palettes.value)}`)
}

const isNameTaken = (name: string, names: string[]) => names.some(n => n.toLowerCase() === name.toLowerCase())

// Adds palettes at the top of the list, keeping their order and making every name unique.
function addPalettes(incoming: Palette[]) {
  const added: Palette[] = []

  incoming.forEach((palette) => {
    const names = [...currentNames.value, ...added.map(p => p.name)]
    const finalPalette = isNameTaken(palette.name, names)
      ? { ...palette, name: generateColorName(palette.colors[500], names) }
      : palette

    added.push(finalPalette)
    includedColorsPerPalette.value.set(finalPalette.name, Object.keys(finalPalette.colors).map(s => parseInt(s)) as ColorStep[])
  })

  palettes.value.unshift(...added)
  syncUrl()
}

function onColorChange(color: string, source: ColorSource) {
  addPalettes([generatePaletteFromColor(color)])
  track('color_generate', { source })
}

function onUseSample(samplePalettes: Palette[]) {
  addPalettes(samplePalettes)
  track('color_generate', { source: 'sample' })
}

function onImport(imported: Palette[], version?: 'v3' | 'v4') {
  addPalettes(imported)
  track('color_import', { palette_count: imported.length, ...(version && { config_version: version }) })
  isImportModalOpen.value = false
}

function confirmDeletePalette() {
  if (!paletteToDelete.value) {
    return
  }

  const index = palettes.value.indexOf(paletteToDelete.value)
  includedColorsPerPalette.value.delete(paletteToDelete.value.name)
  palettes.value.splice(index, 1)
  paletteToDelete.value = null
  syncUrl()

  trackInteraction('delete_palette')
}

function onPaletteMove(palette: Palette, direction: -1 | 1) {
  const from = palettes.value.indexOf(palette)
  const to = from + direction
  if (from < 0 || to < 0 || to >= palettes.value.length) {
    return
  }

  const [moved] = palettes.value.splice(from, 1)
  palettes.value.splice(to, 0, moved)
  syncUrl()

  trackInteraction('move_palette')
}

function onPaletteUpdate(palette: Palette, data: { includedColors: ColorStep[], name: string }) {
  const index = palettes.value.indexOf(palette)
  const otherNames = currentNames.value.filter((_, i) => i !== index)
  // Renaming to a name another palette already uses would merge them in the export: keep the old one
  const name = data.name !== palette.name && isNameTaken(data.name, otherNames) ? palette.name : data.name

  includedColorsPerPalette.value.delete(palette.name)
  includedColorsPerPalette.value.set(name, data.includedColors)
  palettes.value[index].name = name
  syncUrl()
}

function onPaletteAnchorsUpdate(palette: Palette, anchors: Record<number, string>) {
  const index = palettes.value.indexOf(palette)

  // Ensure at least one anchor exists: if all were removed, keep 500 as the default
  if (Object.keys(anchors).length === 0) {
    anchors = { 500: palette.colors[500] }
  }

  // Base color: 500 when available, otherwise the first anchor
  const baseColor = anchors[500] || palette.colors[500] || Object.values(anchors)[0]

  palettes.value[index] = {
    ...palette,
    colors: generateColorScale(baseColor, anchors),
    anchors
  }
  syncUrl()

  track('color_update_anchors', { anchor_count: Object.keys(anchors).length })
}

function copyConfig(from: CopySource) {
  copyToClipboard(source.value)
  registerCopy()

  track('color_copy', {
    source: from,
    palette_count: palettes.value.length,
    color_format: configFormat.value,
    config_version: configVersion.value,
    wrapper: includeWrapper.value
  })
}
watchEffect(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
})

// The page glows in the color of the palette on top. (The hero cycles its own colors while empty.)
watch(() => palettes.value[0]?.colors, (colors) => setAmbient(colors ?? null), { immediate: true })

const legend = [
  { label: 'AAA', hint: '7+' },
  { label: 'AA', hint: '4.5+' },
  { label: 'AA Lg', hint: '3+' },
  { label: 'Fail', hint: '<3' }
]
</script>

<template>
<div class="ambient" aria-hidden="true"></div>

<div class="flex min-h-dvh flex-col">
  <AppHeader :has-palettes="palettes.length > 0" @generate="onColorChange" @import="isImportModalOpen = true" />

  <main class="flex-1">
    <EmptyState v-if="!palettes.length" class="pb-8" @generate="onColorChange" @use-palettes="onUseSample" />

    <div v-else class="mx-auto grid max-w-[1400px] items-start gap-x-6 gap-y-10 px-4 py-6 pb-28 grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_400px] xl:px-6 xl:pb-10">
      <section class="xl:col-start-1" aria-label="Palettes">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h1 class="font-display text-2xl font-extrabold tracking-tight">Your palettes</h1>
            <p class="mt-1 text-sm text-muted">Click a shade to copy it. Pin shades (<span class="whitespace-nowrap">on desktop</span>) to steer the scale.</p>
          </div>

          <div class="flex items-center gap-2 text-xs text-muted">
            <template v-if="showContrast">
              <span v-for="item in legend" :key="item.label" class="rounded-md border border-line bg-panel px-1.5 py-0.5 font-semibold"
                title="WCAG contrast of the better text color (white or black) on each shade">
                <span class="text-ink">{{ item.label }}</span> <span class="font-normal text-faint">{{ item.hint }}</span>
              </span>
            </template>
            <label class="flex items-center gap-2 font-medium">
              Contrast
              <input v-model="showContrast" type="checkbox" class="switch" aria-label="Show WCAG contrast badges on each shade" />
            </label>
          </div>
        </div>

        <TransitionGroup tag="div" class="relative flex flex-col gap-4"
          enter-active-class="transition duration-300"
          enter-from-class="-translate-y-3 scale-[0.98] opacity-0"
          leave-active-class="absolute inset-x-0 transition duration-150"
          leave-to-class="scale-95 opacity-0"
          move-class="transition-transform duration-300 ease-in-out">
          <ColorPalette
            v-for="(palette, index) in palettes"
            :key="palette.name"
            :data="palette"
            :included-colors="includedColorsPerPalette.get(palette.name)"
            :is-first="index === 0"
            :is-last="index === palettes.length - 1"
            @move="onPaletteMove(palette, $event)"
            @update="onPaletteUpdate(palette, $event)"
            @update-anchors="onPaletteAnchorsUpdate(palette, $event)"
            @delete="paletteToDelete = $event"
          />
        </TransitionGroup>
      </section>

      <aside class="xl:sticky xl:top-20 xl:col-start-2 xl:row-span-2 xl:row-start-1" aria-label="Export">
        <ExportPanel :source="source" :palette-count="palettes.length" :copied="isCopied" @copy="copyConfig('export_panel')" />
      </aside>

      <div class="xl:col-start-1">
        <LivePreview :palettes="palettes" />
      </div>
    </div>
  </main>

  <AppFooter />
</div>

<!-- Mobile: the export panel is far down the page, so copying stays one tap away -->
<div v-if="palettes.length" class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/85 p-3 backdrop-blur-xl xl:hidden">
  <div class="mx-auto flex max-w-lg gap-2">
    <button type="button" class="button button-primary h-11 flex-1" @click="copyConfig('mobile_bar')">
      <component :is="isCopied ? IconCheck : IconCopy" class="size-4" />
      {{ isCopied ? 'Copied!' : 'Copy config' }}
    </button>
  </div>
</div>

<DonateNudge />

<BaseModal v-if="paletteToDelete" title="Delete palette" size="max-w-sm" @close="paletteToDelete = null">
  <div class="p-5">
    <p class="text-sm leading-relaxed text-muted">
      Remove <strong class="text-ink">{{ paletteToDelete.name }}</strong> from your export and the share link?
    </p>
    <div class="mt-5 flex justify-end gap-2">
      <button type="button" class="button button-ghost" @click="paletteToDelete = null">Cancel</button>
      <button type="button" class="button bg-red-600 text-white hover:bg-red-700" @click="confirmDeletePalette">Delete</button>
    </div>
  </div>
</BaseModal>

<ImportModal v-if="isImportModalOpen" @close="isImportModalOpen = false" @import="onImport" />
</template>
