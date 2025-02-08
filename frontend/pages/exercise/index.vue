<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-gray-100 p-4 md:p-6 relative no-scrollbar">

    <!-- Bouton flottant pour ouvrir le formulaire (Mobile) -->
    <button
        @click="showForm = !showForm"
        class="md:hidden fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
      <span v-if="!showForm" class="text-3xl">+</span>
      <span v-else class="text-xl">-</span>
    </button>

    <!-- Formulaire de création d'exercice -->
    <div
        v-if="showForm"
        @click.self="showForm = false"
        class="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-40"></div>
    <div
        v-if="showForm"
        class="bg-white p-6 md:p-8 rounded-lg shadow-lg w-5/6 md:max-w-md transition-all duration-300"
        :class="{ 'absolute bottom-1/2 translate-y-1/2 left-1/2 -translate-x-1/2 z-50 md:z-auto': showForm }"
    >
      <h1 class="text-xl md:text-2xl font-bold mb-4 flex justify-between">
        Créer un exercice
        <button @click="showForm = false" class="text-red-500">✖</button>
      </h1>

      <form @submit.prevent="createExercise">
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium text-gray-700">Nom de l'exercice</label>
          <input type="text" id="name" v-model="name" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
        </div>

        <div class="mb-4">
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" v-model="description" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>

        <!-- Sélection de muscles avec autocomplétion -->
          <div class="mb-4">
            <label for="muscles" class="block text-sm font-medium text-gray-700">Muscles ciblés</label>

            <Multiselect
                v-model="selectedMuscles"
                :options="availableMuscles"
                :multiple="true"
                :searchable="true"
                :close-on-select="false"
                placeholder="Sélectionnez un ou plusieurs muscles"
                class="mt-1 w-full border border-gray-300 text-black rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />

          </div>

        <LoadingButton :isLoading="isLoading" type="submit">Créer l'exercice</LoadingButton>
      </form>
    </div>

    <!-- Liste des exercices -->
    <div class="mt-6 md:mt-0 md:ml-6 bg-white p-6 rounded-lg shadow-lg w-full">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h2 class="text-lg md:text-xl font-bold">Liste des exercices</h2>

        <!-- Bouton "Ajouter un exercice" (Desktop) -->
        <button @click="showForm = !showForm" class="hidden md:block px-4 py-2 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700">
          {{ !showForm ? 'Ajouter un exercice' : 'Fermer' }}
        </button>

        <label class="flex items-center space-x-2 mt-2 md:mt-0">
          <input type="checkbox" v-model="filterByUser" class="form-checkbox h-5 w-5 text-indigo-600">
          <span class="text-sm text-gray-700">Mes exercices</span>
        </label>
      </div>

      <div class="mb-4">
        <input type="text" v-model="searchQuery" placeholder="Rechercher un exercice..." class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
      </div>

      <p v-if="isFetching" class="text-center text-gray-500 animate-pulse">Chargement des exercices...</p>

      <ul v-else-if="filteredExercises.length > 0" class="space-y-3">
        <li v-for="exercise in filteredExercises" :key="exercise.id" class="p-3 border rounded-md shadow-sm bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div class="mb-2 md:mb-0">
            <p class="text-lg font-semibold">{{ capitalizeFirstLetter(exercise.name) }}</p>
            <p class="text-sm text-gray-600">{{ capitalizeFirstLetter(exercise.description) || "Aucune description" }}</p>
            <p class="text-xs text-gray-500 mt-1">Muscles : {{ capitalizeFirstLetter(exercise.muscles) || "Non précisé" }}</p>
          </div>

          <button v-if="exercise.createdBy === `/api/users/${$user.id}`" @click="confirmDelete(exercise.id)" class="text-red-600 hover:text-red-800 px-4 py-1 rounded-md bg-red-100 md:self-end">🗑️ Supprimer</button>
        </li>
      </ul>
      <p v-else class="text-gray-500 text-center mt-4">Aucun exercice trouvé.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCookie, useNuxtApp } from "#app";
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.css";

import { availableMuscles } from "@/utils/muscle-fr.js";

useHead({ title: 'Gestion des exercices' });

definePageMeta({ middleware: 'auth' });

const { $toast, $user } = useNuxtApp();
const tokenCookie = useCookie('token');

const name = ref('');
const description = ref('');
const isLoading = ref(false);
const isFetching = ref(true);
const filterByUser = ref(false);
const searchQuery = ref('');
const exercises = ref([]);
const selectedMuscles = ref([]);
const showForm = ref(false);



const fetchExercises = async () => {
  try {
    isFetching.value = true;
    const response = await $fetch('http://localhost:8000/api/exercises/filtered', {
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });

    exercises.value = response.map(ex => ({
      ...ex,
      name: capitalizeFirstLetter(ex.name),
      description: ex.description ? capitalizeFirstLetter(ex.description) : '',
      muscles: ex.muscles ? capitalizeFirstLetter(ex.muscles) : ''
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des exercices :", error);
  } finally {
    isFetching.value = false;
  }
};

const createExercise = async () => {
  if (selectedMuscles.value.length === 0) {
    $toast.error("Vous devez sélectionner au moins un muscle.");
    return;
  }

  isLoading.value = true;
  try {
    await $fetch("http://localhost:8000/api/exercises", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
        "Content-Type": "application/json",
      },
      body: {
        name: name.value.toLowerCase(),
        description: description.value.toLowerCase(),
        muscles: selectedMuscles.value.toString(),
      },
    });

    $toast.success("Exercice créé avec succès !");
    name.value = "";
    description.value = "";
    selectedMuscles.value = [];

    showForm.value = false;
    await fetchExercises();
  } catch (error) {
    $toast.error("Erreur lors de la création de l'exercice.");
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const confirmDelete = async (exerciseId) => {
  if (confirm("Voulez-vous vraiment supprimer cet exercice ?")) {
    await deleteExercise(exerciseId);
  }
};

const deleteExercise = async (exerciseId) => {
  try {
    await $fetch(`http://localhost:8000/api/exercises/${exerciseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });

    exercises.value = exercises.value.filter(ex => ex.id !== exerciseId);
    $toast.success("Exercice supprimé !");
  } catch (error) {
    $toast.error("Erreur lors de la suppression de l'exercice.");
    console.error(error);
  }
};

const filteredExercises = computed(() => {
  let filtered = exercises.value;
  if (filterByUser.value && $user?.value?.id) {
    filtered = filtered.filter(ex => ex.createdBy === `/api/users/${$user.value.id}`);
  }
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(search) ||
        (ex.muscles && ex.muscles.toLowerCase().includes(search))
    );
  }
  return filtered;
});

const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

onMounted(async () => {
  await fetchExercises();
});
</script>
