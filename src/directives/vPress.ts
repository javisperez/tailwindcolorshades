type PressBinding = () => void

interface HTMLElementWithPress extends HTMLElement {
  _vPressStop?: () => void
  _vPressStart?: () => void
}

// Naming is hard... :D, vPress might not be the best name...
// This is a directive to handle press-and-hold events.
export default {
  mounted(
    el: HTMLElementWithPress,
    binding: {
      value: PressBinding
      modifiers: Record<string, boolean>
    }
  ) {
    const handler = binding.value
    const { modifiers } = binding

    const isEndOnly = modifiers.end
    const interval = modifiers.fast
      ? 100
      : modifiers.slow
        ? 350
        : 200

    let intervalId: number | null = null
    let startTimeout: number | null = null

    const start = () => {
      if (isEndOnly) return
      handler()
      startTimeout = setTimeout(() => {
        intervalId = window.setInterval(handler, interval)
      }, interval * 2)
    }

    const stop = () => {
      if (startTimeout !== null) {
        clearTimeout(startTimeout)
        startTimeout = null
      }
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }

      if (isEndOnly) {
        handler()
      }
    }

    el.addEventListener('mousedown', start)
    window.addEventListener('mouseup', stop)
    el.addEventListener('mouseleave', stop)

    el._vPressStop = stop
    el._vPressStart = start
  },

  unmounted(el: HTMLElementWithPress) {
    el._vPressStop?.()
    // I feel like this clean up probably could be handled by the `@vueuse/core` package, but for now, this works.
    if (el._vPressStart) {
      el.removeEventListener('mousedown', el._vPressStart)
    }
    if (el._vPressStop) {
      el.removeEventListener('mouseleave', el._vPressStop)
      window.removeEventListener('mouseup', el._vPressStop)
    }
  },
}
