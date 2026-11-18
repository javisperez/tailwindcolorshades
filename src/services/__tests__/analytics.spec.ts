import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackColorEvent, trackError, trackInteraction, trackOption } from '../analytics'

describe('analytics', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does nothing when no analytics snippet was injected', () => {
    vi.stubGlobal('window', {})

    expect(() => trackInteraction('copy_shade')).not.toThrow()
  })

  it('sends events through gtag', () => {
    const gtag = vi.fn()
    vi.stubGlobal('window', { gtag })

    trackInteraction('copy_shade')
    trackOption('change', { setting_name: 'theme', setting_value: true })
    trackColorEvent('import', { shade_count: 2, config_version: undefined })
    trackError('import_config_parse_error')

    expect(gtag).toHaveBeenCalledWith('event', 'user_interaction', { event_label: 'copy_shade_click' })
    expect(gtag).toHaveBeenCalledWith('event', 'option_change', { setting_name: 'theme', setting_value: 'true' })
    // Undefined values are left out, since params only accept strings, numbers and booleans
    expect(gtag).toHaveBeenCalledWith('event', 'color_import', { shade_count: 2 })
    expect(gtag).toHaveBeenCalledWith('event', 'app_error', { error_type: 'import_config_parse_error' })
  })
})
