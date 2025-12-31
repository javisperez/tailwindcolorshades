<script setup lang="ts">
import { ref, computed, watch, nextTick, useTemplateRef } from 'vue'
import { useElementBounding, useDebounceFn, useThrottleFn, useEventListener } from '@vueuse/core'
import { parse, formatHex as toRgbHex, converter } from 'culori'
import IconRemove from '~icons/mdi/minus'
import IconAdd from '~icons/mdi/plus'
import IconRightArrow from '~icons/mdi/arrow-right'
import IconClose from '~icons/mdi/close'
import vPress from '@/directives/vPress'
import { trackInteraction } from '@/services/analytics'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'change', color: string): void
}>()

const toOklch = converter('oklch')

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const isMouseDown = ref(false)

const l = ref(0.5)
const c = ref(0.2)
const h = ref(180)
const hexInput = ref('')
const oklchString = ref('')
const pointerPosition = ref({ x: 143, y: 86 })

const canvasRef = useTemplateRef<HTMLCanvasElement | null>('canvas')
const canvasBoundaries = useElementBounding(canvasRef)

const updateFromHex = useDebounceFn(() => updateAllFromColor(hexInput.value), 450)

useEventListener(document, 'click', handleClickOutside)
useEventListener(document, 'mouseup', () => {
  isMouseDown.value = false
})

const colorHex = computed(() =>
  toRgbHex({ mode: 'oklch', l: l.value, c: c.value, h: h.value })
)

function updateAllFromColor(inputColor: string) {
  const parsed = parse(inputColor)
  if (!parsed) {
    return
  }

  const oklch = toOklch(parsed)
  if (!oklch) {
    return
  }

  l.value = oklch.l ?? 0.5
  c.value = oklch.c ?? 0.2
  h.value = oklch.h ?? 180

  hexInput.value = toRgbHex(oklch)
  oklchString.value = `oklch(${l.value.toFixed(2)} ${c.value.toFixed(2)} ${Math.round(h.value)})`
}

// function updateFromOklch() {
//   const match = oklchString.value.match(/oklch\(([^)]+)\)/)
//   if (!match) {
//     return
//   }
//   const [lVal, cVal, hVal] = match[1].split(' ').map(Number)
//   if (isNaN(lVal) || isNaN(cVal) || isNaN(hVal)) {
//     return
//   }
//   l.value = lVal
//   c.value = cVal
//   h.value = hVal
//   hexInput.value = toRgbHex({ mode: 'oklch', l: l.value, c: c.value, h: h.value })
// }

// Click Outside
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

function renderCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  const imgData = ctx.createImageData(width, height)

  // Fill canvas with color gradients
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const lightness = 1 - y / height // Map y to lightness (1 = light, 0 = dark)
      const hue = (x / width) * 360 // Map x to hue (0 = red, 360 = red)
      const color = toRgbHex({ mode: 'oklch', l: lightness, c: c.value, h: hue })
      const parsed = parse(color)
      const i = (y * width + x) * 4

      if (parsed && 'r' in parsed && 'g' in parsed && 'b' in parsed) {
        imgData.data[i + 0] = parsed.r * 255
        imgData.data[i + 1] = parsed.g * 255
        imgData.data[i + 2] = parsed.b * 255
        imgData.data[i + 3] = 255
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
}

const onCanvasMouseMove = useThrottleFn((event: MouseEvent) => {
  if (isMouseDown.value) {
    handleCanvasClick(event)
  }
}, 16)

function handleCanvasClick(event: MouseEvent) {
  if (!canvasBoundaries || !canvasRef.value) {
    return
  }

  // Calculate the mouse position relative to the canvas considering its position on the screen
  const x = event.clientX - canvasBoundaries.left.value
  const y = event.clientY - canvasBoundaries.top.value

  // Ensure that we map the mouse position within the bounds of the canvas
  const newHue = Math.min(Math.max((x / canvasBoundaries.width.value) * 360, 0), 360) // Hue based on x position
  const newL = Math.min(Math.max(1 - (y / canvasBoundaries.height.value), 0), 1) // Lightness based on y position

  // Update the hue and lightness values
  h.value = newHue
  l.value = newL

  // Update the pointer position for the UI
  pointerPosition.value = { x, y }

  // Update the color in hex and oklch string formats
  hexInput.value = colorHex.value
  oklchString.value = `oklch(${l.value.toFixed(2)} ${c.value.toFixed(2)} ${Math.round(h.value)})`
}

// Update sliders from color picker
function updateFromSlider () {
  hexInput.value = colorHex.value
  oklchString.value = `oklch(${l.value.toFixed(2)} ${c.value.toFixed(2)} ${Math.round(h.value)})`

  pointerPosition.value = {
    x: (h.value / 360) * canvasBoundaries.width.value,
    y: (1 - l.value) * canvasBoundaries.height.value
  }
}

async function openDropdown () {
  isOpen.value = true
  await nextTick()
  renderCanvas()

  // Track color picker opening
  trackInteraction('color_picker_open', 'click')
}

async function resetStates () {
  l.value = 0.5
  c.value = 0.2
  h.value = 180
  await nextTick()
  oklchString.value = ''
  hexInput.value = ''
  pointerPosition.value = {
    x: canvasBoundaries.width.value / 2,
    y: canvasBoundaries.height.value / 2,
  }
  isOpen.value = false
}

async function onColorSelection () {
  emit('change', oklchString.value)
  resetStates()

  // Track color selection from picker
  trackInteraction('color_picker_apply', 'click')
}

function updateValue(callback: () => void) {
  return () => {
    callback()
    updateFromSlider()
  }
}

