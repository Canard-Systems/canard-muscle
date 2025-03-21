<script setup lang="ts">
import { computed, ref } from 'vue';
import { useState, useCookie } from '#app';
import { useRouter } from 'vue-router';

const router = useRouter();
const tokenCookie = useCookie('token');
const user = useState('user'); // Récupère les informations utilisateur

// Vérifie si l'utilisateur est connecté
const isAuth = computed(() => user.value !== null);

// Méthode de déconnexion
const logout = () => {
  tokenCookie.value = null; // Supprime le token
  user.value = null; // Supprime les infos utilisateur
  router.push('/login'); // Redirige vers la page de connexion
};

// Méthode d'inscription
const signup = () => {
  router.push('/signup');
};

// Contrôle d’ouverture/fermeture de la sidebar
const sidebarOpen = ref(false);
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};
</script>

<template>
  <!-- Sidebar -->
  <aside
      class="fixed top-0 left-0 h-screen text-white transform transition-transform duration-300 ease-in-out shadow-2xl border-r border-gray-700"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Header du menu -->
    <div class="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-gray-900 to-gray-800 shadow-inner">
      <h1 class="text-xl font-bold tracking-widest uppercase neon-text">
        Canard Musclé
      </h1>
      <!-- Bouton pour masquer la sidebar -->
      <button
          @click="toggleSidebar"
          class="bg-gray-700 hover:bg-gray-600 text-sm px-2 py-1 rounded transition-colors duration-200"
      >
        Fermer
      </button>
    </div>

    <!-- Navigation -->
    <nav class="mt-4 px-4 text-sm">
      <ul class="flex flex-col space-y-3">
        <li>
          <nuxt-link
              to="/"
              class="block px-3 py-2 rounded hover:bg-gray-700 transition-colors duration-200"
          >
            Accueil
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
              to="/exercises"
              class="block px-3 py-2 rounded hover:bg-gray-700 transition-colors duration-200"
          >
            Liste des Exercices
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
              to="/session"
              class="block px-3 py-2 rounded hover:bg-gray-700 transition-colors duration-200"
          >
            Liste des Séances
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
              to="/plan"
              class="block px-3 py-2 rounded hover:bg-gray-700 transition-colors duration-200"
          >
            Liste des Plans
          </nuxt-link>
        </li>
      </ul>
    </nav>

    <!-- Footer de la sidebar (boutons) -->
    <div class="px-4 mt-6">
      <button
          v-if="isAuth"
          @click="logout"
          class="w-full px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 transition-colors duration-200"
      >
        Déconnexion
      </button>
      <button
          v-else
          @click="signup"
          class="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors duration-200"
      >
        S'inscrire
      </button>
    </div>
  </aside>

  <!-- Bouton pour ouvrir la sidebar si elle est fermée -->
  <button
      v-if="!sidebarOpen"
      @click="toggleSidebar"
      class="fixed top-4 left-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white px-4 py-2 rounded-md z-50
           shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 uppercase text-xs tracking-wide"
  >
    Menu
  </button>
</template>

<style scoped>
/* On crée un effet "néon" sur le titre */
.neon-text {
  color: #fff;
  text-shadow:
      0 0 5px rgba(0, 255, 255, 0.6),
      0 0 10px rgba(0, 255, 255, 0.4),
      0 0 20px rgba(0, 255, 255, 0.2);
}

aside {
  width: 250px;
  background: radial-gradient(ellipse at top left, #2f3640 10%, #1f1f1f 90%);
  z-index: 999;
}
</style>
