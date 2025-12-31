<script setup lang="ts">
import { COLOR_STEPS, PREFERENCES_STORAGE_KEYS } from '@/constants';
import useSource from '@/composables/source';
import { useClipboard, useLocalStorage, onClickOutside } from '@vueuse/core';
import IconMenu from '~icons/mdi/dots-vertical'
import IconCheck from '~icons/mdi/check'
import IconCheckAll from '~icons/mdi/check-all'
import { ref, computed, useTemplateRef } from 'vue';
import Tooltip from './Tooltip.vue';
import { trackColorEvent, trackInteraction } from '@/services/analytics';

export type Palette = {
  name: string,
  colors: {
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
  (e: 'update', data: { includedColors: ColorStep[], name: string }): void
}>()

const includedColors = ref<ColorStep[]>(Object.keys(props.data.colors).map(s => parseInt(s)) as ColorStep[])
// Garbage collection should work fine here as long as we don't keep references to unused maps.
// Old maps should be GC'd if not referenced elsewhere.
const includedColorsMap = computed(() => {
  const map = new Map<string, ColorStep[]>()
  map.set(props.data.name, includedColors.value)
  return map;
})
const menuRef = useTemplateRef('options-menu')
const configVersion = useLocalStorage(PREFERENCES_STORAGE_KEYS.version, 'v4')
const configFormat = useLocalStorage(PREFERENCES_STORAGE_KEYS.format, 'oklch')
const { copy, copied: isCopied } = useClipboard()
const source = useSource([{
  name: props.data.name.toLowerCase(),
  colors: Object.keys(props.data.colors).reduce(
    (acc: { [key: number]: string }, step: string) => {
      acc[Number(step)] = props.data.colors[Number(step)];
      return acc;
    },
  {})
}], configVersion as any, configFormat as any, includedColorsMap)

const showMenu = ref(false)
const isEditing = ref(false)
const colorName = ref(props.data.name)

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

onClickOutside(menuRef, () => {
  showMenu.value = false;
})
</script>

<template>
<div tabindex="0"
  class="bg-white/0 group transition border border-transparent hocus:border-black/10 dark:hocus:border-white/10 rounded-xl p-2 w-full grid palette-grid items-center"
  :aria-label="`Color palette form ${props.data.name}`">
  <div class="col-span-2 text-xs flex items-center justify-start uppercase">
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
  <Tooltip v-for="step in COLOR_STEPS" :key="step" :text="props.data.colors[step]" position="top">
    <div
      class="flex-1 aspect-square rounded-xl border border-transparent relative"
      :style="includedColors.includes(step)
        ? `background-color: ${props.data.colors[step]}`
        : `background-color: transparent; border-color: ${props.data.colors[step]}`">
      <button v-if="isEditing"
        class="absolute inset-0 rounded-xl flex items-center justify-center"
        @click="toggleIncludedColor(step)">
        <IconCheck v-if="includedColors.includes(step)" />
      </button>
    </div>
  </Tooltip>
  <div class="relative">
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
      class="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10">
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
</div>
</template>

<style>
.palette-grid {
  grid-template-columns: repeat(13, minmax(0, 1fr)) 24px;
  gap: calc(4 * var(--spacing));
}
</style>
