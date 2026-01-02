<script setup lang="ts">
import { COLOR_STEPS, PREFERENCES_STORAGE_KEYS } from '@/constants';
import useSource from '@/composables/source';
import { useClipboard, useLocalStorage, onClickOutside } from '@vueuse/core';
import IconMenu from '~icons/mdi/dots-vertical'
import IconCheck from '~icons/mdi/check'
import IconCheckAll from '~icons/mdi/check-all'
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
  data: Palette
}>()

const emit = defineEmits<{
  (e: 'delete', palette: Palette): void,
  (e: 'rename', name: string): void,
  (e: 'update', data: { includedColors: ColorStep[], name: string }): void,
  (e: 'updateAnchors', anchors: Record<number, string>): void,
  (e: 'regenerate', anchors: Record<number, string>): void
}>()

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
const { copy, copied: isCopied } = useClipboard()
const source = useSource(
  paletteForSource,
  computed(() => configVersion.value) as unknown as 'v3' | 'v4',
  computed(() => configFormat.value) as unknown as 'hex' | 'oklch',
  includedColorsMap
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
      {{ colorName }}
    </template>
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
      class="flex-1 aspect-square rounded-sm md:rounded-xl border border-transparent relative group/shade"
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
              : 'bg-black/20 dark:bg-white/20 text-white opacity-0 group-hover/shade:opacity-100'
          ]"
          @click="toggleAnchor(step)"
          :title="anchors[step]
            ? Object.keys(anchors).length === 1
              ? 'Cannot remove the last anchor. Add another anchor first.'
              : 'Remove anchor'
            : 'Set as anchor color'">
          <IconPin v-if="anchors[step]" class="size-4" />
          <IconPinOutline v-else class="size-4" />
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
