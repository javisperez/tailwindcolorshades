<script setup lang="ts">
import { COLOR_STEPS, PREFERENCES_STORAGE_KEYS } from '@/constants';
import useSource from '@/composables/source';
import { useClipboard, useLocalStorage, useSessionStorage, onClickOutside } from '@vueuse/core';
import IconMenu from '~icons/mdi/dots-vertical'
import IconCheck from '~icons/mdi/check'
import IconCheckAll from '~icons/mdi/check-all'
import IconChevronUp from '~icons/mdi/chevron-up'
import IconChevronDown from '~icons/mdi/chevron-down'
import IconBookmarkPlus from '~icons/mdi/bookmark-plus-outline'
import IconRestore from '~icons/mdi/backup-restore'
import IconClose from '~icons/mdi/close'
import IconEye from '~icons/mdi/eye'
import IconEyeOff from '~icons/mdi/eye-off'
import IconPin from '~icons/mdi/pin'
import IconPinOutline from '~icons/mdi/pin-outline'
import { ref, computed, useTemplateRef } from 'vue';
import Tooltip from './Tooltip.vue';
import ColorPickerPopup from './ColorPickerPopup.vue';
import { trackColorEvent, trackInteraction } from '@/services/analytics';

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
  isFirst?: boolean,
  isLast?: boolean
}>()

const emit = defineEmits<{
  (e: 'delete', palette: Palette): void,
  (e: 'move', direction: -1 | 1): void,
  (e: 'rename', name: string): void,
  (e: 'update', data: { includedColors: ColorStep[], name: string }): void,
  (e: 'updateAnchors', anchors: Record<number, string>): void,
  (e: 'regenerate', anchors: Record<number, string>): void
}>()

// Saved versions of this palette to compare against. Kept in sessionStorage (per palette name) so they survive a refresh.
type PaletteVersion = { id: number, label: string, colors: Palette['colors'], anchors: Record<number, string> }
const MAX_VERSIONS = 5
const versionsStorageKey = `${PREFERENCES_STORAGE_KEYS.versions}-${props.data.name.toLowerCase()}`
const versions = useSessionStorage<PaletteVersion[]>(versionsStorageKey, [], {
  serializer: { read: (raw) => JSON.parse(raw), write: (value) => JSON.stringify(value) }
})
const showVersions = useSessionStorage(`${versionsStorageKey}-visible`, true)

const includedColors = ref<ColorStep[]>(Object.keys(props.data.colors).map(s => parseInt(s)) as ColorStep[])
// Always ensure 500 is pinned with the base color
const anchors = ref<Record<number, string>>(props.data.anchors || { 500: props.data.colors[500] })
// Garbage collection should work fine here as long as we don't keep references to unused maps.
// Old maps should be GC'd if not referenced elsewhere.
const paletteForSource = computed(() => [{
  name: props.data.name.toLowerCase(),
  colors: Object.keys(props.data.colors).reduce(
    (acc: { [key: number]: string }, step: string) => {
      acc[Number(step)] = props.data.colors[Number(step)];
      return acc;
    },
  {})
}])

const includedColorsMap = computed(() => {
  const map = new Map<string, ColorStep[]>()
  map.set(props.data.name.toLowerCase(), includedColors.value)
  return map;
})
const menuRef = useTemplateRef('options-menu')
const configVersion = useLocalStorage(PREFERENCES_STORAGE_KEYS.version, 'v4')
const configFormat = useLocalStorage(PREFERENCES_STORAGE_KEYS.format, 'oklch')
const includeWrapper = useLocalStorage(PREFERENCES_STORAGE_KEYS.wrapper, false)
const { copy, copied: isCopied } = useClipboard()
const source = useSource(
  paletteForSource,
  computed(() => configVersion.value) as unknown as 'v3' | 'v4',
  computed(() => configFormat.value) as unknown as 'hex' | 'oklch',
  includedColorsMap,
  includeWrapper
)

const showMenu = ref(false)
const isEditing = ref(false)
const isAdvancedMode = ref(true) // Advanced mode enabled by default
const colorName = ref(props.data.name)
const editingAnchorStep = ref<number | null>(null)

