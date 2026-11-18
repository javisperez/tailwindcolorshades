export const COLOR_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export const PREFERENCES_STORAGE_KEYS = {
  version: 'twcs-preference-config-version',
  format: 'twcs-preference-color-format',
  theme: 'twcs-preference-theme',
  wrapper: 'twcs-preference-include-wrapper',
  preview: 'twcs-preference-show-preview',
  contrast: 'twcs-preference-show-contrast',
  versions: 'twcs-palette-versions'
}

export const DONATION_STORAGE_KEYS = {
  copyCount: 'twcs-copy-count',
  snoozeUntil: 'twcs-donate-snooze-until'
}

export const KOFI_URL = 'https://ko-fi.com/G0U727FZNX'
export const GITHUB_URL = 'https://github.com/javisperez/tailwindcolorshades'

// Colors used for the quick-start chips and the animated hero showcase
export const QUICK_COLORS = [
  { name: 'indigo', hex: '#6366f1' },
  { name: 'emerald', hex: '#10b981' },
  { name: 'rose', hex: '#f43f5e' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'sky', hex: '#0ea5e9' },
  { name: 'violet', hex: '#8b5cf6' }
] as const
