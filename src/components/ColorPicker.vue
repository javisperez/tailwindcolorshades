<script setup lang="ts">
import { ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import IconRightArrow from '~icons/mdi/arrow-right'
import ColorPickerPopup from './ColorPickerPopup.vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'change', color: string): void
}>()

const isOpen = ref(false)
const oklchString = ref('')
const dropdownRef = ref<HTMLElement | null>(null)

function openDropdown() {
  isOpen.value = true
}

function onColorSelection(color: string) {
  oklchString.value = color
  emit('change', color)
  isOpen.value = false
}

function onCancel() {
  isOpen.value = false
}

function resetStates() {
  oklchString.value = ''
  isOpen.value = false
}

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    oklchString.value = newValue
  } else {
    resetStates()
  }
}, { immediate: true })

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>

<template>
  <div class="relative w-full max-w-xs group"
    :class="{ 'is-open': isOpen }"
    ref="dropdownRef">
    <!-- Input Field -->
    <div class="relative z-10 flex items-center border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-slate-800 text-sm group-[.is-open]:!border-gray-300 dark:group-[.is-open]:!border-gray-400 focus-within:border-gray-300 dark:focus-within:border-gray-400">
      <div class="inline-block size-6 shrink-0 grow-0 rounded-full mr-2 relative left-2 border border-gray-200 dark:border-gray-600 transition-color duration-150"
        :style="{ backgroundColor: oklchString }"></div>
      <input type="text"
        class="flex-1 appearance-none p-0 bg-transparent border-none px-1 focus:outline-none focus:ring-0"
        placeholder="Add a color"
        :value="oklchString"
        readonly
        @focus="openDropdown()"
        @click="openDropdown()"
        @keyup.esc="isOpen = false">

      <button type="button" :disabled="!oklchString" class="rounded-2xl disabled:opacity-0 text-green-500 hover:text-green-600 py-1 px-1.5 relative right-1"
        @click="onColorSelection(oklchString)">
        <IconRightArrow class="w-6 h-6" />
      </button>
    </div>

    <!-- Color Picker Popup (positioned absolutely below input) -->
    <div v-if="isOpen" class="absolute top-10 left-0 z-10">
      <ColorPickerPopup
        :initial-color="oklchString"
        @apply="onColorSelection"
        @cancel="onCancel"
        :inline="true"
      />
    </div>
  </div>
</template>
