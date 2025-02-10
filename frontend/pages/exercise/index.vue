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
    <div v-if="showForm" @click.self="showForm = false"
         class="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-40"></div>

    <div v-if="showForm"
         class="bg-white p-6 md:p-8 rounded-lg shadow-lg w-5/6 md:max-w-md transition-all duration-300"
         :class="{ 'absolute bottom-1/2 translate-y-1/2 left-1/2 -translate-x-1/2 z-50 md:z-auto': showForm }">

      <h1 class="text-xl md:text-2xl font-bold mb-4 flex justify-between">
        Créer un exercice
        <button @click="showForm = false" class="text-red-500">✖</button>
      </h1>

      <form @submit.prevent="createExercise">
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium text-gray-700">Nom de l'exercice</label>
          <input type="text" id="name" v-model="name" required
                 class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
        </div>

        <div class="mb-4">
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" v-model="description" rows="3"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>

        <!-- Sélection de muscles avec autocomplétion -->
        <div class="mb-4">
          <label for="muscles" class="block text-sm font-medium text-gray-700">Muscles ciblés</label>
          <Multiselect v-model="selectedMuscles" :options="availableMuscles"
                       :multiple="true" :searchable="true" :close-on-select="false"
                       placeholder="Sélectionnez un ou plusieurs muscles"
                       class="mt-1 w-full border border-gray-300 text-black rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
        </div>

        <LoadingButton :isLoading="isLoading" type="submit">Créer l'exercice</LoadingButton>
      </form>
    </div>

    <!-- Liste des exercices -->
    <div class="mt-6 md:mt-0 md:ml-6 bg-white p-6 rounded-lg shadow-lg w-full">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h2 class="text-lg md:text-xl font-bold">Liste des exercices</h2>

        <!-- Bouton "Ajouter un exercice" (Desktop) -->
        <button @click="showForm = !showForm"
                class="hidden md:block px-4 py-2 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700">
          {{ !showForm ? 'Ajouter un exercice' : 'Fermer' }}
        </button>
      </div>

      <!-- Utilisation du composant ExerciseList -->
      <ExerciseList api-url="http://localhost:8000/api/exercises/filtered" :userId="$user.id" ref="exerciseListRef">
        <template #actions="{ exercise }">
          <button v-if="exercise.createdBy === `/api/users/${$user.id}`" @click="confirmDelete(exercise.id)"
                  class="text-red-600 hover:text-red-800 px-4 py-1 rounded-md bg-red-100">
            🗑️ Supprimer
          </button>
        </template>
      </ExerciseList>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNuxtApp } from "#app";
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.css";
import ExerciseList from "@/components/ExerciseList.vue";
import { availableMuscles } from "@/utils/muscle-fr.js";

useHead({ title: "Gestion des exercices" });
definePageMeta({ middleware: "auth" });

const { $toast, $user } = useNuxtApp();
const tokenCookie = useCookie("token");

const name = ref("");
const exerciseListRef = ref(null);
const description = ref("");
const isLoading = ref(false);
const selectedMuscles = ref([]);
const showForm = ref(false);

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
    await exerciseListRef.value?.fetchExercises();
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
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });

    $toast.success("Exercice supprimé !");
    await exerciseListRef.value?.fetchExercises();
  } catch (error) {
    $toast.error("Erreur lors de la suppression de l'exercice.");
    console.error(error);
  }
};
</script>
