<script setup>
import { ref } from 'vue';

const emit = defineEmits(['select'])

const props = defineProps({
  version: {
    type: String,
    default: 'v4'
  }
});

const selectedVersion = ref(props.version || 'v4');

function setVersion(version) {
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