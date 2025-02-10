<template>
  <div class="bg-white p-6 rounded-lg shadow-lg w-full">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
      <h2 class="text-lg md:text-xl font-bold">Liste des exercices</h2>

      <label class="flex items-center space-x-2 mt-2 md:mt-0">
        <input type="checkbox" v-model="filterByUser" class="form-checkbox h-5 w-5 text-indigo-600">
        <span class="text-sm text-gray-700">Mes exercices</span>
      </label>
    </div>

    <div class="mb-4">
      <input type="text" v-model="searchQuery" placeholder="Rechercher un exercice..."
             class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
    </div>

    <p v-if="isFetching" class="text-center text-gray-500 animate-pulse">Chargement des exercices...</p>

    <ul v-else-if="filteredExercises.length > 0" class="space-y-3">
      <li v-for="exercise in filteredExercises" :key="exercise.id" class="p-3 border rounded-md shadow-sm bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div class="mb-2 md:mb-0">
          <p class="text-lg font-semibold">{{ capitalizeFirstLetter(exercise.name) }}</p>
          <p class="text-sm text-gray-600">{{ capitalizeFirstLetter(exercise.description) || "Aucune description" }}</p>
          <p class="text-xs text-gray-500 mt-1">Muscles : {{ capitalizeFirstLetter(exercise.muscles) || "Non précisé" }}</p>
        </div>

        <slot name="actions" :exercise="exercise"></slot>
      </li>
    </ul>
    <p v-else class="text-gray-500 text-center mt-4">Aucun exercice trouvé.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useNuxtApp } from "#app";

const props = defineProps({
  apiUrl: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
});

const isFetching = ref(true);
const filterByUser = ref(false);
const searchQuery = ref("");
const exercises = ref([]);

const fetchExercises = async () => {
  try {
    isFetching.value = true;
    const response = await $fetch(props.apiUrl, {
      headers: { Authorization: `Bearer ${useCookie("token").value}` },
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

const filteredExercises = computed(() => {
  let filtered = exercises.value;
  if (filterByUser.value) {
    filtered = filtered.filter(ex => ex.createdBy === `/api/users/${props.userId}`);
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

defineExpose({ fetchExercises });
</script>
