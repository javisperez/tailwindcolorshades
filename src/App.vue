<script>
export default {
  computed: {
    queryKey() {
      return Boolean(Object.keys(this.$route.query).length);
    }
  }
};
</script>
<template>
  <div>
    <router-view :key="queryKey" />
  </div>
</template>
