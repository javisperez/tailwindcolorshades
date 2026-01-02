// Global gtag function type declaration
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

// GA4 event parameters
type EventParameters = {
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  custom_parameter_1?: string;
  custom_parameter_2?: string;
  [key: string]: unknown;
};

// Common event types for the color shades app
type ColorEventData = {
  color_format?: 'hex' | 'oklch';
  shade_count?: number;
  color_value?: string;
  config_version?: 'v3' | 'v4';
  anchor_count?: number;
};

type OptionEventData = {
  setting_name: string;
  setting_value: string | number | boolean;
};

// Helper function to check if analytics is enabled
const isEnabled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Track a generic event
 */
export const trackEvent = (
  eventName: string,
  parameters: EventParameters = {}
): void => {
  if (!isEnabled()) {
    console.warn('Google Analytics not available');
    return;
  }

  window.gtag!('event', eventName, parameters);
};

/**
 * Track color-related events
 */
export const trackColorEvent = (
  action: 'generate' | 'copy' | 'export' | 'import' | 'update_anchors' | 'change_anchor',
  data: ColorEventData = {}
): void => {
  trackEvent(`color_${action}`, {
    event_category: 'color_interaction',
    ...data
  });
};

/**
 * Track option/setting changes
 */
export const trackOption = (
  action: 'change' | 'reset' | 'save',
  data: OptionEventData
): void => {
  trackEvent(`option_${action}`, {
    event_category: 'user_preferences',
    event_label: data.setting_name,
    value: typeof data.setting_value === 'number' ? data.setting_value : undefined,
    custom_parameter_1: String(data.setting_value)
  });
};

/**
 * Track user interactions
 */
export const trackInteraction = (
  element: string,
  action: 'click' | 'hover' | 'focus' = 'click',
  value?: number
): void => {
  trackEvent('user_interaction', {
    event_category: 'ui_interaction',
    event_label: `${element}_${action}`,
    value
  });
};

/**
 * Track app usage patterns
 */
export const trackUsage = (
  feature: string,
  duration?: number
): void => {
  trackEvent('feature_usage', {
    event_category: 'app_usage',
    event_label: feature,
    value: duration
  });
};

/**
 * Track errors or issues
 */
export const trackError = (
  errorType: string,
  errorMessage?: string
): void => {
  trackEvent('app_error', {
    event_category: 'error',
    event_label: errorType,
    custom_parameter_1: errorMessage
  });
};
