<template>
  <v-container class="max-w-3xl bg-gray-900 text-white rounded-lg shadow-lg py-6">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <div v-else-if="error" class="text-red-400 bg-red-900 p-2 rounded mb-4 text-center">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6">{{ exercise.name }}</h1>

      <v-card class="mt-6 bg-gray-800">
        <v-card-text>
          <h4 class="text-lg font-medium">Description :</h4>
          <p class="text-gray-300">{{ exercise.description || 'Aucune description' }}</p>
        </v-card-text>
      </v-card>

      <v-card class="mt-4 bg-gray-800">
        <v-card-text>
          <h4 class="text-lg font-medium">Muscles sollicités :</h4>
          <p class="text-gray-300">{{ exercise.muscles || 'Non spécifiés' }}</p>
        </v-card-text>
      </v-card>

      <v-card class="mt-4 bg-gray-800">
        <v-card-text>
          <h4 class="text-lg font-medium">Statut :</h4>
          <p class="text-gray-300">
            <span v-if="exercise.status === 1" class="text-green-400">(Public)</span>
            <span v-else class="text-yellow-400">(Privé)</span>
          </p>
        </v-card-text>
      </v-card>

      <div v-if="exercise.createdBy.id === user?.id" class="mt-6 flex justify-between">
        <v-btn color="primary" @click="editExercise">Modifier</v-btn>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from '#vue-router';
import { useNuxtApp } from '#app';

const { $toast, $user } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

const exercise = ref(null);
const loading = ref(true);
const error = ref(null);
const user = $user.value;

const fetchExercise = async () => {
  try {
    exercise.value = await $fetch(`http://localhost:8000/api/exercises/${route.params.id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error(err);
    error.value = "Impossible de charger l'exercice.";
  } finally {
    loading.value = false;
  }
};

const editExercise = () => {
  router.push(`/exercises/edit/${route.params.id}`);
};

onMounted(fetchExercise);
</script>