watch([l, c, h], () => {
  hexInput.value = colorHex.value
  oklchString.value = `oklch(${l.value.toFixed(2)} ${c.value.toFixed(2)} ${Math.round(h.value)})`
  renderCanvas()
})

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    updateAllFromColor(newValue)
  } else {
    resetStates()
  }
}, { immediate: true })
</script>

<template>
  <div class="relative w-full max-w-xs group"
    :class="{ 'is-open': isOpen }"
    ref="dropdownRef">
    <!-- Button -->
    <div class="relative z-10 flex items-center border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-slate-800 text-sm group-[.is-open]:!border-gray-300 dark:group-[.is-open]:!border-gray-400 focus-within:border-gray-300 dark:focus-within:border-gray-400">
      <div class="inline-block size-6 shrink-0 grow-0 rounded-full mr-2 relative left-2 border border-gray-200 dark:border-gray-600 transition-color duration-150"
        :style="{ backgroundColor: oklchString }"></div>
      <input type="text"
        class="flex-1 appearance-none p-0 bg-transparent border-none px-1 focus:outline-none focus:ring-0"
        placeholder="Add a color"
        :value="oklchString"
        @input="(e) => { updateAllFromColor((e.target as HTMLInputElement).value); updateFromSlider(); }"
        @focus="openDropdown()"
        @keyup.esc="isOpen = false">

      <button type="button" :disabled="!oklchString" class="rounded-2xl disabled:opacity-0 text-green-500 hover:text-green-600 py-1 px-1.5 relative right-1"
        @click="onColorSelection">
        <IconRightArrow class="w-6 h-6" />
      </button>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen"
      class="absolute top-10 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-300 dark:border-gray-600 z-10">
      <div class="flex justify-between items-center gap-10 mb-4">
        <input class="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          v-model="hexInput"
          @input="updateFromHex"
          placeholder="#hex" />

        <button class="dark:text-gray-200 dark:hocus:text-gray-400"
          @click="isOpen = false">
          <IconClose />
        </button>
      </div>
      <div class="relative">
        <canvas
          ref="canvas"
          width="200"
          height="120"
          class="w-full h-40 rounded-xl mb-6 cursor-crosshair"
          @mousedown="isMouseDown = true"
          @mouseup="isMouseDown = false"
          @mousemove="onCanvasMouseMove"
          @click="handleCanvasClick"></canvas>
        <div class="absolute top-0 left-0 rounded-full shadow border border-white size-4 pointer-events-none"
          :style="`transform: translate(${pointerPosition.x-8}px, ${pointerPosition.y-8}px); background-color: ${oklchString}`"></div>
      </div>
      <div class="space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-400">
            <label for="hue">Hue</label>
            <span>{{ Math.round(h) }}/360</span>
          </div>
          <div class="relative flex items-center">
            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 focus:outline-none"
              v-press="updateValue(() => h = Math.max(0, h - 1))">
              <IconRemove />
            </button>
            <input
              class="w-full mx-2 relative appearance-none bg-transparent hue-slider"
              :style="`--l:${l}; --c:${c}`"
              type="range"
              min="0"
              max="360"
              step="1"
              v-model.number="h"
              @input="updateFromSlider"
            />
            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 focus:outline-none"
              v-press="updateValue(() => h = Math.min(360, h + 1))">
              <IconAdd />
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-400">
            <label for="chroma">Chroma</label>
            <span>{{ c.toFixed(2) }}/0.4</span>
          </div>
          <div class="relative flex items-center">
            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 focus:outline-none"
              v-press="updateValue(() => c = Math.max(0, c - 0.01))">
              <IconRemove />
            </button>

            <input
              type="range"
              min="0"
              max="0.4"
              step="0.01"
              v-model.number="c"
              @input="updateFromSlider"
              class="w-full relative mx-2 appearance-none bg-transparent c-slider" />

            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 focus:outline-none"
              v-press="updateValue(() => c = Math.min(0.4, c + 0.01))">
              <IconAdd />
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-400">
            <label for="lightness">Lightness</label>
            <span>{{ l.toFixed(2) }}/1</span>
          </div>
          <div class="relative flex items-center">
            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 focus:outline-none"
              v-press="updateValue(() => l = Math.max(0, l - 0.01))">
              <IconRemove />
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="l"
              @input="updateFromSlider"
              class="w-full relative mx-2 appearance-none bg-transparent l-slider" />

            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 focus:outline-none"
              v-press="updateValue(() => l = Math.min(1, l + 0.01))">
              <IconAdd />
            </button>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">

        <button class="button bg-green-500 dark:text-white"
          @click="onColorSelection">Apply</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
input[type='range']::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 3px;
}
input[type='range']::-moz-range-track {
  height: 8px;
  border-radius: 3px;
}
input[type='range'].hue-slider::-webkit-slider-runnable-track {
  background: linear-gradient(to right,
    oklch(var(--l) var(--c) 0),
    oklch(var(--l) var(--c) 60),
    oklch(var(--l) var(--c) 120),
    oklch(var(--l) var(--c) 180),
    oklch(var(--l) var(--c) 240),
    oklch(var(--l) var(--c) 300),
    oklch(var(--l) var(--c) 360)
  );
}
input[type='range'].c-slider::-webkit-slider-runnable-track {
  height: 8px;
  background: linear-gradient(to right, #ccc, #00f);
}
input[type='range'].l-slider::-webkit-slider-runnable-track {
  height: 8px;
  background: linear-gradient(to right, #000, #fff);
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 9999px;
  background: white;
  border: 2px solid #ccc;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  cursor: pointer;
  margin-top: -6px;
}

input[type='range'].hue-slider::-moz-range-thumb,
input[type='range'].c-slider::-moz-range-thumb,
input[type='range'].l-slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 9999px;
  background: white;
  border: 2px solid #ccc;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  cursor: pointer;
}
</style>
