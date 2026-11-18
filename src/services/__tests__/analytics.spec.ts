import { afterEach, describe, expect, it, vi } from 'vitest'
import { track, trackError, trackInteraction, trackOption } from '../analytics'

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
    trackOption({ setting_name: 'theme', setting_value: true })
    trackError('import_config_parse_error')
    track('color_generate', { source: 'typed' })
    track('color_change_anchor')

    expect(gtag).toHaveBeenCalledWith('event', 'user_interaction', { event_label: 'copy_shade_click' })
    expect(gtag).toHaveBeenCalledWith('event', 'option_change', { setting_name: 'theme', setting_value: 'true' })
    expect(gtag).toHaveBeenCalledWith('event', 'app_error', { error_type: 'import_config_parse_error' })
    expect(gtag).toHaveBeenCalledWith('event', 'color_generate', { source: 'typed' })
    expect(gtag).toHaveBeenCalledWith('event', 'color_change_anchor', undefined)
  })
})
