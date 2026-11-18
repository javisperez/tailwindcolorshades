<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T
  options: { value: T; label: string }[]
  label: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: T): void }>()
</script>

<template>
  <div role="group" :aria-label="label" class="segmented">
    <button v-for="option in options" :key="option.value" type="button"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)">
      {{ option.label }}
    </button>
  </div>
</template>
