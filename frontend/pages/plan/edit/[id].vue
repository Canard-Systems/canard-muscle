<template>
  <div class="container mx-auto p-6 max-w-3xl bg-gray-900 text-white rounded-lg shadow-lg">
    <h1 class="text-3xl font-bold mb-6 text-center">Modifier le plan d'entraînement</h1>

    <div v-if="loading" class="text-center text-lg">Chargement...</div>

    <div v-else>
      <div v-if="error" class="text-red-400 bg-red-900 p-2 rounded mb-4 text-center">{{ error }}</div>

      <form @submit.prevent="updatePlan" class="space-y-6">
        <!-- Nom du Plan -->
        <div>
          <label for="name" class="block text-lg font-semibold">Nom du plan</label>
          <input
              v-model="plan.name"
              type="text"
              id="name"
              required
              class="w-full mt-2 p-2 rounded bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Objectif -->
        <div>
          <label for="goal" class="block text-lg font-semibold">Objectif</label>
          <textarea
              v-model="plan.goal"
              id="goal"
              required
              rows="3"
              class="w-full mt-2 p-2 rounded bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <!-- Durée -->
        <div>
          <label for="duration" class="block text-lg font-semibold">Durée (semaines)</label>
          <input
              v-model.number="plan.duration"
              type="number"
              id="duration"
              min="1"
              required
              class="w-full mt-2 p-2 rounded bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Jours d'entraînement -->
        <div>
          <label class="block text-lg font-semibold mb-2">Jours d'entraînement</label>
          <div class="grid grid-cols-4 gap-2">
            <button
                v-for="(day, key) in trainingDaysOptions"
                :key="key"
                type="button"
                @click="toggleTrainingDay(key)"
                :class="{
                'bg-blue-600 text-white': plan.trainingDays.includes(key),
                'bg-gray-800 text-gray-300': !plan.trainingDays.includes(key)
              }"
                class="p-2 rounded transition hover:bg-blue-700"
            >
              {{ day }}
            </button>
          </div>
        </div>

        <!-- Bouton de sauvegarde -->
        <button
            type="submit"
            class="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold"
        >
          Sauvegarder les modifications
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from '#vue-router';

useHead({ title: "Modification d'un plan d'entraînement" });
definePageMeta({ middleware: "auth" });

const route = useRoute();
const router = useRouter();
const token = useCookie('token').value;
const planId = route.params.id;

const plan = ref({
  name: "",
  goal: "",
  duration: 4,
  trainingDays: [],
});

// Liste des jours d'entraînement disponibles (français pour affichage, anglais pour l'API)
const trainingDaysOptions = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche"
};

const loading = ref(true);
const error = ref("");

// Charger les données du plan
const fetchPlan = async () => {
  try {
    const res = await $fetch(`http://localhost:8000/api/plans/${planId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    plan.value = {
      name: res.name || "",
      goal: res.goal || "",
      duration: res.duration || 4,
      trainingDays: res.trainingDays || [],
    };
  } catch (err) {
    console.error(err);
    error.value = "Erreur lors du chargement du plan.";
  } finally {
    loading.value = false;
  }
};

// Mise à jour du plan
const updatePlan = async () => {
  try {
    await $fetch(`http://localhost:8000/api/plans/${planId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/merge-patch+json",
        "Authorization": `Bearer ${token}`
      },
      body: {
        name: plan.value.name,
        goal: plan.value.goal,
        duration: plan.value.duration,
        trainingDays: plan.value.trainingDays
      }
    });

    await router.push("/");
  } catch (err) {
    console.error(err);
    error.value = "Erreur lors de la mise à jour du plan.";
  }
};

// Ajouter ou retirer un jour d'entraînement (en anglais pour l'API)
const toggleTrainingDay = (dayKey: string) => {
  if (plan.value.trainingDays.includes(dayKey)) {
    plan.value.trainingDays = plan.value.trainingDays.filter(d => d !== dayKey);
  } else {
    plan.value.trainingDays.push(dayKey);
  }
};

onMounted(fetchPlan);
</script>
