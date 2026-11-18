<script setup lang="ts">
import { ref } from 'vue'
import IconFileUpload from '~icons/mdi/file-upload'
import BaseModal from './BaseModal.vue'
import type { Palette } from './ColorPalette.vue'
import { parseConfig } from '@/services/import'
import { trackError } from '@/services/analytics'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'import', palettes: Palette[], version?: 'v3' | 'v4'): void
}>()

const configText = ref('')
const error = ref('')

const placeholder = `Paste your config here…

Tailwind v4:
@theme {
  --color-brand-500: #3b82f6;
}

Tailwind v3:
{
  'brand': {
    '500': '#3b82f6'
  }
}`

function handleImport() {
  error.value = ''

  const result = parseConfig(configText.value)
  if (result.error) {
    error.value = result.error
    trackError('import_config_parse_error', result.error)
    return
  }

  emit('import', result.palettes, result.version)
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.css')) {
      // Extract the @theme section from v4 CSS files
      const themeMatch = content.match(/@theme\s*\{[\s\S]*?\n\}/m)
      configText.value = themeMatch ? themeMatch[0] : content
    } else if (fileName.endsWith('.js') || fileName.endsWith('.cjs') || fileName.endsWith('.mjs')) {
      // Extract the colors object from JS config files
      const colorsMatch = content.match(/colors\s*:\s*\{([\s\S]*?)\n\s*\}(?:\s*,|\s*\})/m)
      configText.value = colorsMatch ? `{${colorsMatch[1]}\n}` : content
    } else {
      configText.value = content
    }
  }
  reader.readAsText(file)

  // Reset the input so the same file can be selected again
  input.value = ''
}
</script>

<template>
  <BaseModal title="Import a config" size="max-w-2xl" @close="emit('close')">
    <div class="p-5">
      <p class="mb-4 text-sm text-muted">
        Bring your existing Tailwind v3 (JSON) or v4 (CSS variables) colors to edit them here. Paste them below or upload a file.
      </p>

      <textarea v-model="configText" class="field h-64 resize-none font-mono text-[13px] leading-relaxed" :placeholder="placeholder"
        aria-label="Config to import" spellcheck="false"></textarea>

      <label class="button button-outline button-sm mt-3 cursor-pointer">
        <IconFileUpload class="size-4" />
        Import from file
        <input type="file" accept=".css,.cjs,.mjs,.js,.json,.txt" class="hidden" @change="handleFileUpload" />
      </label>

      <p v-if="error" role="alert" class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
        {{ error }}
      </p>

      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="button button-ghost" @click="emit('close')">Cancel</button>
        <button type="button" class="button button-primary px-6" :disabled="!configText.trim()" @click="handleImport">Import</button>
      </div>
    </div>
  </BaseModal>
</template>
