<template>
  <v-container class="max-w-3xl bg-gray-900 text-white rounded-lg shadow-lg py-6">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <div v-else-if="error" class="text-red-400 bg-red-900 p-2 rounded mb-4 text-center">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6">Modifier la séance</h1>

      <v-form @submit.prevent="updateSession">
        <!-- Nom de la séance -->
        <v-text-field
            v-model="session.name"
            label="Nom de la séance"
            class="mb-4"
            color="primary"
            required
        />

        <!-- Durée -->
        <v-text-field
            v-model.number="session.duration"
            label="Durée (minutes)"
            class="mb-4"
            type="number"
            color="primary"
        />

        <!-- Distance -->
        <v-text-field
            v-model.number="session.distance"
            label="Distance (km)"
            class="mb-4"
            type="number"
            color="primary"
        />

        <!-- Toggle pour définir si la séance appartient à un plan -->
        <v-switch
            v-model="isIndependent"
            label="Séance indépendante"
            class="mb-4"
            color="primary"
            @change="toggleSessionType"
        />

        <!-- Sélection des plans (uniquement si la séance n'est pas indépendante) -->
        <v-autocomplete
            v-if="!isIndependent"
            v-model="selectedPlans"
            :items="availablePlans"
            item-title="name"
            item-value="id"
            label="Associer aux plans"
            multiple
            class="mb-4"
            color="primary"
        />

        <!-- Boutons -->
        <div class="flex justify-between">
          <v-btn type="submit" color="primary">Enregistrer</v-btn>
          <v-btn color="red" @click="confirmDelete">Supprimer</v-btn>
        </div>
      </v-form>
    </div>

    <!-- Modale de confirmation de suppression -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card>
        <v-card-title>Supprimer la séance</v-card-title>
        <v-card-text>Êtes-vous sûr de vouloir supprimer cette séance ?</v-card-text>
        <v-card-actions>
          <v-btn text @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" text @click="deleteSession">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "#vue-router";
import { useNuxtApp } from "#app";

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

const session = ref({ name: "", duration: null, distance: null, plans: [] });
const availablePlans = ref([]);
const selectedPlans = ref([]);
const isIndependent = ref(false); // Ajout du toggle pour session indépendante
const loading = ref(true);
const error = ref(null);
const modalVisible = ref(false);

const fetchSession = async () => {
  try {
    const response = await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    session.value = response;
    selectedPlans.value = response.plans?.map(plan => plan.id) || [];

    // Si aucun plan n'est associé, on considère la séance comme indépendante
    isIndependent.value = selectedPlans.value.length === 0;

  } catch (err) {
    console.error(err);
    error.value = "Impossible de charger la séance.";
  } finally {
    loading.value = false;
  }
};

const fetchPlans = async () => {
  try {
    const response = await $fetch("http://localhost:8000/api/plans/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    availablePlans.value = response.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement des plans.");
  }
};

const updateSession = async () => {
  try {
    await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/merge-patch+json" // ✅ Correction ici
      },
      body: {
        name: session.value.name,
        duration: session.value.duration,
        distance: session.value.distance,
        plans: isIndependent.value ? [] : selectedPlans.value.map(id => `/api/plans/${id}`)
      }
    });

    $toast.success("Séance mise à jour !");
    await router.push(`/session/${route.params.id}`);

  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la mise à jour.");
  }
};


// Gère le changement d'état entre séance liée à un plan ou indépendante
const toggleSessionType = () => {
  if (isIndependent.value) {
    selectedPlans.value = []; // Si indépendant, vider les plans sélectionnés
  }
};

const confirmDelete = () => {
  modalVisible.value = true;
};

const deleteSession = async () => {
  try {
    await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    $toast.success("Séance supprimée !");
    await router.push("/dashboard");

  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la suppression.");
  } finally {
    modalVisible.value = false;
  }
};

onMounted(() => {
  fetchSession();
  fetchPlans();
});
</script>
