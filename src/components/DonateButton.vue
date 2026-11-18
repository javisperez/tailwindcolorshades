<script setup lang="ts">
import IconCoffee from '~icons/mdi/coffee'
import { KOFI_URL } from '@/constants'
import { useDonations } from '@/composables/donations'

withDefaults(defineProps<{
  // Where the button lives; reported with the click so you can compare placements.
  placement: string
  label?: string
  size?: 'sm' | 'md'
}>(), {
  label: 'Buy me a coffee',
  size: 'md'
})

const { registerDonateClick } = useDonations()
</script>

<template>
  <a :href="KOFI_URL" target="_blank" rel="noopener noreferrer"
    class="button button-kofi"
    :class="{ 'button-sm': size === 'sm' }"
    :aria-label="label"
    @click="registerDonateClick(placement)">
    <IconCoffee class="coffee size-4" />
    <span>{{ label }}</span>
  </a>
</template>
