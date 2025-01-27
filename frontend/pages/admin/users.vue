<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>
    <!-- Liste des utilisateurs -->
    <div v-for="user in users" :key="user.id" class="p-4 bg-white shadow rounded mb-2">
      <h2>{{ user.email }}</h2>
      <p>Rôle : {{ user.roles.join(', ') }}</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth-admin',
  layout: 'admin',
})

const users = ref([
  { id: 1, email: 'admin@site.com', roles: ['ROLE_SUPER_ADMIN'] },
  { id: 2, email: 'user@site.com', roles: ['ROLE_USER'] },
]);
</script>
