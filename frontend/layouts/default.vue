<script setup lang="ts">
import AppFooter from "~/components/AppFooter.vue";

const logout = () => {
  const tokenCookie = useCookie('token');
  tokenCookie.value = null;

  navigateTo('/login');
};
</script>

<template>
  <div class="admin-layout">
    <app-header>Header default
      <button @click="logout" class="bg-red-500 px-4 py-2 rounded-md hover:bg-red-600">Déconnexion</button>
    </app-header>
    <main class="min-h-screen">
      <slot />
    </main>
    <app-footer />
  </div>
</template>

<style scoped>

</style>
