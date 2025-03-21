<template>
  <v-container class="max-w-3xl bg-gray-900 text-white rounded-lg shadow-2xl space-console p-6">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <div v-else-if="error" class="text-red-400 bg-red-900 p-2 rounded mb-4 text-center neon-alert">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6 neon-title">
        {{ exercise.name }}
      </h1>

      <v-card class="mt-6 bg-gray-800 border border-gray-700 p-4 neon-panel">
        <v-card-text>
          <h4 class="text-lg font-medium glow-subtitle">Description :</h4>
          <p class="text-gray-300">
            {{ exercise.description || 'Aucune description' }}
          </p>
        </v-card-text>
      </v-card>

      <v-card class="mt-4 bg-gray-800 border border-gray-700 p-4 neon-panel">
        <v-card-text>
          <h4 class="text-lg font-medium glow-subtitle">Muscles sollicités :</h4>
          <p class="text-gray-300">{{ exercise.muscles || 'Non spécifiés' }}</p>
        </v-card-text>
      </v-card>

      <v-card class="mt-4 bg-gray-800 border border-gray-700 p-4 neon-panel">
        <v-card-text>
          <h4 class="text-lg font-medium glow-subtitle">Statut :</h4>
          <p class="text-gray-300">
            <span v-if="exercise.status === 1" class="text-green-400">(Public)</span>
            <span v-else class="text-yellow-400">(Privé)</span>
          </p>
        </v-card-text>
      </v-card>

      <div v-if="exercise.createdBy.id === user?.id" class="mt-6 flex justify-end">
        <v-btn color="primary" @click="editExercise" class="futuristic-btn">
          Modifier
        </v-btn>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from '#vue-router';
import { useNuxtApp } from '#app';

definePageMeta({ middleware: "auth" });
useHead({ title: "Détail d'un exercice" });

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
      headers: { "Authorization": `Bearer ${token}` }
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

<style scoped>
.space-console {
  background: radial-gradient(ellipse at center, rgba(20,20,20,1) 0%, rgba(10,10,10,1) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 0 30px rgba(0,255,255,0.05), inset 0 0 20px rgba(0,255,255,0.02);
}

.neon-alert {
  text-shadow: 0 0 4px rgba(255, 0, 0, 0.6);
}

.neon-title {
  color: #fff;
  text-shadow:
      0 0 6px rgba(0, 200, 255, 0.6),
      0 0 10px rgba(0, 200, 255, 0.3);
}

.neon-panel {
  transition: box-shadow 0.3s;
}
.neon-panel:hover {
  box-shadow: 0 0 10px rgba(0,255,255,0.1);
}

.glow-subtitle {
  text-shadow: 0 0 3px rgba(0, 255, 255, 0.4);
}

.futuristic-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.2s ease;
}
.futuristic-btn:hover {
  transform: scale(1.05);
}
</style>
