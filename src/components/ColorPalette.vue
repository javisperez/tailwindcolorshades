<script setup lang="ts">
import { COLOR_STEPS, PREFERENCES_STORAGE_KEYS } from '@/constants'
import useSource from '@/composables/source'
import { useClipboard, useSessionStorage } from '@vueuse/core'
import IconCheck from '~icons/mdi/check'
import IconCopy from '~icons/mdi/content-copy'
import IconChevronUp from '~icons/mdi/chevron-up'
import IconChevronDown from '~icons/mdi/chevron-down'
import IconBookmarkPlus from '~icons/mdi/bookmark-plus-outline'
import IconRestore from '~icons/mdi/backup-restore'
import IconClose from '~icons/mdi/close'
import IconEye from '~icons/mdi/eye'
import IconEyeOff from '~icons/mdi/eye-off'
import IconPencil from '~icons/mdi/pencil-outline'
import IconTrash from '~icons/mdi/trash-can-outline'
import { ref, computed, nextTick, useTemplateRef } from 'vue'
import { formatHex } from 'culori'
import ShadeSwatch from './ShadeSwatch.vue'
import ColorPickerPopup from './ColorPickerPopup.vue'
import BaseModal from './BaseModal.vue'
import { usePreferences } from '@/composables/preferences'
import { useDonations } from '@/composables/donations'
import { trackColorEvent, trackInteraction } from '@/services/analytics'

export type Palette = {
  name: string,
  colors: {
    [variant: number]: string
  },
  anchors?: {
    [variant: number]: string
  }
}

type ColorStep = (typeof COLOR_STEPS)[number];

const props = defineProps<{
  data: Palette,
  // Shades to start with as exported (kept when the card remounts after a rename)
  includedColors?: ColorStep[],
  isFirst?: boolean,
  isLast?: boolean
}>()

const emit = defineEmits<{
  (e: 'delete', palette: Palette): void,
  (e: 'move', direction: -1 | 1): void,
  (e: 'update', data: { includedColors: ColorStep[], name: string }): void,
  (e: 'updateAnchors', anchors: Record<number, string>): void
}>()

const { version: configVersion, format: configFormat, wrapper: includeWrapper, contrast: showContrast } = usePreferences()
const { registerCopy } = useDonations()

// Saved versions of this palette to compare against. Kept in sessionStorage (per palette name) so they survive a refresh.
type PaletteVersion = { id: number, label: string, colors: Palette['colors'], anchors: Record<number, string> }
const MAX_VERSIONS = 5
const versionsStorageKey = `${PREFERENCES_STORAGE_KEYS.versions}-${props.data.name.toLowerCase()}`
const versions = useSessionStorage<PaletteVersion[]>(versionsStorageKey, [], {
  serializer: { read: (raw) => JSON.parse(raw), write: (value) => JSON.stringify(value) }
})
const showVersions = useSessionStorage(`${versionsStorageKey}-visible`, true)

const includedColors = ref<ColorStep[]>(
  props.includedColors ? [...props.includedColors] : Object.keys(props.data.colors).map(s => parseInt(s)) as ColorStep[]
)
// Always ensure 500 is pinned with the base color
const anchors = ref<Record<number, string>>(props.data.anchors || { 500: props.data.colors[500] })
const anchorCount = computed(() => Object.keys(anchors.value).length)

const paletteForSource = computed(() => [{
  name: props.data.name.toLowerCase(),
  colors: { ...props.data.colors }
}])

const includedColorsMap = computed(() => new Map([[props.data.name.toLowerCase(), includedColors.value]]))
const source = useSource(paletteForSource, configVersion, configFormat, includedColorsMap, includeWrapper)
const { copy, copied: isCopied } = useClipboard({ copiedDuring: 1800 })

const isEditing = ref(false)
const draftName = ref(props.data.name)
const editingAnchorStep = ref<number | null>(null)
const nameInput = useTemplateRef<HTMLInputElement>('name-input')

const baseHex = computed(() => formatHex(props.data.colors[500]) ?? '')

