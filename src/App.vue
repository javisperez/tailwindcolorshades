<script setup lang="ts">
import { computed } from 'vue'
import { routeLocationKey, useRoute } from 'vue-router'

const route = useRoute()
const key = computed(() => JSON.stringify(route.query))
</script>

<template>
  <div>
    <RouterView :key="key" />
  </div>
</template>
