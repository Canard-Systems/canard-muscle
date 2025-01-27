<script setup>
import { useState } from '#app';

definePageMeta({
  middleware: 'auth-admin',
  layout: 'admin',
})

// Exemple de données fictives pour les stats
const stats = {
  users: 120,
  themes: 3,
  betaFeatures: 2,
  apiEndpoints: 15,
};
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Tableau de bord Admin</h1>

    <!-- Statistiques -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 bg-white rounded shadow">
        <h2 class="text-lg font-semibold">Utilisateurs</h2>
        <p class="text-2xl font-bold">{{ stats.users }}</p>
      </div>
      <div class="p-4 bg-white rounded shadow">
        <h2 class="text-lg font-semibold">Thèmes</h2>
        <p class="text-2xl font-bold">{{ stats.themes }}</p>
      </div>
      <div class="p-4 bg-white rounded shadow">
        <h2 class="text-lg font-semibold">Fonctionnalités Beta</h2>
        <p class="text-2xl font-bold">{{ stats.betaFeatures }}</p>
      </div>
      <div class="p-4 bg-white rounded shadow">
        <h2 class="text-lg font-semibold">Endpoints API</h2>
        <p class="text-2xl font-bold">{{ stats.apiEndpoints }}</p>
      </div>
    </div>

    <!-- Raccourcis -->
    <div class="mt-6">
      <h2 class="text-2xl font-semibold mb-4">Actions rapides</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <nuxt-link to="/admin/users" class="block bg-indigo-600 text-white p-4 rounded text-center hover:bg-indigo-700">
          Gérer les Utilisateurs
        </nuxt-link>
        <nuxt-link to="/admin/settings" class="block bg-green-600 text-white p-4 rounded text-center hover:bg-green-700">
          Paramètres du site
        </nuxt-link>
        <nuxt-link to="/admin/api-tester" class="block bg-blue-600 text-white p-4 rounded text-center hover:bg-blue-700">
          Tester l'API
        </nuxt-link>
        <nuxt-link to="/admin/themes" class="block bg-yellow-600 text-white p-4 rounded text-center hover:bg-yellow-700">
          Gérer les Thèmes
        </nuxt-link>
      </div>
    </div>
  </div>
</template>
