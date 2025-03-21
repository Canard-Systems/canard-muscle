<template>
  <div class="app-layout flex">
    <!-- On inclut le header latéral -->
    <Header />

    <main class="flex-1 px-24 py-16">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/AppHeader.vue';
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}
</style>
