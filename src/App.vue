<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// This must be a string, but we dont care about it,
// we only want to know if a value was paste from no qs at all, to some value.
const key = computed(() => Boolean(Object.values(route.query).length).toString())
</script>

<template>
  <div>
    <RouterView :key="key" />
  </div>
</template>
