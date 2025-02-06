<template>
  <div class="flex min-h-screen bg-gray-100 p-6">
    <!-- Colonne gauche : Formulaire de création -->
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h1 class="text-2xl font-bold mb-6">Créer un exercice</h1>

      <form @submit.prevent="createExercise">
        <!-- Champ Nom -->
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium text-gray-700">Nom de l'exercice</label>
          <input
              type="text"
              id="name"
              v-model="name"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <!-- Champ Description -->
        <div class="mb-4">
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
              id="description"
              v-model="description"
              rows="3"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        <!-- Champ Muscles Ciblés -->
        <div class="mb-4">
          <label for="muscles" class="block text-sm font-medium text-gray-700">Muscles ciblés</label>
          <input
              type="text"
              id="muscles"
              v-model="muscles"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: Pectoraux, Biceps, Quadriceps"
          />
        </div>

        <!-- Bouton Soumettre -->
        <LoadingButton :isLoading="isLoading" type="submit">Créer l'exercice</LoadingButton>
      </form>

      <p v-if="successMessage" class="mt-4 text-green-600">{{ successMessage }}</p>
      <p v-if="errorMessage" class="mt-4 text-red-600">{{ errorMessage }}</p>
    </div>

    <!-- Colonne droite : Liste des exercices -->
    <div class="ml-6 bg-white p-6 rounded-lg shadow-lg w-1/2">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Liste des exercices</h2>
        <label class="flex items-center space-x-2">
          <input type="checkbox" v-model="filterByUser" class="form-checkbox h-5 w-5 text-indigo-600">
          <span class="text-sm text-gray-700">Mes exercices</span>
        </label>
      </div>

      <!-- Barre de recherche -->
      <div class="mb-4">
        <input
            type="text"
            v-model="searchQuery"
            placeholder="Rechercher un exercice..."
            class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <!-- Loader -->
      <p v-if="isFetching" class="text-center text-gray-500 animate-pulse">Chargement des exercices...</p>

      <!-- Liste des exercices -->
      <ul v-else-if="filteredExercises.length > 0" class="space-y-3">
        <li v-for="exercise in filteredExercises" :key="exercise.id" class="p-3 border rounded-md shadow-sm bg-gray-50">
          <p class="text-lg font-semibold">{{ exercise.name }}</p>
          <p class="text-sm text-gray-600">{{ exercise.description || "Aucune description" }}</p>
          <p class="text-xs text-gray-500 mt-1">Muscles : {{ exercise.muscles || "Non précisé" }}</p>
        </li>
      </ul>
      <p v-else class="text-gray-500 text-center mt-4">Aucun exercice trouvé.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCookie } from "#app";

useHead({
  title: 'Créer un exercice',
});

definePageMeta({
  middleware: 'auth',
});

const tokenCookie = useCookie('token');

const name = ref('');
const description = ref('');
const muscles = ref('');
const isLoading = ref(false);
const isFetching = ref(true); // Ajout du loader
const successMessage = ref('');
const errorMessage = ref('');
const filterByUser = ref(false);
const searchQuery = ref('');
const userId = ref(null); // Stocke l'ID de l'utilisateur connecté

const exercises = ref([]);

// 🔹 Récupère les exercices filtrés (ceux publics + créés par l'utilisateur)
const fetchExercises = async () => {
  try {
    isFetching.value = true;
    const response = await $fetch('http://localhost:8000/api/exercises/filtered', {
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });
    exercises.value = response || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des exercices :", error);
  } finally {
    isFetching.value = false;
  }
};

// 🔹 Récupère l'ID de l'utilisateur connecté
const fetchUserId = async () => {
  try {
    const userResponse = await $fetch('http://localhost:8000/api/me', {
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });
    userId.value = userResponse.id;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
  }
};

// 🔹 Filtrage dynamique (nom, muscles et user)
const filteredExercises = computed(() => {
  let filtered = exercises.value;

  // Filtrage par utilisateur
  if (filterByUser.value && userId.value) {
    filtered = filtered.filter(ex => ex.createdBy === `/api/users/${userId.value}`);
  }

  // Filtrage par recherche
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(search) ||
        (ex.muscles && ex.muscles.toLowerCase().includes(search))
    );
  }

  return filtered;
});

// 🔹 Création d'un nouvel exercice
const createExercise = async () => {
  isLoading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    await $fetch('http://localhost:8000/api/exercises', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenCookie.value}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: name.value,
        description: description.value,
        muscles: muscles.value
      }
    });

    successMessage.value = "L'exercice a été créé avec succès !";
    name.value = '';
    description.value = '';
    muscles.value = '';

    await fetchExercises();
  } catch (error) {
    errorMessage.value = "Erreur lors de la création de l'exercice.";
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await fetchUserId();
  await fetchExercises();
});
</script>
