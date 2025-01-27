<script setup>
definePageMeta({
  middleware: 'auth-admin', // Utilise le middleware pour vérifier le rôle
  layout: 'admin',
});
</script>

<template>
  <div>
    <h1>Tableau de bord Admin</h1>
    <nuxt-link to="/admin/dashboard">DASHBOARD</nuxt-link>
  </div>
</template>