function copySourceToClipboard() {
  copy(source.value)
  registerCopy()

  trackColorEvent('copy', {
    color_format: configFormat.value,
    config_version: configVersion.value,
    shade_count: includedColors.value.length
  })
}

function startEditing() {
  draftName.value = props.data.name
  isEditing.value = true
  nextTick(() => nameInput.value?.select())
}

function finishEditing(applyName = true) {
  // Names end up in class names (`bg-<name>-500`), so no whitespace
  const cleaned = draftName.value.trim().replace(/\s+/g, '-')
  const name = applyName && cleaned ? cleaned : props.data.name

  isEditing.value = false
  emit('update', { includedColors: includedColors.value, name })

  if (name !== props.data.name) {
    trackInteraction('rename_palette', 'click')
  }
}

function toggleIncludedColor(step: ColorStep) {
  includedColors.value = includedColors.value.includes(step)
    ? includedColors.value.filter(s => s !== step)
    : [...includedColors.value, step]

  trackInteraction('toggle_shade', 'click')
}

function saveVersion(label?: string) {
  if (versions.value.length >= MAX_VERSIONS) {
    return
  }

  const id = Math.max(0, ...versions.value.map(version => version.id)) + 1
  versions.value = [...versions.value, {
    id,
    label: label ?? `Version ${id}`,
    colors: { ...props.data.colors },
    anchors: { ...anchors.value }
  }]
  showVersions.value = true

  trackInteraction('save_version', 'click')
}

// The first custom color change keeps the original palette around, so there is always something to compare against
function saveOriginalVersion() {
  if (versions.value.length === 0) {
    saveVersion('Original')
  }
}

function restoreVersion(version: PaletteVersion) {
  anchors.value = { ...version.anchors }
  emit('updateAnchors', anchors.value)

  trackInteraction('restore_version', 'click')
}

function removeVersion(version: PaletteVersion) {
  versions.value = versions.value.filter(v => v.id !== version.id)
}

function editAnchor(step: ColorStep) {
  // Open the color picker, on the current color when the shade is already pinned
  editingAnchorStep.value = step
  trackInteraction('toggle_anchor', 'click')
}

function removeAnchor() {
  const step = editingAnchorStep.value
  // Prevent removing the last anchor
  if (step === null || anchorCount.value === 1) {
    return
  }

  const newAnchors = { ...anchors.value }
  delete newAnchors[step]
  saveOriginalVersion()
  anchors.value = newAnchors
  emit('updateAnchors', anchors.value)
  editingAnchorStep.value = null
}

function onColorPickerApply(color: string) {
  if (editingAnchorStep.value !== null) {
    saveOriginalVersion()
    anchors.value = {
      ...anchors.value,
      [editingAnchorStep.value]: color
    }

    emit('updateAnchors', anchors.value)

    trackColorEvent('change_anchor', {
      color_value: color,
      config_version: configVersion.value,
      color_format: configFormat.value
    })
  }

  editingAnchorStep.value = null
}
</script>

