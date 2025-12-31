import { ref } from 'vue'

// Shared state across all tooltip instances
const isAnyTooltipVisible = ref(false)
let globalStateTimeoutId: number | null = null

export function useTooltipState() {
  const resetTooltipState = () => {
    globalStateTimeoutId = setTimeout(() => {
      isAnyTooltipVisible.value = false
    }, 500)
  }

  const clearGlobalStateTimeout = () => {
    if (globalStateTimeoutId) {
      clearTimeout(globalStateTimeoutId)
      globalStateTimeoutId = null
    }
  }

  return {
    isAnyTooltipVisible,
    globalStateTimeoutId,
    resetTooltipState,
    clearGlobalStateTimeout
  }
}
