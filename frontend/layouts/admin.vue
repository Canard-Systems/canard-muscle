<script setup>
const logout = () => {
  const tokenCookie = useCookie('token');
  tokenCookie.value = null;

  navigateTo('/login');
};
</script>

<template>
  <div class="admin-layout">
    <header>Header Admin
      <button @click="logout" class="bg-red-500 px-4 py-2 rounded-md hover:bg-red-600">Déconnexion</button>
    </header>
    <main>
      <slot />
    </main>
    <footer>Footer Admin</footer>
  </div>
</template>

<style scoped>

</style>
