import { effectScope, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { PREFERENCES_STORAGE_KEYS } from '@/constants'
import { trackOption } from '@/services/analytics'
import type { ColorFormat } from '@/services/format'

type ConfigVersion = 'v3' | 'v4'
type Theme = 'light' | 'dark'

function createPreferences() {
  const systemTheme: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  const version = useLocalStorage<ConfigVersion>(PREFERENCES_STORAGE_KEYS.version, 'v4')
  const format = useLocalStorage<ColorFormat>(PREFERENCES_STORAGE_KEYS.format, 'oklch')
  const wrapper = useLocalStorage(PREFERENCES_STORAGE_KEYS.wrapper, false)
  const theme = useLocalStorage<Theme>(PREFERENCES_STORAGE_KEYS.theme, systemTheme)
  // Both extras start hidden so the palettes stay the focus
  const preview = useLocalStorage(PREFERENCES_STORAGE_KEYS.preview, false)
  const contrast = useLocalStorage(PREFERENCES_STORAGE_KEYS.contrast, false)

  // Track every preference change once, wherever it is changed from
  watch(version, (value) => trackOption('change', { setting_name: 'config_version', setting_value: value }))
  watch(format, (value) => trackOption('change', { setting_name: 'color_format', setting_value: value }))
  watch(wrapper, (value) => trackOption('change', { setting_name: 'include_wrapper', setting_value: String(value) }))
  watch(theme, (value) => trackOption('change', { setting_name: 'theme', setting_value: value }))

  watch(preview, (value) => trackOption('change', { setting_name: 'show_preview', setting_value: String(value) }))
  watch(contrast, (value) => trackOption('change', { setting_name: 'show_contrast', setting_value: String(value) }))

  return { version, format, wrapper, theme, preview, contrast }
}

let instance: ReturnType<typeof createPreferences> | null = null

// App-wide user preferences, persisted in localStorage and shared between all components.
export function usePreferences() {
  if (!instance) {
    // Detached scope so the watchers outlive whichever component asked first
    instance = effectScope(true).run(createPreferences)!
  }

  return instance
}
