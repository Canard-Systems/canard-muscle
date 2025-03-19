<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white p-8">
    <!-- Header -->
    <header class="mb-8 flex items-center justify-between">
      <h1 class="text-4xl font-bold">Tableau de bord</h1>
      <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded shadow">
        Profil
      </button>
    </header>

    <!-- Grid principal -->
    <main class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Section Plans d'entraînement -->
      <section class="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold mb-4">Mes plans d'entraînement</h2>
        <PlanList
            :plans="myPlans"
            :loading="loading"
            @create-plan="createPlan"
            @navigate="goToPlan"
            @delete-plan="handleDeletePlan"
        />
      </section>

      <!-- Section Graphiques -->
      <section class="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold mb-4">Graphiques</h2>
        <div class="h-48 flex items-center justify-center border border-dashed border-gray-400 rounded">
          <p>Graphiques en cours de développement...</p>
        </div>
      </section>

      <!-- Section Liste des exercices -->
      <section class="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold mb-4">Liste des exercices</h2>
        <ul>
          <li
              v-for="exercise in exercises"
              :key="exercise.id"
              class="mb-2 border-b border-gray-500 pb-1"
          >
            <span class="font-medium">{{ exercise.name }}</span> - {{ exercise.description }}
          </li>
        </ul>
      </section>

      <!-- Section Dernières séances -->
      <section class="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold mb-4">Dernières séances</h2>
        <ul>
          <li
              v-for="session in recentSessions"
              :key="session.id"
              class="mb-2 flex justify-between border-b border-gray-500 pb-1"
          >
            <span>{{ session.date }}</span>
            <span>{{ session.summary }}</span>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from '#vue-router';
import { useNuxtApp } from '#app';
import PlanList from '@/components/PlanList.vue';

const { $toast } = useNuxtApp();
const router = useRouter();
const token = useCookie('token').value;
// Données statiques en dur pour l'instant
const myPlans = ref([]);
const loading = ref(false);

const fetchPlans = async () => {
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

const handleDeletePlan = async (planId) => {
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

const createPlan = () => {
  $toast.success("Création d'un nouveau plan (donnée en dur)");
  // Pour l'instant, redirige vers une page d'édition fictive
  router.push(`/plan/edit/99`);
};

const goToPlan = (planId: number) => {
  router.push(`/plan/edit/${planId}`);
};

onMounted(fetchPlans);

</script>
