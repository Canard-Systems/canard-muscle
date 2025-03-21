<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'auth'
})
useHead({ title: 'Liste des exercices' });
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white space-console p-4">
    <ExerciseList />
  </div>
</template>

<style scoped>
.space-console {
  background: radial-gradient(ellipse at center, rgba(20,20,20,1) 0%, rgba(10,10,10,1) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 0 30px rgba(0,255,255,0.05), inset 0 0 20px rgba(0,255,255,0.02);
}
</style>
