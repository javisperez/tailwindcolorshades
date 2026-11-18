import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { DONATION_STORAGE_KEYS } from '@/constants'
import { track } from '@/services/analytics'

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
      track('donate_nudge_shown', { copy_count: copyCount.value })
    }
  }

  function dismissNudge() {
    isNudgeVisible.value = false
    snoozeUntil.value = Date.now() + DISMISS_SNOOZE_DAYS * DAY_MS
    track('donate_nudge_dismissed', { copy_count: copyCount.value })
  }

  // Call when any donate link is clicked.
  function registerDonateClick(placement: string) {
    track('donate_click', { placement, copy_count: copyCount.value })
    isNudgeVisible.value = false
    snoozeUntil.value = Date.now() + DONATED_SNOOZE_DAYS * DAY_MS
  }

  return { copyCount, isNudgeVisible, registerCopy, dismissNudge, registerDonateClick }
}
