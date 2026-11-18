<script setup lang="ts">
import { computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import IconCopy from '~icons/mdi/content-copy'
import IconCheck from '~icons/mdi/check'
import IconShare from '~icons/mdi/share-variant-outline'
import SegmentedControl from './SegmentedControl.vue'
import DonateButton from './DonateButton.vue'
import { usePreferences } from '@/composables/preferences'
import { highlightConfig } from '@/services/highlight'
import { trackInteraction } from '@/services/analytics'

const props = defineProps<{
  source: string
  paletteCount: number
  // The copy just happened (briefly true)
  copied: boolean
  // The user copied at least once in this session: time to say thanks
  hasCopied: boolean
}>()

const emit = defineEmits<{ (e: 'copy'): void }>()

const { version, format, wrapper } = usePreferences()
const { copy: copyLink, copied: linkCopied } = useClipboard({ copiedDuring: 1800 })

const html = computed(() => highlightConfig(props.source))
const fileName = computed(() => (version.value === 'v4' ? 'app.css' : 'tailwind.config.js'))
const wrapperLabel = computed(() => (version.value === 'v4' ? '@theme { }' : 'colors: { }'))

const hint = computed(() => {
  if (version.value === 'v4') {
    return wrapper.value
      ? 'Paste this into your main CSS file, after @import "tailwindcss".'
      : 'Paste these variables inside your existing @theme block.'
  }

  return wrapper.value
    ? 'Paste this inside theme.extend in tailwind.config.js.'
    : 'Paste these entries inside theme.extend.colors.'
})

function onCopyLink() {
  copyLink(window.location.href)
  trackInteraction('copy_share_link', 'click')
}
</script>

<template>
  <section class="card flex flex-col gap-4 p-4 sm:p-5 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto" aria-label="Export">
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="font-display text-lg font-bold tracking-tight">Export</h2>
      <span class="text-xs text-faint">{{ paletteCount }} {{ paletteCount === 1 ? 'palette' : 'palettes' }}</span>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <p class="eyebrow mb-1.5">Tailwind</p>
        <SegmentedControl v-model="version" label="Tailwind version"
          :options="[{ value: 'v4', label: 'v4' }, { value: 'v3', label: 'v3' }]" />
      </div>
      <div>
        <p class="eyebrow mb-1.5">Colors</p>
        <SegmentedControl v-model="format" label="Color format"
          :options="[{ value: 'oklch', label: 'OKLCH' }, { value: 'hex', label: 'HEX' }]" />
      </div>
    </div>

    <label class="flex items-center justify-between gap-3 text-sm font-medium">
      <span>Wrap in <code class="rounded bg-sunken px-1.5 py-0.5 text-xs">{{ wrapperLabel }}</code></span>
      <input v-model="wrapper" type="checkbox" class="switch" aria-label="Wrap the output" />
    </label>

    <div class="code-block flex min-h-0 flex-col">
      <div class="flex items-center justify-between border-b border-line px-3.5 py-2">
        <span class="font-mono text-xs font-medium text-muted">{{ fileName }}</span>
        <button type="button" class="icon-button size-7" :aria-label="copied ? 'Copied' : 'Copy config'" title="Copy config"
          @click="emit('copy')">
          <component :is="copied ? IconCheck : IconCopy" class="size-4" :class="{ 'text-emerald-500': copied }" />
        </button>
      </div>
      <!-- Safe: highlightConfig escapes everything it renders -->
      <pre class="min-h-40 max-h-72 xl:max-h-[calc(100dvh-30rem)]" tabindex="0" aria-label="Generated Tailwind config"><code v-html="html"></code></pre>
    </div>

    <p class="-mt-1 text-xs leading-relaxed text-muted">
      {{ hint }}
      <template v-if="format === 'hex'">
        HEX is an approximation of the OKLCH colors shown on screen.
      </template>
    </p>

    <div class="grid gap-2">
      <button type="button" class="button button-primary h-11 w-full text-[15px]" @click="emit('copy')">
        <component :is="copied ? IconCheck : IconCopy" class="size-4" />
        {{ copied ? 'Copied!' : 'Copy config' }}
      </button>
      <button type="button" class="button button-outline w-full" @click="onCopyLink">
        <component :is="linkCopied ? IconCheck : IconShare" class="size-4" />
        {{ linkCopied ? 'Link copied!' : 'Copy share link' }}
      </button>
    </div>

    <!-- Ask after the win -->
    <div v-if="hasCopied" class="animate-pop flex items-center justify-between gap-3 text-xs text-muted">
      <span>Saved you some time?</span>
      <DonateButton placement="export" size="sm" />
    </div>
  </section>
</template>
