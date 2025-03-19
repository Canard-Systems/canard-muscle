<template>
  <v-container class="max-w-3xl bg-gray-900 text-white rounded-lg shadow-lg py-6">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <div v-else-if="error" class="text-red-400 bg-red-900 p-2 rounded mb-4 text-center">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6">{{ session.name || "Nom de la séance" }}</h1>

      <v-card class="mt-6 bg-gray-800">
        <v-card-text class="flex flex-col sm:flex-row justify-between">
          <div>
            <h4 class="text-lg font-medium">Durée :</h4>
            <p class="text-gray-300">{{ session.duration || '-' }} minutes</p>
          </div>
          <div>
            <h4 class="text-lg font-medium">Distance :</h4>
            <p class="text-gray-300">{{ session.distance || '-' }} km</p>
          </div>
        </v-card-text>
      </v-card>

      <div v-if="session.plans?.length" class="mt-6">
        <h4 class="text-lg font-medium">Plans associés :</h4>
        <v-list dense>
          <v-list-item v-for="plan in session.plans" :key="plan.id">
            <v-list-item-title>{{ plan.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <div v-if="session.exercises?.length" class="mt-6">
        <h4 class="text-lg font-medium">Exercices :</h4>
        <v-list dense>
          <v-list-item v-for="exercise in session.exercises" :key="exercise.id">
            <v-list-item-title class="text-sm">{{ exercise.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <div class="mt-6 flex justify-between">
        <v-btn color="primary" @click="editSession">Modifier</v-btn>
        <v-btn color="red" @click="confirmDelete">Supprimer</v-btn>
      </div>
    </div>

    <!-- Modale de confirmation pour la suppression -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card>
        <v-card-title>Supprimer la séance</v-card-title>
        <v-card-text>Êtes-vous sûr de vouloir supprimer cette séance ? Cette action est irréversible.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" text @click="deleteSession">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from '#vue-router';
import { useNuxtApp } from '#app';

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

const session = ref(null);
const loading = ref(true);
const error = ref(null);
const modalVisible = ref(false);

const fetchSession = async () => {
  try {
    session.value = await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error(err);
    error.value = "Impossible de charger la séance.";
  } finally {
    loading.value = false;
  }
};

const editSession = () => {
  router.push(`/session/edit/${route.params.id}`);
};

const confirmDelete = () => {
  modalVisible.value = true;
};

const deleteSession = async () => {
  try {
    await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    $toast.success("Séance supprimée !");
    await router.push("/");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la suppression.");
  } finally {
    modalVisible.value = false;
  }
};

onMounted(fetchSession);
</script>
