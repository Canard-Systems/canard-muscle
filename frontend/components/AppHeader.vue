<script setup lang="ts">
import { useState } from '#app';
import { useCookie } from '#app';
import { useRouter } from 'vue-router';

const router = useRouter();
const tokenCookie = useCookie('token');
const user = useState('user'); // Récupère les informations utilisateur

const logout = () => {
  tokenCookie.value = null; // Supprime le token
  user.value = null; // Supprime les infos utilisateur
  router.push('/login'); // Redirige vers la page de connexion
};
</script>

<template>
  <header class="flex justify-between items-center px-4 py-2 bg-gray-800 text-white">
    <h1 class="text-2xl font-bold">Canard Musclé</h1>
    <nav>
      <ul class="flex space-x-4">
        <li><nuxt-link to="/">Home</nuxt-link></li>
        <li v-if="user === null"></li>
        <li v-if="user && user.roles && user.roles.includes('ROLE_SUPER_ADMIN')">
          <nuxt-link to="/admin">Admin</nuxt-link>
        </li>
      </ul>
    </nav>
    <button @click="logout" class="bg-red-500 px-4 py-2 rounded-md hover:bg-red-600">Déconnexion</button>
  </header>
</template>

<style scoped>
/* Exemple de styles */
header {
  background-color: #2d3748; /* Couleur de fond sombre */
}

a {
  text-decoration: none;
  color: #fff;
}

a:hover {
  text-decoration: underline;
}

button {
  cursor: pointer;
}
</style>
