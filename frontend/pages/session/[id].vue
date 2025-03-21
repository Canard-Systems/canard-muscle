<template>
  <v-container class="max-w-3xl neon-bg text-white rounded-lg shadow-2xl py-6">
    <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        class="neon-progress"
    ></v-progress-linear>

    <div v-else-if="error" class="text-red-400 bg-red-900 p-4 rounded mb-4 text-center neon-alert">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6 text-center neon-title">
        {{ session.name || "Séance sans nom" }}
      </h1>

      <!-- Informations principales -->
      <v-card class="mt-6 bg-gray-800 neon-panel">
        <v-card-text class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 class="text-lg font-medium glow-subtitle">Durée :</h4>
            <p class="text-gray-300">{{ session.duration ?? '-' }} minutes</p>
          </div>
          <div>
            <h4 class="text-lg font-medium glow-subtitle">Distance :</h4>
            <p class="text-gray-300">{{ session.distance ?? '-' }} km</p>
          </div>
        </v-card-text>
      </v-card>

      <!-- Plans associés -->
      <div v-if="associatedPlans.length" class="mt-6">
        <h4 class="text-lg font-medium mb-2 glow-subtitle">
          Plans associés :
        </h4>
        <v-chip-group>
          <v-chip
              v-for="plan in associatedPlans"
              :key="plan.id"
              class="cursor-pointer neon-item"
              @click="goToPlan(plan.id)"
          >
            {{ plan.name }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Liste des exercices -->
      <div v-if="session.exercises?.length" class="mt-6">
        <h4 class="text-lg font-medium mb-2 glow-subtitle">
          Exercices :
        </h4>
        <v-list dense>
          <v-list-item
              v-for="exercise in session.exercises"
              :key="exercise.id"
              class="neon-item"
          >
            <v-list-item-title>
              {{ exercise.name }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="exercise.description" class="text-gray-300">
              {{ exercise.description }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex justify-between">
        <v-btn color="primary" @click="editSession" class="futuristic-btn">
          Modifier
        </v-btn>
        <v-btn color="red" @click="confirmDelete" class="futuristic-btn">
          Supprimer
        </v-btn>
      </div>
    </div>

    <!-- Modale de confirmation -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card class="bg-gray-800 neon-alert">
        <v-card-title class="font-bold">
          Supprimer la séance
        </v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer cette séance ?
        </v-card-text>
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

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Détails de la séance' });

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

const session = ref(null);
const loading = ref(true);
const error = ref(null);
const modalVisible = ref(false);
const associatedPlans = ref([]);

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

const fetchPlansDetails = async (planIRIs) => {
  try {
    const planRequests = planIRIs.map((planIRI) =>
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
      headers: { "Authorization": `Bearer ${token}` }
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

<style scoped>
.neon-bg {
  background: radial-gradient(circle, #141414 0%, #0a0a0a 100%);
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 0 20px rgba(0,255,255,0.04), inset 0 0 10px rgba(0,255,255,0.02);
  transition: box-shadow 0.3s;
}
.neon-bg:hover {
  box-shadow: 0 0 30px rgba(0,255,255,0.06), inset 0 0 20px rgba(0,255,255,0.04);
}
.neon-title {
  text-shadow: 0 0 4px rgba(0,255,255,0.3), 0 0 8px rgba(0,255,255,0.2);
}
.neon-alert {
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.2), inset 0 0 10px rgba(255, 0, 0, 0.1);
}
.neon-panel {
  transition: box-shadow 0.3s;
}
.neon-panel:hover {
  box-shadow: 0 0 8px rgba(0,255,255,0.1);
}
.neon-item:hover {
  background-color: rgba(255,255,255,0.05);
}
.glow-subtitle {
  text-shadow: 0 0 3px rgba(0,255,255,0.4);
}
.neon-progress {
  --v-progress-linear-height: 4px;
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
