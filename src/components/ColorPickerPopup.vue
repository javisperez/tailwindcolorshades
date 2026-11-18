<script setup lang="ts">
import { reactive, ref, watch, onMounted, useTemplateRef } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { parse, formatHex, converter } from 'culori'
import IconRemove from '~icons/mdi/minus'
import IconAdd from '~icons/mdi/plus'
import IconClose from '~icons/mdi/close'
import vPress from '@/directives/vPress'
import { trackInteraction } from '@/services/analytics'

const props = defineProps<{
  initialColor?: string
  title?: string
  // Shows a button to remove the pin when editing an existing anchor
  removable?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply', color: string): void
  (e: 'cancel'): void
  (e: 'remove'): void
}>()

const toOklch = converter('oklch')
const toRgb = converter('rgb')

type Channel = 'h' | 'c' | 'l'

const values = reactive<Record<Channel, number>>({ l: 0.5, c: 0.2, h: 180 })
const hexInput = ref('')
const oklchString = ref('')
const isDragging = ref(false)

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')

const sliders: { key: Channel, label: string, min: number, max: number, step: number, format: (value: number) => string }[] = [
  { key: 'h', label: 'Hue', min: 0, max: 360, step: 1, format: (v) => `${Math.round(v)}°` },
  { key: 'c', label: 'Chroma', min: 0, max: 0.4, step: 0.01, format: (v) => v.toFixed(2) },
  { key: 'l', label: 'Lightness', min: 0, max: 1, step: 0.01, format: (v) => v.toFixed(2) }
]

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function syncStrings() {
  hexInput.value = formatHex({ mode: 'oklch', ...values })
  oklchString.value = `oklch(${values.l.toFixed(2)} ${values.c.toFixed(2)} ${Math.round(values.h)})`
}

function updateAllFromColor(inputColor: string) {
  const parsed = parse(inputColor)
  const oklch = parsed && toOklch(parsed)
  if (!oklch) {
    return
  }

  values.l = oklch.l ?? 0.5
  values.c = oklch.c ?? 0.2
  values.h = oklch.h ?? 180
}

const updateFromHex = useDebounceFn(() => updateAllFromColor(hexInput.value), 450)

// The canvas maps hue (x) and lightness (y) at the current chroma
function renderCanvas() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) {
    return
  }

  const { width, height } = canvas
  const image = ctx.createImageData(width, height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { r, g, b } = toRgb({ mode: 'oklch', l: 1 - y / height, c: values.c, h: (x / width) * 360 })
      const i = (y * width + x) * 4
      image.data[i] = clamp(r, 0, 1) * 255
      image.data[i + 1] = clamp(g, 0, 1) * 255
      image.data[i + 2] = clamp(b, 0, 1) * 255
      image.data[i + 3] = 255
    }
  }

  ctx.putImageData(image, 0, 0)
}

function pickFromPointer(event: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  values.h = clamp((event.clientX - rect.left) / rect.width, 0, 1) * 360
  values.l = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)
}

function onPointerDown(event: PointerEvent) {
  isDragging.value = true
  canvasRef.value?.setPointerCapture(event.pointerId)
  pickFromPointer(event)
}

function onPointerMove(event: PointerEvent) {
  if (isDragging.value) {
    pickFromPointer(event)
  }
}

function onPointerUp(event: PointerEvent) {
  isDragging.value = false
  canvasRef.value?.releasePointerCapture(event.pointerId)
}

function nudge(key: Channel, delta: number) {
  const slider = sliders.find((s) => s.key === key)!
  values[key] = clamp(Math.round((values[key] + delta) * 100) / 100, slider.min, slider.max)
}

function onApply() {
  emit('apply', oklchString.value)
  trackInteraction('color_picker_apply', 'click')
}

watch(values, syncStrings, { deep: true })
watch(() => values.c, renderCanvas)

onMounted(() => {
  if (props.initialColor) {
    updateAllFromColor(props.initialColor)
  }

  syncStrings()
  renderCanvas()
})
</script>

