<template>
  <v-container class="max-w-3xl bg-gray-900 text-white rounded-lg shadow-lg py-6">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <div v-else-if="error" class="text-red-400 bg-red-900 p-4 rounded mb-4 text-center">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6 text-center">{{ session.name || "Séance sans nom" }}</h1>

      <!-- Informations principales -->
      <v-card class="mt-6 bg-gray-800">
        <v-card-text class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 class="text-lg font-medium">Durée :</h4>
            <p class="text-gray-300">{{ session.duration ?? '-' }} minutes</p>
          </div>
          <div>
            <h4 class="text-lg font-medium">Distance :</h4>
            <p class="text-gray-300">{{ session.distance ?? '-' }} km</p>
          </div>
        </v-card-text>
      </v-card>

      <!-- Plans associés -->
      <div v-if="associatedPlans.length" class="mt-6">
        <h4 class="text-lg font-medium mb-2">Plans associés :</h4>
        <v-chip-group>
          <v-chip
              v-for="plan in associatedPlans"
              :key="plan.id"
              class="cursor-pointer"
              @click="goToPlan(plan.id)"
          >
            {{ plan.name }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Liste des exercices -->
      <div v-if="session.exercises?.length" class="mt-6">
        <h4 class="text-lg font-medium mb-2">Exercices :</h4>
        <v-list dense>
          <v-list-item v-if="session.exercises" v-for="exercise in session.exercises" :key="exercise.id">
              <v-list-item-title>{{ exercise.name }}</v-list-item-title>
              <v-list-item-subtitle v-if="exercise.description">
                {{ exercise.description }}
              </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- Actions -->
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
const associatedPlans = ref([]); // Liste des plans associés récupérés

const fetchSession = async () => {
  try {
    const response = await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    session.value = response;
    session.value.exercises = session.value.exercises ?? [];

    // Vérifier si la session a des plans associés sous forme d'IRI
    if (session.value.plans?.length) {
      await fetchPlansDetails(session.value.plans);
    }

  } catch (err) {
    console.error(err);
    error.value = "Impossible de charger la séance.";
  } finally {
    loading.value = false;
  }
};

// Récupère les détails des plans associés
const fetchPlansDetails = async (planIRIs) => {
  try {
    const planRequests = planIRIs.map(planIRI =>
        $fetch(`http://localhost:8000${planIRI}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
    );

    associatedPlans.value = await Promise.all(planRequests);
  } catch (err) {
    console.error("Erreur lors du chargement des plans associés", err);
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

const goToPlan = (planId) => {
  router.push(`/plan/${planId}`);
};

onMounted(fetchSession);
</script>
