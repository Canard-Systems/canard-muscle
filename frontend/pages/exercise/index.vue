<template>
  <div class="flex min-h-screen bg-gray-100 p-6">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h1 class="text-2xl font-bold mb-6">Créer un exercice</h1>

      <form @submit.prevent="createExercise">
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium text-gray-700">Nom de l'exercice</label>
          <input type="text" id="name" v-model="name" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
        </div>

        <div class="mb-4">
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" v-model="description" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>

        <div class="mb-4 relative">
          <label for="muscles" class="block text-sm font-medium text-gray-700">Muscles ciblés</label>

          <div class="flex flex-wrap gap-2 mb-2">
    <span v-for="muscle in selectedMuscles" :key="muscle" class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs flex items-center">
      {{ muscle }}
      <button @click="removeMuscle(muscle)" class="ml-2 text-red-600 hover:text-red-800">✖</button>
    </span>
          </div>

          <input
              type="text"
              id="muscles"
              v-model="musclesInput"
              @input="filterMuscles"
              @focus="showDropdown = true"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ajoutez un muscle"
          />

          <ul v-if="showDropdown && filteredMuscles.length" class="absolute z-10 bg-white w-full border border-gray-300 mt-1 rounded-md shadow-lg">
            <li
                v-for="muscle in filteredMuscles"
                :key="muscle"
                @click="selectMuscle(muscle)"
                class="p-2 cursor-pointer hover:bg-gray-100">
              {{ muscle }}
            </li>
          </ul>
        </div>
        <LoadingButton :isLoading="isLoading" type="submit">Créer l'exercice</LoadingButton>
      </form>
    </div>

    <div class="ml-6 bg-white p-6 rounded-lg shadow-lg w-1/2">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Liste des exercices</h2>
        <label class="flex items-center space-x-2">
          <input type="checkbox" v-model="filterByUser" class="form-checkbox h-5 w-5 text-indigo-600">
          <span class="text-sm text-gray-700">Mes exercices</span>
        </label>
      </div>

      <div class="mb-4">
        <input type="text" v-model="searchQuery" placeholder="Rechercher un exercice..." class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
      </div>

      <p v-if="isFetching" class="text-center text-gray-500 animate-pulse">Chargement des exercices...</p>

      <ul v-else-if="filteredExercises.length > 0" class="space-y-3">
        <li v-for="exercise in filteredExercises" :key="exercise.id" class="p-3 border rounded-md shadow-sm bg-gray-50 flex justify-between items-center">
          <div>
            <p class="text-lg font-semibold">{{ capitalizeFirstLetter(exercise.name) }}</p>
            <p class="text-sm text-gray-600">{{ capitalizeFirstLetter(exercise.description) || "Aucune description" }}</p>
            <p class="text-xs text-gray-500 mt-1">Muscles : {{ capitalizeFirstLetter(exercise.muscles) || "Non précisé" }}</p>
          </div>

          <button v-if="exercise.createdBy === `/api/users/${$user.id}`" @click="confirmDelete(exercise.id)" class="text-red-600 hover:text-red-800">🗑️</button>
        </li>
      </ul>
      <p v-else class="text-gray-500 text-center mt-4">Aucun exercice trouvé.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCookie, useNuxtApp } from "#app";
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
const musclesInput = ref('');
const showDropdown = ref(false);
const filteredMuscles = ref([...availableMuscles]);

const filterMuscles = () => {
  const search = musclesInput.value.toLowerCase();
  filteredMuscles.value = availableMuscles.filter(muscle =>
      muscle.toLowerCase().includes(search) && !selectedMuscles.value.includes(muscle)
  );
  showDropdown.value = true;
};

const selectMuscle = (muscle) => {
  if (!selectedMuscles.value.includes(muscle)) {
    selectedMuscles.value.push(muscle);
  }
  musclesInput.value = '';
  showDropdown.value = false;
};

const removeMuscle = (muscle) => {
  selectedMuscles.value = selectedMuscles.value.filter(m => m !== muscle);
};


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
    await $fetch('http://localhost:8000/api/exercises', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenCookie.value}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: name.value.toLowerCase(),
        description: description.value.toLowerCase(),
        muscles: selectedMuscles.value.map(m => m.toLowerCase()).join(', ') // Convertir en string séparée par des virgules
      }
    });

    $toast.success("Exercice créé avec succès !");
    name.value = '';
    description.value = '';
    selectedMuscles.value = []; // Réinitialisation après envoi

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
