<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onClickOutside, useEventListener } from '@vueuse/core'
import { formatCss, formatHex, parse, type Color } from 'culori'
import IconArrowRight from '~icons/mdi/arrow-right'
import ColorPickerPopup from './ColorPickerPopup.vue'
import { track, type ColorSource } from '@/services/analytics'

const props = withDefaults(defineProps<{
  size?: 'md' | 'lg'
}>(), {
  size: 'md'
})

const emit = defineEmits<{
  (e: 'change', color: string, source: ColorSource): void
}>()

const draft = ref('')
const isOpen = ref(false)
const hasError = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function parseInput(raw: string): Color | undefined {
  const value = raw.trim()
  if (!value) {
    return undefined
  }

  // Accept hex without the leading #
  return parse(value) ?? (/^[0-9a-f]{3,8}$/i.test(value) ? parse(`#${value}`) : undefined)
}

const parsed = computed(() => parseInput(draft.value))
const swatchColor = computed(() => (parsed.value ? formatCss(parsed.value) : ''))
const isLarge = computed(() => props.size === 'lg')

function normalize(color: Color): string {
  return color.mode === 'rgb' ? formatHex(color) : formatCss(color)
}

function emitColor(color: string, source: ColorSource) {
  emit('change', color, source)
  draft.value = ''
  isOpen.value = false
  hasError.value = false
}

function submit() {
  if (!draft.value.trim()) {
    isOpen.value = !isOpen.value
    return
  }

  if (!parsed.value) {
    hasError.value = true
    track('color_input_invalid', { input: draft.value.trim().slice(0, 20) })
    return
  }

  emitColor(normalize(parsed.value), 'typed')
}

watch(draft, () => {
  hasError.value = false
})

onClickOutside(rootRef, () => {
  isOpen.value = false
})

useEventListener(document, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
})
</script>

<template>
  <div ref="rootRef" class="relative w-full">
    <form class="flex items-center gap-2 rounded-full border bg-panel pr-1.5 pl-2 transition focus-within:ring-4 focus-within:ring-ink/10"
      :class="[
        isLarge ? 'h-14 shadow-[var(--shadow-card)]' : 'h-10',
        hasError ? 'border-red-500 focus-within:ring-red-500/15' : 'border-line-strong focus-within:border-ink/40'
      ]"
      @submit.prevent="submit">
      <button type="button" class="shrink-0 rounded-full ring-1 ring-line-strong transition hover:scale-105"
        :class="isLarge ? 'size-9' : 'size-6'"
        :style="{ background: swatchColor || 'conic-gradient(from 90deg, #f43f5e, #f59e0b, #10b981, #0ea5e9, #8b5cf6, #f43f5e)' }"
        aria-label="Open the color picker" :aria-expanded="isOpen" @click="isOpen = !isOpen"></button>

      <input v-model="draft" type="text" spellcheck="false" autocomplete="off" aria-label="Color value"
        :aria-invalid="hasError"
        class="min-w-0 flex-1 bg-transparent px-1 outline-none placeholder:text-faint"
        :class="isLarge ? 'text-base sm:text-lg' : 'text-sm'"
        :placeholder="isLarge ? 'Paste a color, e.g. #6366f1' : 'Add a color: #hex, oklch, name'" />

      <button type="submit" class="button button-primary shrink-0" :class="isLarge ? 'h-11 px-3.5 sm:px-5' : 'button-sm size-7 px-0'"
        :aria-label="draft ? 'Generate palette' : 'Open the color picker'">
        <span v-if="isLarge" class="max-sm:hidden">Generate</span>
        <IconArrowRight :class="isLarge ? 'size-5' : 'size-4'" />
      </button>
    </form>

    <p v-if="hasError" role="alert" class="absolute top-full left-5 mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      Couldn't read that color. Try a hex like #6366f1, rgb(), oklch() or a color name.
    </p>

    <div v-if="isOpen" class="animate-pop card absolute top-full left-1/2 z-40 mt-2 -translate-x-1/2 shadow-[var(--shadow-pop)]">
      <ColorPickerPopup :initial-color="swatchColor" @apply="emitColor($event, 'picker')" @cancel="isOpen = false" />
    </div>
  </div>
</template>
