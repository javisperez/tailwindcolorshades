import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { DONATION_STORAGE_KEYS } from '@/constants'
import { trackInteraction } from '@/services/analytics'

// Ask after the win: the soft prompt shows up right after the 3rd and 12th config copy,
// never more than once per snooze window, and never blocks the UI.
const NUDGE_AFTER_COPIES = [3, 12]
const DISMISS_SNOOZE_DAYS = 30
const DONATED_SNOOZE_DAYS = 120
const DAY_MS = 24 * 60 * 60 * 1000

const copyCount = useLocalStorage(DONATION_STORAGE_KEYS.copyCount, 0)
const snoozeUntil = useLocalStorage(DONATION_STORAGE_KEYS.snoozeUntil, 0)
const isNudgeVisible = ref(false)

export function useDonations() {
  // Call every time the user copies a config. Opens the soft prompt when it is time.
  function registerCopy() {
    copyCount.value += 1

    if (NUDGE_AFTER_COPIES.includes(copyCount.value) && Date.now() > snoozeUntil.value) {
      isNudgeVisible.value = true
      trackInteraction('donate_nudge_shown', 'hover')
    }
  }

  function dismissNudge() {
    isNudgeVisible.value = false
    snoozeUntil.value = Date.now() + DISMISS_SNOOZE_DAYS * DAY_MS
    trackInteraction('donate_nudge_dismiss', 'click')
  }

  // Call when any donate link is clicked.
  function registerDonateClick(placement: string) {
    trackInteraction(`donate_${placement}`, 'click')
    isNudgeVisible.value = false
    snoozeUntil.value = Date.now() + DONATED_SNOOZE_DAYS * DAY_MS
  }

  return { copyCount, isNudgeVisible, registerCopy, dismissNudge, registerDonateClick }
}