<template>
<article class="card p-4 sm:p-5" :aria-label="`Color palette ${data.name}`">
  <header class="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
    <div class="flex min-w-0 items-center gap-3">
      <span class="size-5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15" :style="{ backgroundColor: data.colors[500] }"></span>
      <input v-if="isEditing" ref="name-input" v-model="draftName" type="text" aria-label="Palette name"
        class="field max-w-52 py-1 font-semibold" @keyup.enter="finishEditing()" @keyup.esc="finishEditing(false)" />
      <h3 v-else class="truncate font-display text-lg font-bold tracking-tight">{{ data.name }}</h3>
      <code class="hidden shrink-0 text-xs text-faint sm:inline">{{ baseHex }}</code>
    </div>

    <div class="flex items-center gap-0.5">
      <template v-if="isEditing">
        <span class="mr-2 hidden text-xs text-muted md:inline">Click shades to include or exclude them from the export</span>
        <button type="button" class="button button-primary button-sm" @click="finishEditing()">
          <IconCheck class="size-4" /> Done
        </button>
      </template>

      <template v-else>
        <button type="button" class="icon-button" :disabled="versions.length >= MAX_VERSIONS"
          aria-label="Save this version to compare" title="Save this version to compare" @click="saveVersion()">
          <IconBookmarkPlus class="size-[18px]" />
        </button>
        <button v-if="versions.length" type="button" class="icon-button" :aria-pressed="showVersions"
          :aria-label="showVersions ? 'Hide saved versions' : 'Show saved versions'"
          :title="showVersions ? 'Hide saved versions' : 'Show saved versions'" @click="showVersions = !showVersions">
          <component :is="showVersions ? IconEye : IconEyeOff" class="size-[18px]" />
        </button>
        <button type="button" class="icon-button" :disabled="isFirst" aria-label="Move palette up" title="Move up" @click="emit('move', -1)">
          <IconChevronUp class="size-5" />
        </button>
        <button type="button" class="icon-button" :disabled="isLast" aria-label="Move palette down" title="Move down" @click="emit('move', 1)">
          <IconChevronDown class="size-5" />
        </button>
        <button type="button" class="icon-button" aria-label="Rename or choose which shades to export" title="Rename / choose shades"
          @click="startEditing">
          <IconPencil class="size-[18px]" />
        </button>
        <button type="button" class="icon-button" aria-label="Copy this palette's source" title="Copy this palette's source"
          @click="copySourceToClipboard">
          <component :is="isCopied ? IconCheck : IconCopy" class="size-[18px]" :class="{ 'text-emerald-500': isCopied }" />
        </button>
        <button type="button" class="icon-button hover:!text-red-500" aria-label="Delete palette" title="Delete palette"
          @click="emit('delete', data)">
          <IconTrash class="size-[18px]" />
        </button>
      </template>
    </div>
  </header>

  <div class="grid grid-cols-6 gap-1.5 sm:grid-cols-11 sm:gap-2">
    <ShadeSwatch v-for="step in COLOR_STEPS" :key="step"
      :name="data.name" :step="step" :color="data.colors[step]" :format="configFormat"
      :included="includedColors.includes(step)" :editing="isEditing"
      :is-anchor="Boolean(anchors[step])" :show-contrast="showContrast"
      @toggle-include="toggleIncludedColor(step)" @edit-anchor="editAnchor(step)" />
  </div>

  <!-- Saved versions to compare with the current palette -->
  <div v-if="showVersions && versions.length" class="mt-4 space-y-3 border-t border-line pt-3">
    <div v-for="version in versions" :key="version.id">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="eyebrow">{{ version.label }}</span>
        <div class="flex items-center">
          <button type="button" class="icon-button size-6" :aria-label="`Use ${version.label}`" :title="`Use ${version.label}`"
            @click="restoreVersion(version)">
            <IconRestore class="size-4" />
          </button>
          <button type="button" class="icon-button size-6" :aria-label="`Remove ${version.label}`" :title="`Remove ${version.label}`"
            @click="removeVersion(version)">
            <IconClose class="size-4" />
          </button>
        </div>
      </div>
      <div class="grid grid-cols-6 gap-1.5 sm:grid-cols-11 sm:gap-2">
        <div v-for="step in COLOR_STEPS" :key="`${version.id}-${step}`" class="h-3.5 rounded-md ring-1 ring-black/5 dark:ring-white/10"
          :style="{ backgroundColor: version.colors[step] }" :title="`${step}: ${version.colors[step]}`"></div>
      </div>
    </div>
  </div>

  <BaseModal v-if="editingAnchorStep !== null" :title="`Custom color for ${data.name} ${editingAnchorStep}`" size="max-w-xs" hide-header
    @close="editingAnchorStep = null">
    <ColorPickerPopup :initial-color="anchors[editingAnchorStep] || data.colors[editingAnchorStep]"
      :title="`Custom color for ${data.name} ${editingAnchorStep}`" @apply="onColorPickerApply" @cancel="editingAnchorStep = null"
      :removable="Boolean(anchors[editingAnchorStep]) && anchorCount > 1" @remove="removeAnchor" />
  </BaseModal>
</article>
</template>
