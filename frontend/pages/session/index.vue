<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'auth',
})
useHead({ title: 'Liste des séances' });
</script>

<template>
  <div class="min-h-screen neon-bg text-white p-4">
    <SessionList />
  </div>
</template>

<style scoped>
.neon-bg {
  background: radial-gradient(circle, #141414 0%, #0a0a0a 100%);
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 0 20px rgba(0,255,255,0.04), inset 0 0 10px rgba(0,255,255,0.02);
  transition: box-shadow 0.3s;
}
.neon-bg:hover {
  box-shadow: 0 0 30px rgba(0,255,255,0.06), inset 0 0 20px rgba(0,255,255,0.04);
}
</style>
