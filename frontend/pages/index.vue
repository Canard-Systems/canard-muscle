<template>
  <div>
    <h1 class="text-4xl">homepage</h1>

  </div>
</template>

<script setup>
useHead({
  title: 'Homepage',
})
definePageMeta({
  middleware: 'auth',
});
</script>


<style scoped>

</style>
