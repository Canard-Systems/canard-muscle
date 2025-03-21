<template>
  <div>
    <v-progress-linear
        v-if="loading"
        indeterminate
        class="neon-progress"
    ></v-progress-linear>

    <!-- Liste des plans -->
    <div v-else>
      <div v-if="plans.length" class="space-y-4 mb-4">
        <v-card
            v-for="plan in plans"
            :key="plan.id"
            class="relative neon-card p-4 transition duration-200"
        >
          <!-- Menu (3 points) -->
          <div class="absolute top-2 right-2">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props" class="text-gray-400 hover:text-gray-200"></v-btn>
              </template>
              <v-list>
                <v-list-item @click="editPlan(plan.id)">
                  <v-list-item-title>Modifier</v-list-item-title>
                </v-list-item>
                <v-list-item @click="confirmDelete(plan)">
                  <v-list-item-title class="text-red-400">
                    Supprimer
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <!-- Nom du plan -->
          <v-card-title @click="goToPlan(plan.id)" class="cursor-pointer neon-title text-2xl font-semibold">
            {{ plan.name || 'Nouveau plan' }}
          </v-card-title>

          <!-- Objectif -->
          <v-card-subtitle v-if="plan.goal" class="mt-2 text-lg text-gray-300">
            {{ plan.goal }}
          </v-card-subtitle>

          <v-card-text>
            <p class="text-sm text-gray-300 mt-2">
              Créé le : {{ formatDate(plan.createdAt) }}
            </p>
            <p class="text-sm text-gray-300">
              Mis à jour le :
              {{ plan.updatedAt ? formatDate(plan.updatedAt) : formatDate(plan.createdAt) }}
            </p>
          </v-card-text>

          <!-- Détails expand/collapse -->
          <v-expand-transition>
            <div
                v-if="expandedPlan === plan.id"
                class="mt-4 bg-gray-800 bg-opacity-50 p-4 rounded neon-panel"
            >
              <div class="flex flex-col sm:flex-row justify-between">
                <div>
                  <h4 class="text-lg font-medium glow-subtitle">Durée :</h4>
                  <p class="text-gray-300">
                    {{ plan.duration || 0 }} semaines
                  </p>
                </div>
                <div>
                  <h4 class="text-lg font-medium glow-subtitle">
                    Fréquence :
                  </h4>
                  <p class="text-gray-300">
                    {{ plan.trainingDays?.length || 0 }} jours/semaine
                  </p>
                </div>
              </div>
            </div>
          </v-expand-transition>

          <v-card-actions>
            <v-btn text color="blue-lighten-1" @click="toggleDetails(plan.id)" class="futuristic-btn">
              {{ expandedPlan === plan.id ? 'Réduire' : 'Voir plus' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>

      <p v-else class="text-center">
        Vous n'avez pas encore de plans.
      </p>
    </div>

    <!-- Bouton créer un plan -->
    <div class="mt-4">
      <v-btn color="primary" @click="createPlan" class="futuristic-btn">
        Créer un plan
      </v-btn>
    </div>

    <!-- Modale de confirmation -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card class="bg-gray-800 text-white border border-gray-700 neon-alert">
        <v-card-title class="font-bold">
          Supprimer le plan
        </v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce plan ? Action irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" text @click="deletePlan">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from '#vue-router';
import { useNuxtApp } from '#app';

const { $toast } = useNuxtApp();
const router = useRouter();
const token = useCookie('token').value;

const plans = ref([]);
const loading = ref(true);

const modalVisible = ref(false);
const planToDelete = ref(null);
const expandedPlan = ref<number | null>(null);

// Récupération des plans
const fetchPlans = async () => {
  loading.value = true;
  try {
    const response = await $fetch('http://localhost:8000/api/plans/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    plans.value = response.member || [];
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors du chargement des plans.");
  } finally {
    loading.value = false;
  }
};

const createPlan = async () => {
  try {
    loading.value = true;
    const newPlan = await $fetch('http://localhost:8000/api/plans', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {}
    });
    $toast.success("Plan créé avec succès !");
    router.push(`/plan/edit/${newPlan.id}`);
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la création du plan.");
  } finally {
    loading.value = false;
  }
};

const editPlan = (planId: number) => {
  router.push(`/plan/edit/${planId}`);
};

const goToPlan = (planId: number) => {
  router.push(`/plan/${planId}`);
};

const confirmDelete = (plan) => {
  planToDelete.value = plan;
  modalVisible.value = true;
};

const deletePlan = async () => {
  if (!planToDelete.value) return;
  try {
    await $fetch(`http://localhost:8000/api/plans/${planToDelete.value.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    $toast.success("Plan supprimé avec succès !");
    plans.value = plans.value.filter(p => p.id !== planToDelete.value.id);
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la suppression du plan.");
  } finally {
    modalVisible.value = false;
  }
};

const toggleDetails = (planId: number) => {
  expandedPlan.value = expandedPlan.value === planId ? null : planId;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

onMounted(fetchPlans);
</script>

<style scoped>
.neon-progress {
  --v-progress-linear-height: 4px;
}

/* Card principale */
.neon-card {
  background: rgba(40, 40, 40, 0.8);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 0 10px rgba(0,255,255,0.05);
}
.neon-card:hover {
  box-shadow: 0 0 20px rgba(0,255,255,0.07);
}

/* Titre du plan */
.neon-title {
  text-shadow: 0 0 4px rgba(0,255,255,0.3);
}

.neon-alert {
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.2),
  inset 0 0 10px rgba(255, 0, 0, 0.1);
}

.neon-panel {
  transition: box-shadow 0.3s;
}
.neon-panel:hover {
  box-shadow: 0 0 8px rgba(0,255,255,0.1);
}

.glow-subtitle {
  text-shadow: 0 0 3px rgba(0,255,255,0.4);
}

/* Boutons futuristes */
.futuristic-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.2s ease;
}
.futuristic-btn:hover {
  transform: scale(1.05);
}
</style>
