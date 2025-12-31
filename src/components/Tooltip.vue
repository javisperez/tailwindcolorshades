<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTooltipState } from '@/composables/tooltipState'

const props = withDefaults(defineProps<{
  text: string
  delay?: number
  position?: 'top' | 'bottom' | 'left' | 'right'
}>(), {
  delay: 2000,
  position: 'top'
})

const { isAnyTooltipVisible, resetTooltipState, clearGlobalStateTimeout } = useTooltipState()
const isVisible = ref(false)
let showTimeoutId: number | null = null

function showTooltip() {
  // Clear any pending global state timer
 clearGlobalStateTimeout()

  // If any tooltip is already visible, show immediately
  if (isAnyTooltipVisible.value) {
    isVisible.value = true
  } else {
    // Otherwise, wait for the delay
    showTimeoutId = setTimeout(() => {
      isVisible.value = true
      isAnyTooltipVisible.value = true
    }, props.delay)
  }
}

function hideTooltip() {
  // Clear any pending show timeout
  if (showTimeoutId !== null) {
    clearTimeout(showTimeoutId)
    showTimeoutId = null
  }

  // Hide immediately
  isVisible.value = false

  // Longer delay before resetting global state to allow moving between tooltips
  resetTooltipState()
}

const positionClasses = computed(() => {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }
  return positions[props.position]
})

const arrowClasses = computed(() => {
  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-100',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900 dark:border-b-gray-100',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900 dark:border-l-gray-100',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900 dark:border-r-gray-100'
  }
  return arrows[props.position]
})
</script>

<template>
  <div class="relative inline-block" @mouseenter="showTooltip" @mouseleave="hideTooltip">
    <slot />
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div
        v-if="isVisible"
        :class="[positionClasses, 'absolute z-50 pointer-events-none']">
        <div class="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap font-mono">
          {{ text }}
        </div>
        <div :class="[arrowClasses, 'absolute w-0 h-0 border-4']"></div>
      </div>
    </transition>
  </div>
</template>
