<template>
  <v-container fluid class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white py-8">
    <!-- Header -->
    <v-row align="center" justify="space-between" class="mb-8">
      <v-col>
        <h1 class="text-4xl font-bold">Tableau de bord</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" @click="goToProfile">Profil</v-btn>
      </v-col>
    </v-row>

    <!-- Grid principal -->
    <v-row dense>
      <!-- Section Plans d'entraînement -->
      <v-col cols="12" md="6">
        <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg">
          <v-card-title class="text-2xl font-semibold">Mes plans d'entraînement</v-card-title>
          <v-card-text>
            <PlanList
                :plans="myPlans"
                :loading="loading"
                @create-plan="createPlan"
                @edit-plan="editPlan"
                @navigate="goToPlan"
                @delete-plan="handleDeletePlan"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Section Dernières séances -->
      <v-col cols="12" md="6">
        <SessionList />
      </v-col>

      <!-- Section Graphiques -->
      <v-col cols="12" md="6">
        <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg">
          <v-card-title class="text-2xl font-semibold">Graphiques</v-card-title>
          <v-card-text class="h-48 flex items-center justify-center border border-dashed border-gray-400 rounded">
            <p>Graphiques en cours de développement...</p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Section Liste des exercices -->
      <v-col cols="12" md="6">
        <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg">
          <v-card-title class="text-2xl font-semibold">Liste des exercices</v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item v-for="exercise in exercises" :key="exercise.id">
                  <v-list-item-title class="font-medium">{{ exercise.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ exercise.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from '#vue-router';
import { useNuxtApp } from '#app';
import PlanList from '@/components/PlanList.vue';

definePageMeta({
  middleware: 'auth'
});
useHead(
  {
    title: 'Tableau de bord',
    meta: [
      { name: 'description', content: 'Tableau de bord de l\'application de fitness' }
    ]
  }
)
const { $toast } = useNuxtApp();
const router = useRouter();
const token = useCookie('token').value;

// Données statiques en dur pour l'instant
const myPlans = ref([]);
const loading = ref(false);

const fetchPlans = async () => {
  loading.value = true;
  try {
    const response = await $fetch('http://localhost:8000/api/plans/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    myPlans.value = response.member || [];
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors du chargement des plans");
  } finally {
    loading.value = false;
  }
};

const handleDeletePlan = async (planId: number) => {
  try {
    await $fetch(`http://localhost:8000/api/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    myPlans.value = myPlans.value.filter(plan => plan.id !== planId);
    $toast.success('Plan supprimé avec succès !');
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la suppression du plan.");
  }
};

const exercises = ref([
  { id: 1, name: 'Pompes', description: 'Exercice de poitrine' },
  { id: 2, name: 'Squats', description: 'Exercice pour les jambes' },
  { id: 3, name: 'Tractions', description: 'Exercice du dos' }
]);

const recentSessions = ref([
  { id: 1, date: '10 Juin 2023', summary: 'Session d’endurance' },
  { id: 2, date: '08 Juin 2023', summary: 'Session force' },
  { id: 3, date: '05 Juin 2023', summary: 'Session cardio' }
]);

const createPlan = async () => {
  try {
    loading.value = true;

    const newPlan = await $fetch('http://localhost:8000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: {}
    });

    $toast.success("Plan créé avec succès !");

    await router.push(`/plan/edit/${newPlan.id}`);
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la création du plan.");
  } finally {
    loading.value = false;
  }
};


const goToPlan = (planId: number) => {
  router.push(`/plan/${planId}`);
};
const editPlan = (planId: number) => {
  router.push(`/plan/edit/${planId}`);
};
const goToProfile = () => {
  router.push('/profile');
};

onMounted(fetchPlans);
</script>
