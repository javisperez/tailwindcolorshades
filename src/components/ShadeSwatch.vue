<script setup lang="ts">
import { computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import IconCheck from '~icons/mdi/check'
import IconPin from '~icons/mdi/pin'
import IconPinOutline from '~icons/mdi/pin-outline'
import { formatRatio, shadeContrast } from '@/services/contrast'
import { formatColorValue, shortColorLabel, type ColorFormat } from '@/services/format'
import { trackInteraction } from '@/services/analytics'

const props = defineProps<{
  name: string
  step: number
  color: string
  format: ColorFormat
  included: boolean
  editing: boolean
  isAnchor: boolean
  showContrast: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-include'): void
  (e: 'edit-anchor'): void
}>()

const { copy, copied } = useClipboard({ copiedDuring: 1400 })

const contrast = computed(() => shadeContrast(props.color))

// Text drawn on top of the swatch: whichever of white / black is easier to read
const textColor = computed(() => {
  if (!props.included) {
    return 'var(--ink)'
  }

  return contrast.value.best === 'white' ? '#ffffff' : '#000000'
})

const levelLabel = computed(() => {
  const level = contrast.value.bestLevel
  return level === 'AA Large' ? 'AA Lg' : level
})

const valueLines = computed(() => shortColorLabel(props.color, props.format).split(' '))

const tooltip = computed(() => {
  const { white, black, whiteLevel, blackLevel } = contrast.value
  return [
    `${props.name}-${props.step}`,
    `White text ${formatRatio(white)} (${whiteLevel})`,
    `Black text ${formatRatio(black)} (${blackLevel})`
  ].join('\n')
})

function onClick() {
  if (props.editing) {
    emit('toggle-include')
    return
  }

  copy(formatColorValue(props.color, props.format))
  trackInteraction('copy_shade')
}

const pinTitle = computed(() => props.isAnchor ? 'Edit or remove this anchor color' : 'Pin this shade as an anchor color')
</script>

<template>
  <div class="group/shade relative h-[4.5rem] rounded-xl transition-transform duration-150 hover:-translate-y-0.5 sm:h-24 lg:h-[6.5rem]"
    :class="included ? 'ring-1 ring-black/10 ring-inset dark:ring-white/10' : 'border-2 border-dashed'"
    :style="included ? { backgroundColor: color } : { borderColor: color }">
    <button type="button" class="absolute inset-0 flex flex-col justify-between rounded-[inherit] p-1.5 text-left sm:p-2.5"
      :style="{ color: textColor }" :title="tooltip"
      :aria-label="editing
        ? `${included ? 'Exclude' : 'Include'} ${name} ${step} in the export`
        : `Copy ${name} ${step}, ${shortColorLabel(color, format)}`"
      @click="onClick">
      <span class="flex items-center justify-between">
        <span class="text-[11px] leading-none font-bold">{{ step }}</span>
        <IconCheck v-if="editing && included" class="size-4" />
      </span>

      <span class="relative block min-h-4 w-full">
        <!-- Resting state: WCAG badge -->
        <span class="absolute bottom-0 left-0 rounded px-1 py-0.5 text-[9px] leading-none font-bold transition-opacity sm:text-[10px]"
          :class="copied || editing || !showContrast ? 'opacity-0' : 'group-hover/shade:opacity-0 group-has-focus-visible/shade:opacity-0'"
          :style="{ backgroundColor: `color-mix(in srgb, ${textColor} 18%, transparent)` }">
          {{ levelLabel }}
        </span>

        <!-- Hover / focus / copied state: the value -->
        <span class="absolute bottom-0 left-0 font-mono text-[10px] leading-tight font-medium transition-opacity"
          :class="copied ? 'opacity-100' : (editing ? 'opacity-0' : 'opacity-0 group-hover/shade:opacity-100 group-has-focus-visible/shade:opacity-100')">
          <template v-if="copied">Copied!</template>
          <template v-else>
            <span v-for="line in valueLines" :key="line" class="block">{{ line }}</span>
          </template>
        </span>
      </span>
    </button>

    <button v-if="!editing" type="button" :aria-pressed="isAnchor" :title="pinTitle" :aria-label="pinTitle"
      class="absolute top-1.5 right-1.5 hidden size-6 place-items-center rounded-full transition md:grid"
      :class="isAnchor ? 'opacity-100' : 'opacity-0 group-hover/shade:opacity-100 focus-visible:opacity-100'"
      :style="{ color: textColor, backgroundColor: `color-mix(in srgb, ${textColor} ${isAnchor ? 28 : 16}%, transparent)` }"
      @click.stop="emit('edit-anchor')">
      <IconPin v-if="isAnchor" class="size-3.5" />
      <IconPinOutline v-else class="size-3.5" />
    </button>
  </div>
</template>
