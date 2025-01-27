<script setup>
definePageMeta({
  middleware: 'auth-admin', // Utilise le middleware pour vérifier le rôle
});
</script>

<template>
  <div>
    <h1>Tableau de bord Admin</h1>
    <p>Bienvenue, Super Admin !</p>
  </div>
</template>
