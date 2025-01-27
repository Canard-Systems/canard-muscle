<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isActive = (route) => router.currentRoute.value.path === route;

// État pour gérer la visibilité de la sidebar
const isOpen = ref(false);

// Fonction pour basculer la visibilité
const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <aside :class="{'w-64': isOpen, 'w-16': !isOpen}" class="bg-gray-800 text-white min-h-screen transition-all duration-300">
    <!-- Bouton pour ouvrir/fermer la sidebar -->
    <div class="p-4 flex justify-between items-center">
      <h2 v-if="isOpen" class="text-lg font-bold">Canard Musclé</h2>
      <button @click="toggleSidebar" class="bg-gray-700 p-2 rounded hover:bg-gray-600">
        <span v-if="isOpen">✖</span>
        <span v-else>☰</span>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="mt-4">
      <ul>
        <li :class="{ 'bg-gray-700': isActive('/admin/dashboard') }" class="p-4 hover:bg-gray-700">
          <nuxt-link to="/admin/dashboard">
            <span v-if="isOpen">Tableau de bord</span>
            <span v-else>📊</span>
          </nuxt-link>
        </li>
        <li :class="{ 'bg-gray-700': isActive('/admin/users') }" class="p-4 hover:bg-gray-700">
          <nuxt-link to="/admin/users">
            <span v-if="isOpen">Utilisateurs</span>
            <span v-else>👥</span>
          </nuxt-link>
        </li>
        <li :class="{ 'bg-gray-700': isActive('/admin/settings') }" class="p-4 hover:bg-gray-700">
          <nuxt-link to="/admin/settings">
            <span v-if="isOpen">Paramètres</span>
            <span v-else>⚙️</span>
          </nuxt-link>
        </li>
        <li :class="{ 'bg-gray-700': isActive('/admin/api-tester') }" class="p-4 hover:bg-gray-700">
          <nuxt-link to="/admin/api-tester">
            <span v-if="isOpen">Tester l'API</span>
            <span v-else>🛠️</span>
          </nuxt-link>
        </li>
        <li :class="{ 'bg-gray-700': isActive('/admin/themes') }" class="p-4 hover:bg-gray-700">
          <nuxt-link to="/admin/themes">
            <span v-if="isOpen">Thèmes</span>
            <span v-else>🎨</span>
          </nuxt-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
aside {
  height: 100%;
}

ul li {
  list-style: none;
}

ul li a {
  display: block;
  padding: 0.5rem;
  text-decoration: none;
  color: white;
}
</style>