<template>
  <div class="w-80 max-w-full p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="truncate text-sm font-semibold">{{ title || 'Pick a color' }}</h3>
      <button type="button" class="icon-button -mr-1 size-7" aria-label="Close color picker" @click="emit('cancel')">
        <IconClose class="size-4" />
      </button>
    </div>

    <div class="mb-3 flex items-center gap-2">
      <span class="size-9 shrink-0 rounded-lg ring-1 ring-line-strong" :style="{ backgroundColor: oklchString }"></span>
      <input v-model="hexInput" class="field font-mono" type="text" placeholder="#hex" aria-label="Hex value" spellcheck="false"
        @input="updateFromHex" />
    </div>

    <div class="relative mb-5">
      <canvas ref="canvas" width="240" height="150"
        class="h-40 w-full cursor-crosshair touch-none rounded-xl ring-1 ring-line"
        @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp"></canvas>
      <div class="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_2px_6px_rgb(0_0_0/0.35)]"
        :style="{ left: `${(values.h / 360) * 100}%`, top: `${(1 - values.l) * 100}%`, backgroundColor: oklchString }"></div>
    </div>

    <div class="space-y-4">
      <div v-for="slider in sliders" :key="slider.key" class="space-y-1.5">
        <div class="flex items-center justify-between text-xs font-semibold text-muted">
          <label :for="`picker-${slider.key}`">{{ slider.label }}</label>
          <span class="font-mono text-ink">{{ slider.format(values[slider.key]) }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" class="icon-button size-6" :aria-label="`Decrease ${slider.label}`"
            v-press="() => nudge(slider.key, -slider.step)">
            <IconRemove class="size-4" />
          </button>
          <input :id="`picker-${slider.key}`" v-model.number="values[slider.key]" type="range" class="picker-range"
            :class="`range-${slider.key}`" :min="slider.min" :max="slider.max" :step="slider.step"
            :style="`--l:${values.l}; --c:${values.c}; --h:${values.h}`" />
          <button type="button" class="icon-button size-6" :aria-label="`Increase ${slider.label}`"
            v-press="() => nudge(slider.key, slider.step)">
            <IconAdd class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="mt-5 flex items-center justify-between gap-3">
      <code class="truncate text-[11px] text-faint">{{ oklchString }}</code>
      <div class="flex shrink-0 items-center gap-1">
        <button v-if="removable" type="button" class="button button-ghost button-sm" @click="emit('remove')">Remove pin</button>
        <button type="button" class="button button-primary button-sm px-5" @click="onApply">Apply</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-range {
  appearance: none;
  background: transparent;
  width: 100%;
  height: 20px;
  margin: 0;
}

.picker-range::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--line);
}

.picker-range::-moz-range-track {
  height: 8px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--line);
}

.range-h::-webkit-slider-runnable-track {
  background: linear-gradient(to right,
    oklch(var(--l) var(--c) 0), oklch(var(--l) var(--c) 60), oklch(var(--l) var(--c) 120),
    oklch(var(--l) var(--c) 180), oklch(var(--l) var(--c) 240), oklch(var(--l) var(--c) 300),
    oklch(var(--l) var(--c) 360));
}

.range-h::-moz-range-track {
  background: linear-gradient(to right,
    oklch(var(--l) var(--c) 0), oklch(var(--l) var(--c) 60), oklch(var(--l) var(--c) 120),
    oklch(var(--l) var(--c) 180), oklch(var(--l) var(--c) 240), oklch(var(--l) var(--c) 300),
    oklch(var(--l) var(--c) 360));
}

.range-c::-webkit-slider-runnable-track {
  background: linear-gradient(to right, oklch(var(--l) 0 var(--h)), oklch(var(--l) 0.4 var(--h)));
}

.range-c::-moz-range-track {
  background: linear-gradient(to right, oklch(var(--l) 0 var(--h)), oklch(var(--l) 0.4 var(--h)));
}

.range-l::-webkit-slider-runnable-track {
  background: linear-gradient(to right, oklch(0 var(--c) var(--h)), oklch(1 var(--c) var(--h)));
}

.range-l::-moz-range-track {
  background: linear-gradient(to right, oklch(0 var(--c) var(--h)), oklch(1 var(--c) var(--h)));
}

.picker-range::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  margin-top: -6px;
  border-radius: 999px;
  background: white;
  border: 2px solid rgb(0 0 0 / 0.2);
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.3);
  cursor: grab;
}

.picker-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: white;
  border: 2px solid rgb(0 0 0 / 0.2);
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.3);
  cursor: grab;
}
</style>
