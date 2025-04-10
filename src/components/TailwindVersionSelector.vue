<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (event: 'select', version: 'v4' | 'v3'): void;
}>()

const props = withDefaults(defineProps<{
  version: string,
}>(), {
  version: 'v4'
});

const selectedVersion = ref<string>(props.version || 'v4');

function setVersion(version: 'v4' | 'v3') {
  selectedVersion.value = version;
  emit('select', version);
}
</script>

<template>
  <div class="hidden lg:flex items-center">
    <div class="flex rounded-md bg-gray-200">
      <button
        :class="{
          'bg-primary-500 text-white': selectedVersion === 'v4',
          'bg-transparent text-gray-700': selectedVersion !== 'v4'
        }"
        @click="setVersion('v4')"
        class="px-3 py-1.5 text-sm font-medium rounded-l-md">
        v4
      </button>
      <button
        :class="{
          'bg-primary-500 text-white': selectedVersion === 'v3',
          'bg-transparent text-gray-700': selectedVersion !== 'v3'
        }"
        @click="setVersion('v3')"
        class="px-3 py-1.5 text-sm font-medium rounded-r-md">
        v3
      </button>
    </div>
  </div>
</template>