<script setup lang="ts">
import IconClose from '~icons/mdi/close'
import DonateButton from './DonateButton.vue'
import { useDonations } from '@/composables/donations'

const { isNudgeVisible, dismissNudge } = useDonations()
</script>

<template>
  <div v-if="isNudgeVisible" role="status"
    class="animate-pop card fixed right-4 bottom-24 z-40 flex items-center gap-2 py-2 pr-2 pl-4 text-sm xl:right-6 xl:bottom-6">
    <span class="text-muted">Saving you time?</span>
    <DonateButton placement="nudge" size="sm" />
    <button type="button" class="icon-button size-7" aria-label="Dismiss" @click="dismissNudge">
      <IconClose class="size-4" />
    </button>
  </div>
</template>
