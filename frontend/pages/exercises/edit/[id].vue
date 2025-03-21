<template>
  <v-container class="max-w-3xl bg-gray-900 text-white rounded-lg shadow-2xl space-console p-6">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <div v-else-if="error" class="text-red-400 bg-red-900 p-2 rounded mb-4 text-center neon-alert">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6 neon-title">
        Modifier l'exercice
      </h1>

      <v-form @submit.prevent="updateExercise" class="space-y-5">
        <v-text-field
            v-model="exercise.name"
            label="Nom de l'exercice"
            class="neon-input"
            required
        />

        <v-textarea
            v-model="exercise.description"
            label="Description"
            class="neon-input"
        />

        <v-text-field
            v-model="exercise.muscles"
            label="Muscles sollicités"
            class="neon-input"
        />

        <div class="mt-6 flex justify-between">
          <v-btn type="submit" color="primary" class="futuristic-btn">
            Enregistrer
          </v-btn>
          <v-btn color="red" @click="confirmDelete" class="futuristic-btn">
            Supprimer
          </v-btn>
        </div>
      </v-form>
    </div>

    <!-- Modale de confirmation pour la suppression -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card class="bg-gray-800 text-white border border-gray-700 space-console">
        <v-card-title class="font-bold">Supprimer l'exercice</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" text @click="deleteExercise">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
const modalVisible = ref(false);

useHead({ title: "Modification d'un exercice" });
definePageMeta({ middleware: "auth" });

const fetchExercise = async () => {
  try {
    exercise.value = await $fetch(`http://localhost:8000/api/exercises/${route.params.id}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    // Vérifie que l'utilisateur est le créateur de l'exercice
    if (exercise.value.createdBy.id !== $user.value?.id) {
      throw new Error("Vous n'êtes pas autorisé à modifier cet exercice.");
    }
  } catch (err) {
    console.error(err);
    error.value = "Impossible de charger l'exercice.";
  } finally {
    loading.value = false;
  }
};

const updateExercise = async () => {
  try {
    await $fetch(`http://localhost:8000/api/exercises/${route.params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/merge-patch+json",
        "Authorization": `Bearer ${token}`
      },
      body: {
        name: exercise.value.name,
        description: exercise.value.description,
        muscles: exercise.value.muscles
      },
    });
    $toast.success("Exercice mis à jour !");
    await router.push(`/exercises/${route.params.id}`);
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la mise à jour.");
  }
};

const confirmDelete = () => {
  modalVisible.value = true;
};

const deleteExercise = async () => {
  try {
    await $fetch(`http://localhost:8000/api/exercises/${route.params.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    $toast.success("Exercice supprimé !");
    await router.push("/exercises");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la suppression.");
  } finally {
    modalVisible.value = false;
  }
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

.neon-input .v-label {
  text-shadow:
      0 0 3px rgba(0, 255, 255, 0.4);
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
