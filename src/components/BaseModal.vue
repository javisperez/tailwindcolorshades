<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import IconClose from '~icons/mdi/close'

withDefaults(defineProps<{
  title: string
  // Tailwind max-width class for the dialog
  size?: string
  hideHeader?: boolean
}>(), {
  size: 'max-w-lg'
})

const emit = defineEmits<{ (e: 'close'): void }>()

useEventListener(document, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
})
</script>

<template>
  <Teleport to="#modals">
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      @mousedown.self="emit('close')">
      <div role="dialog" aria-modal="true" :aria-label="title"
        class="animate-pop card max-h-[92dvh] w-full overflow-y-auto rounded-b-none shadow-[var(--shadow-pop)] sm:rounded-2xl"
        :class="size">
        <div v-if="!hideHeader" class="flex items-center justify-between gap-4 px-5 pt-5">
          <h2 class="font-display text-xl font-bold tracking-tight">{{ title }}</h2>
          <button type="button" class="icon-button" aria-label="Close" @click="emit('close')">
            <IconClose class="size-5" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
