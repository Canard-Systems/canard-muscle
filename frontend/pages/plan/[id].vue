<template>
  <v-container class="max-w-3xl neon-bg text-white rounded-lg shadow-2xl py-6">
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <div v-else-if="error" class="text-red-400 bg-red-900 p-4 rounded mb-4 text-center neon-alert">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6 text-center neon-title">
        {{ plan.name || "Nom du plan" }}
      </h1>
      <p class="text-lg text-gray-300">{{ plan.goal || "Pas d'objectif défini" }}</p>

      <!-- Informations générales -->
      <v-card class="mt-6 bg-gray-800 border border-gray-700 neon-panel">
        <v-card-text class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 class="text-lg font-medium glow-subtitle">Durée :</h4>
            <p class="text-gray-300">{{ plan.duration || '-' }} semaines</p>
          </div>
          <div>
            <h4 class="text-lg font-medium glow-subtitle">Fréquence :</h4>
            <p class="text-gray-300">{{ plan.trainingDays?.length || 0 }} jours/semaine</p>
          </div>
        </v-card-text>
      </v-card>

      <!-- Liste des sessions associées -->
      <div v-if="associatedSessions.length" class="mt-6">
        <h4 class="text-lg font-medium mb-2 glow-subtitle">
          Sessions :
        </h4>
        <v-list dense>
          <v-list-item
              v-for="session in associatedSessions"
              :key="session.id"
              class="flex justify-between items-center neon-item"
          >
            <div>
              <v-list-item-title class="text-sm">
                {{ session.name }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-gray-300">
                {{ session.exercises?.length || 0 }} exercices
              </v-list-item-subtitle>
            </div>
            <v-list-item-action>
              <v-btn icon="mdi-pencil" @click="goToSession(session.id)" />
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex justify-between">
        <v-btn color="primary" @click="editPlan" class="futuristic-btn">
          Modifier
        </v-btn>
        <v-btn color="red" @click="confirmDelete" class="futuristic-btn">
          Supprimer
        </v-btn>
      </div>
    </div>

    <!-- Modale de confirmation -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card class="bg-gray-800 text-white border border-gray-700 neon-alert">
        <v-card-title class="font-bold">
          Supprimer le plan
        </v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce plan ?
          Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" text @click="deletePlan">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from '#vue-router';
import { useNuxtApp } from '#app';

definePageMeta({
  middleware: 'auth'
})
useHead({
  title: 'Détails du plan',
  meta: [
    { name: 'description', content: 'Détails du plan d\'entraînement' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
})

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

const plan = ref(null);
const loading = ref(true);
const error = ref(null);
const modalVisible = ref(false);
const associatedSessions = ref([]);

const fetchPlan = async () => {
  try {
    const response = await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/plans/${route.params.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    plan.value = response;

    if (plan.value.sessions?.length) {
      await fetchSessionsDetails(plan.value.sessions);
    }
  } catch (err) {
    console.error(err);
    error.value = "Impossible de charger le plan.";
  } finally {
    loading.value = false;
  }
};

const fetchSessionsDetails = async (sessionIRIs) => {
  try {
    const sessionRequests = sessionIRIs.map(sessionIRI =>
        $fetch(`http://localhost:8000${sessionIRI}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
    );
    associatedSessions.value = await Promise.all(sessionRequests);
  } catch (err) {
    console.error("Erreur lors du chargement des sessions associées", err);
  }
};

const editPlan = () => {
  router.push(`/plan/edit/${route.params.id}`);
};

const confirmDelete = () => {
  modalVisible.value = true;
};

const deletePlan = async () => {
  try {
    await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/plans/${route.params.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    $toast.success("Plan supprimé !");
    await router.push("/");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la suppression.");
  } finally {
    modalVisible.value = false;
  }
};

const goToSession = (sessionId) => {
  router.push(`/session/${sessionId}`);
};

onMounted(fetchPlan);
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
  text-shadow: 0 0 4px rgba(0,255,255,0.4), 0 0 8px rgba(0,255,255,0.2);
}
.neon-alert {
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.2), inset 0 0 10px rgba(255, 0, 0, 0.1);
}
.neon-item:hover {
  background-color: rgba(255,255,255,0.05);
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
