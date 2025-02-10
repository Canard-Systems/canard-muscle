<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-gray-100 p-4 md:p-6 relative">
    <!-- Formulaire de création de session -->
    <div class="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full md:max-w-md">
      <h1 class="text-xl md:text-2xl font-bold mb-4">Créer une session d'entraînement</h1>

      <form @submit.prevent="createSession">
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium text-gray-700">Nom de la session</label>
          <input type="text" id="name" v-model="session.name" required
                 class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
        </div>

        <button type="submit"
                class="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-indigo-700 w-full">
          Ajouter la session
        </button>
      </form>
    </div>

    <!-- Sélection des exercices pour la session -->
    <div v-if="sessionCreated" class="mt-6 md:ml-6 bg-white p-6 rounded-lg shadow-lg w-full">
      <h2 class="text-lg md:text-xl font-bold mb-4">Ajouter des exercices à la session</h2>

      <ExerciseList ref="exerciseListRef" api-url="http://localhost:8000/api/exercises/filtered" :userId="$user.id">
        <template #actions="{ exercise }">
          <button @click="addExerciseToSession(exercise)"
                  class="text-green-600 hover:text-green-800 px-4 py-1 rounded-md bg-green-100">
            ➕ Ajouter
          </button>
        </template>
      </ExerciseList>
    </div>

    <!-- Liste des exercices ajoutés -->
    <div v-if="sessionExercises.length > 0" class="mt-6 bg-white p-6 rounded-lg shadow-lg w-full">
      <h2 class="text-lg md:text-xl font-bold mb-4">Exercices de la session</h2>

      <ul>
        <li v-for="(exercise, index) in sessionExercises" :key="index"
            class="p-3 border rounded-md shadow-sm bg-gray-50 mb-2 flex justify-between">
          <div>
            <p class="font-bold">{{ exercise.name }}</p>
          </div>
          <button @click="removeExerciseFromSession(exercise.id)"
                  class="text-red-600 hover:text-red-800 px-2 py-1 rounded-md bg-red-100">
            🗑️ Retirer
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { useNuxtApp, useCookie } from "#app";
import ExerciseList from "@/components/ExerciseList.vue";

const { $toast } = useNuxtApp();
const tokenCookie = useCookie("token");

const exerciseListRef = ref(null);
const session = ref({ name: "" });
const sessionCreated = ref(false);
const sessionId = ref(null);
const sessionExercises = ref([]);

const createSession = async () => {
  if (!session.value.name) {
    $toast.error("Veuillez entrer un nom pour la session.");
    return;
  }

  try {
    const response = await $fetch("http://localhost:8000/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
        "Content-Type": "application/json",
      },
      body: { name: session.value.name },
    });

    sessionId.value = response.id;
    sessionCreated.value = true;
    $toast.success("Session créée avec succès !");
  } catch (error) {
    $toast.error("Erreur lors de la création de la session.");
    console.error(error);
  }
};

const addExerciseToSession = async (exercise) => {
  if (!sessionId.value) {
    $toast.error("Créez d'abord une session.");
    return;
  }

  try {
    const response = await $fetch("http://localhost:8000/api/session_exercises", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
        "Content-Type": "application/json",
      },
      body: {
        session: `/api/sessions/${sessionId.value}`,
        exercise: `/api/exercises/${exercise.id}`,
      },
    });

    sessionExercises.value.push({ id: response.id, name: exercise.name });
    $toast.success("Exercice ajouté à la session !");
  } catch (error) {
    $toast.error("Erreur lors de l'ajout de l'exercice.");
    console.error(error);
  }
};

const removeExerciseFromSession = async (sessionExerciseId) => {
  try {
    await $fetch(`http://localhost:8000/api/session_exercises/${sessionExerciseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });

    sessionExercises.value = sessionExercises.value.filter(ex => ex.id !== sessionExerciseId);
    $toast.success("Exercice retiré de la session !");
  } catch (error) {
    $toast.error("Erreur lors de la suppression de l'exercice.");
    console.error(error);
  }
};

onMounted(() => {
  exerciseListRef.value?.fetchExercises();
});

</script>
