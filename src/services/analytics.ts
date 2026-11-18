import { createTracker } from 'pages-analytics/track'

export type ColorSource = 'typed' | 'picker' | 'quick_color' | 'surprise_me' | 'sample'
export type CopySource = 'export_panel' | 'mobile_bar' | 'palette_card'

// The analytics snippet is injected at deploy time by pages-analytics (see vite.config.ts), so
// tracking only happens on the deployed site. Everywhere else the tracker does nothing.
// Params are kept low-cardinality on purpose (no color values), so they work as GA4 dimensions.
type Events = {
  // A palette was created, and from where
  color_generate: { source: ColorSource }
  color_import: { palette_count: number; config_version?: string }
  // The page was opened from a shared link (or a reload of your own link)
  share_link_opened: { palette_count: number }
  color_copy: {
    source: CopySource
    color_format: string
    config_version: string
    wrapper: boolean
    palette_count?: number
    shade_count?: number
  }
  color_update_anchors: { anchor_count: number }
  color_change_anchor: undefined
  // Something typed in the color field that could not be read
  color_input_invalid: { input: string }
  preview_primary: { mode: 'mixed' | 'single' }
  // How many copies the person had made when the donation prompt was shown, dismissed or clicked
  donate_nudge_shown: { copy_count: number }
  donate_nudge_dismissed: { copy_count: number }
  donate_click: { placement: string; copy_count: number }
  option_change: { setting_name: string; setting_value: string }
  user_interaction: { event_label: string }
  app_error: { error_type: string; error_message?: string }
}

export const track = createTracker<Events>()

/**
 * Track option/setting changes
 */
export const trackOption = (data: { setting_name: string; setting_value: string | number | boolean }): void => {
  track('option_change', {
    setting_name: data.setting_name,
    setting_value: String(data.setting_value)
  })
}

/**
 * Track user interactions
 */
export const trackInteraction = (element: string): void => {
  track('user_interaction', { event_label: `${element}_click` })
}

/**
 * Track errors or issues
 */
export const trackError = (errorType: string, errorMessage?: string): void => {
  track('app_error', { error_type: errorType, ...(errorMessage && { error_message: errorMessage }) })
}
