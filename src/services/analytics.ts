import { createTracker } from 'pages-analytics/track'

// The analytics snippet is injected at deploy time by pages-analytics (see vite.config.ts), so
// tracking only happens on the deployed site. Everywhere else the tracker does nothing.
type Events = {
  color_generate: { color_value: string; config_version?: 'v3' | 'v4'; color_format?: string }
  color_copy: { shade_count: number; color_format: string; config_version: string }
  color_import: { shade_count: number; config_version?: string }
  color_update_anchors: { anchor_count: number; config_version: string; color_format: string }
  color_change_anchor: { color_value: string; config_version: string; color_format: string }
  option_change: { setting_name: string; setting_value: string }
  user_interaction: { event_label: string }
  app_error: { error_type: string; error_message?: string }
}

const track = createTracker<Events>()

// Drops undefined values, since event params only accept strings, numbers and booleans
function defined<T extends Record<string, string | number | boolean | undefined>>(params: T) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]: Exclude<T[K], undefined>
  }
}

/**
 * Track color-related events
 */
export const trackColorEvent = <Action extends 'generate' | 'copy' | 'import' | 'update_anchors' | 'change_anchor'>(
  action: Action,
  data: Events[`color_${Action}`]
): void => {
  const send = track as (name: string, params: object) => void
  send(`color_${action}`, defined(data as Record<string, string | number | undefined>))
}

/**
 * Track option/setting changes
 */
export const trackOption = (
  action: 'change',
  data: { setting_name: string; setting_value: string | number | boolean }
): void => {
  track(`option_${action}`, {
    setting_name: data.setting_name,
    setting_value: String(data.setting_value)
  })
}

/**
 * Track user interactions
 */
export const trackInteraction = (element: string, action: 'click' | 'hover' = 'click'): void => {
  track('user_interaction', { event_label: `${element}_${action}` })
}

/**
 * Track errors or issues
 */
export const trackError = (errorType: string, errorMessage?: string): void => {
  track('app_error', defined({ error_type: errorType, error_message: errorMessage }))
}