function copySourceToClipboard() {
  copy(source.value)

  // Track copy event
  trackColorEvent('copy', {
    color_format: configFormat.value as 'hex' | 'oklch',
    config_version: configVersion.value as 'v3' | 'v4',
    shade_count: includedColors.value.length
  })
}

function movePalette(direction: -1 | 1) {
  showMenu.value = false
  emit('move', direction)
}

function deletePalette() {
  emit('delete', props.data)
}

function onMenuButtonClick() {
  if (isEditing.value) {
    stopEditing()
    return
  }

  showMenu.value = !showMenu.value;
}

function toggleIncludedColor(step: ColorStep) {
  if (includedColors.value.includes(step)) {
    includedColors.value = includedColors.value.filter(s => s !== step);
  } else {
    includedColors.value.push(step);
  }

  // Track shade toggle
  trackInteraction('toggle_shade', 'click')
}

function stopEditing(evt?: Event) {
  const nameChanged = colorName.value !== props.data.name

  if (evt && evt.target) {
    const target = evt.target as HTMLInputElement;
    if (colorName.value.trim() !== '' && colorName.value !== props.data.name) {
      colorName.value = target.value
    }
  }
  emit('update', { includedColors: includedColors.value, name: colorName.value })
  isEditing.value = false;

  // Track palette rename
  if (nameChanged) {
    trackInteraction('rename_palette', 'click')
  }
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

function toggleAnchor(step: ColorStep) {
  if (anchors.value[step]) {
    // Prevent removing the last anchor
    const anchorCount = Object.keys(anchors.value).length;
    if (anchorCount === 1) {
      return; // Don't allow removing the last anchor
    }

    // Remove anchor
    const newAnchors = { ...anchors.value };
    delete newAnchors[step];
    saveOriginalVersion();
    anchors.value = newAnchors;
    emit('updateAnchors', anchors.value);
  } else {
    // Open color picker to set anchor
    editingAnchorStep.value = step;
  }

  // Track anchor toggle
  trackInteraction('toggle_anchor', 'click')
}

function onColorPickerApply(color: string) {
  if (editingAnchorStep.value !== null) {
    saveOriginalVersion();
    anchors.value = {
      ...anchors.value,
      [editingAnchorStep.value]: color
    };

    emit('updateAnchors', anchors.value);

    // Track anchor color change
    trackColorEvent('change_anchor', {
      color_value: color,
      config_version: configVersion.value as 'v3' | 'v4',
      color_format: configFormat.value as 'hex' | 'oklch'
    })
  }

  editingAnchorStep.value = null;
}

function onColorPickerCancel() {
  editingAnchorStep.value = null;
}

onClickOutside(menuRef, () => {
  showMenu.value = false;
})
</script>

<template>
<div tabindex="0"
  class="bg-white/0 group transition border border-transparent hocus:border-black/10 dark:hocus:border-white/10 rounded-xl p-2 w-full grid palette-grid gap-1 md:gap-4 items-center"
  :aria-label="`Color palette form ${props.data.name}`">
  <!-- Mobile: Color name on left side of first row -->
  <div class="md:hidden col-span-10 text-xs flex items-center justify-start uppercase">
    <template v-if="isEditing">
      <input
        :value="colorName"
        @keyup.enter="stopEditing"
        @keyup.esc="isEditing = false; colorName = props.data.name"
        class="bg-white outline-none text-black rounded px-1 py-0.5 text-xs uppercase w-full"
        type="text"
        autofocus />
    </template>
    <template v-else>
      {{ colorName }}
    </template>
    <div v-if="!isEditing" class="flex ml-2 flex-row items-center text-gray-400 dark:text-gray-500">
        <button class="rounded hocus:text-black dark:hocus:text-white disabled:opacity-30 disabled:pointer-events-none"
          :disabled="versions.length >= MAX_VERSIONS"
          aria-label="Save this version to compare" title="Save this version to compare" @click="saveVersion()">
          <IconBookmarkPlus class="size-4" />
        </button>
        <button v-if="versions.length" class="rounded hocus:text-black dark:hocus:text-white"
          :aria-pressed="showVersions"
          :aria-label="showVersions ? 'Hide saved versions' : 'Show saved versions'"
          :title="showVersions ? 'Hide saved versions' : 'Show saved versions'" @click="showVersions = !showVersions">
          <component :is="showVersions ? IconEye : IconEyeOff" class="size-4" />
        </button>
        <button class="rounded hocus:text-black dark:hocus:text-white disabled:opacity-30 disabled:pointer-events-none"
          :disabled="props.isFirst" aria-label="Move palette up" title="Move up" @click="movePalette(-1)">
          <IconChevronUp class="size-4" />
        </button>
        <button class="rounded hocus:text-black dark:hocus:text-white disabled:opacity-30 disabled:pointer-events-none"
          :disabled="props.isLast" aria-label="Move palette down" title="Move down" @click="movePalette(1)">
          <IconChevronDown class="size-4" />
        </button>
      </div>
  </div>
  <!-- Desktop: Color name -->
  <div class="hidden md:flex md:col-span-2 text-xs items-center justify-start uppercase">
    <template v-if="isEditing">
      <input
        :value="colorName"
        @keyup.enter="stopEditing"
        @keyup.esc="isEditing = false; colorName = props.data.name"
        class="bg-white outline-none text-black rounded px-1 py-0.5 text-xs uppercase w-full"
        type="text"
        autofocus />
    </template>
    <template v-else>
      <span class="flex-1">{{ colorName }}</span>
    </template>
    <div v-if="!isEditing" class="flex flex-col items-center text-gray-400 dark:text-gray-500">
        <button class="rounded hocus:text-black dark:hocus:text-white disabled:opacity-30 disabled:pointer-events-none"
          :disabled="versions.length >= MAX_VERSIONS"
          aria-label="Save this version to compare" title="Save this version to compare" @click="saveVersion()">
          <IconBookmarkPlus class="size-4" />
        </button>
        <button v-if="versions.length" class="rounded hocus:text-black dark:hocus:text-white"
          :aria-pressed="showVersions"
          :aria-label="showVersions ? 'Hide saved versions' : 'Show saved versions'"
          :title="showVersions ? 'Hide saved versions' : 'Show saved versions'" @click="showVersions = !showVersions">
          <component :is="showVersions ? IconEye : IconEyeOff" class="size-4" />
        </button>
        <button class="rounded hocus:text-black dark:hocus:text-white disabled:opacity-30 disabled:pointer-events-none"
          :disabled="props.isFirst" aria-label="Move palette up" title="Move up" @click="movePalette(-1)">
          <IconChevronUp class="size-4" />
        </button>
        <button class="rounded hocus:text-black dark:hocus:text-white disabled:opacity-30 disabled:pointer-events-none"
          :disabled="props.isLast" aria-label="Move palette down" title="Move down" @click="movePalette(1)">
          <IconChevronDown class="size-4" />
        </button>
      </div>
  </div>
  <!-- Mobile: Menu button on right side of first row -->
  <div class="md:hidden relative col-span-1 justify-self-end">
    <button class="rounded relative top-1"
      :class="{ 'bg-gray-500': showMenu }"
      @click="onMenuButtonClick">
      <template v-if="!isEditing">
        <IconMenu />
      </template>
      <template v-else>
        <IconCheckAll class="text-green-500 hocus:text-white hocus:bg-green-800 p-1 rounded-full size-6" />
      </template>
    </button>
    <div v-if="showMenu" ref="options-menu"
      class="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10">
      <button class="text-xs block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        @click="isEditing = true; showMenu = false">
        Edit
      </button>
      <button class="text-xs block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        @click="copySourceToClipboard();">
        {{ isCopied ? 'Copied!' : 'Copy source' }}
      </button>
      <button class="text-xs block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        @click="deletePalette();">
        Delete
      </button>
    </div>
  </div>
  <!-- Color shades -->
  <Tooltip v-for="step in COLOR_STEPS" :key="step" :text="props.data.colors[step]" position="top">
    <div
      class="flex-1 aspect-square border border-transparent relative group/shade"
      :class="showVersions && versions.length ? 'rounded-t-sm md:rounded-t-xl' : 'rounded-sm md:rounded-xl'"
      :style="includedColors.includes(step)
        ? `background-color: ${props.data.colors[step]}`
        : `background-color: transparent; border-color: ${props.data.colors[step]}`">
      <!-- Edit mode: Toggle include/exclude -->
      <button v-if="isEditing"
        class="absolute inset-0 rounded-xl flex items-center justify-center"
        @click="toggleIncludedColor(step)">
        <IconCheck v-if="includedColors.includes(step)" />
      </button>
      <!-- Advanced mode: Pin icon (Desktop only) -->
      <div v-if="isAdvancedMode && !isEditing" class="hidden md:flex absolute inset-0 flex-col items-center justify-center">
        <button
          class="p-1 rounded-full transition-all"
          :class="[
            anchors[step]
              ? Object.keys(anchors).length === 1
                ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-black/40 ring-1 ring-white/70 shadow-sm text-white opacity-0 group-hover/shade:opacity-100'
          ]"
          @click="toggleAnchor(step)"
          :title="anchors[step]
            ? Object.keys(anchors).length === 1
              ? 'Cannot remove the last anchor. Add another anchor first.'
              : 'Remove anchor'
            : 'Set as anchor color'">
          <IconPin v-if="anchors[step]" class="size-4" />
          <IconPinOutline v-else class="size-4 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
        </button>
      </div>
    </div>
  </Tooltip>
  <!-- Desktop: Menu button -->
  <div class="hidden md:block relative">
    <button class="rounded relative top-1"
      :class="{ 'bg-gray-500': showMenu }"
      @click="onMenuButtonClick">
      <template v-if="!isEditing">
        <IconMenu />
      </template>
      <template v-else>
        <IconCheckAll class="text-green-500 hocus:text-white hocus:bg-green-800 p-1 rounded-full size-6" />
      </template>
    </button>
    <div v-if="showMenu" ref="options-menu"
      class="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10">
      <button class="text-xs block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        @click="isEditing = true; showMenu = false">
        Edit
      </button>
      <button class="text-xs block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        @click="copySourceToClipboard();">
        {{ isCopied ? 'Copied!' : 'Copy source' }}
      </button>
      <button class="text-xs block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        @click="deletePalette();">
        Delete
      </button>
    </div>
  </div>

  <!-- Saved versions to compare with the current palette -->
  <template v-if="showVersions">
    <template v-for="(version, index) in versions" :key="version.id">
      <div class="col-span-11 md:col-span-2 -mt-1 md:-mt-4 flex items-center justify-between text-xs uppercase text-gray-500 dark:text-gray-400">
        <span class="truncate">{{ version.label }}</span>
        <div class="flex items-center gap-1">
          <button class="rounded hocus:text-black dark:hocus:text-white"
            :aria-label="`Use ${version.label}`" :title="`Use ${version.label}`" @click="restoreVersion(version)">
            <IconRestore class="size-4" />
          </button>
          <button class="rounded hocus:text-black dark:hocus:text-white"
            :aria-label="`Remove ${version.label}`" :title="`Remove ${version.label}`" @click="removeVersion(version)">
            <IconClose class="size-4" />
          </button>
        </div>
      </div>
      <div v-for="step in COLOR_STEPS" :key="`${version.id}-${step}`"
        class="h-5 -mt-1 md:-mt-4"
        :class="index === versions.length - 1 ? 'rounded-b-sm md:rounded-b-xl' : ''"
        :style="`background-color: ${version.colors[step]}`"
        :title="version.colors[step]"></div>
    </template>
  </template>

  <!-- Color Picker Popup -->
  <Teleport to="#modals">
    <ColorPickerPopup
      v-if="editingAnchorStep !== null"
      :initial-color="anchors[editingAnchorStep] || props.data.colors[editingAnchorStep]"
      :title="`Custom color for ${props.data.name} ${editingAnchorStep}`"
      @apply="onColorPickerApply"
      @cancel="onColorPickerCancel"
    />
  </Teleport>
</div>
</template>

<style>
.palette-grid {
  grid-template-columns: repeat(11, minmax(0, 1fr));
}

@media (min-width: theme('screens.md')) {
  .palette-grid {
    grid-template-columns: repeat(13, minmax(0, 1fr)) 24px;
  }
}
</style>
