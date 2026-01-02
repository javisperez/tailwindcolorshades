<script setup lang="ts">
import { ref, computed, watch, nextTick, useTemplateRef, onMounted } from 'vue'
import { useElementBounding, useDebounceFn, useThrottleFn, useEventListener } from '@vueuse/core'
import { parse, formatHex as toRgbHex, converter } from 'culori'
import IconRemove from '~icons/mdi/minus'
import IconAdd from '~icons/mdi/plus'
import IconClose from '~icons/mdi/close'
import vPress from '@/directives/vPress'
import { trackInteraction } from '@/services/analytics'

const props = defineProps<{
  initialColor?: string
  position?: { x: number, y: number }
  title?: string
  inline?: boolean // When true, renders as dropdown instead of modal
}>()

const emit = defineEmits<{
  (e: 'apply', color: string): void
  (e: 'cancel'): void
}>()

const toOklch = converter('oklch')

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

function onApply() {
  emit('apply', oklchString.value)
  trackInteraction('color_picker_apply', 'click')
}

function onCancel() {
  emit('cancel')
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

onMounted(async () => {
  if (props.initialColor) {
    updateAllFromColor(props.initialColor)
  }
  await nextTick()
  renderCanvas()
  // Update pointer position after canvas is rendered and boundaries are calculated
  updateFromSlider()
})
</script>

<template>
  <!-- Modal Mode -->
  <div v-if="!inline" class="fixed inset-0 dark:bg-black/40 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-50"
    @click.self="onCancel">
    <div class="w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-300 dark:border-gray-600">
      <div v-if="title" class="mb-3">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ title }}</h3>
      </div>
      <div class="flex justify-between items-center gap-10 mb-4">
        <input class="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          v-model="hexInput"
          @input="updateFromHex"
          placeholder="#hex" />

        <button class="dark:text-gray-200 dark:hocus:text-gray-400"
          @click="onCancel">
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
            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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
            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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
            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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

            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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
            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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

            <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              v-press="updateValue(() => l = Math.min(1, l + 0.01))">
              <IconAdd />
            </button>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button class="button button-borderless px-4 py-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="onCancel">Cancel</button>
        <button class="button bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          @click="onApply">Apply</button>
      </div>
    </div>
  </div>

  <!-- Inline Mode (Dropdown) -->
  <div v-else class="w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-300 dark:border-gray-600">
    <div v-if="title" class="mb-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ title }}</h3>
    </div>
    <div class="flex justify-between items-center gap-10 mb-4">
      <input class="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="text"
        v-model="hexInput"
        @input="updateFromHex"
        placeholder="#hex" />

      <button class="dark:text-gray-200 dark:hocus:text-gray-400"
        @click="onCancel">
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
          <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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
          <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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
          <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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

          <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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
          <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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

          <button class="active:scale-85 active:text-blue-500 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            v-press="updateValue(() => l = Math.min(1, l + 0.01))">
            <IconAdd />
          </button>
        </div>
      </div>
    </div>
    <div class="mt-6 flex justify-end space-x-3">
      <button class="button bg-green-500 dark:text-white px-4 py-2 rounded hover:bg-green-600"
        @click="onApply">Apply</button>
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
