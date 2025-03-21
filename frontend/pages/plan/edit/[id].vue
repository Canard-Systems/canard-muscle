<template>
  <div class="container mx-auto p-6 max-w-3xl neon-bg text-white rounded-lg shadow-2xl">
    <h1 class="text-3xl font-bold mb-6 text-center neon-title">
      Modifier le plan d'entraînement
    </h1>

    <div v-if="loading" class="text-center text-lg neon-loading">
      Chargement...
    </div>

    <div v-else>
      <div v-if="error" class="text-red-400 bg-red-900 p-2 rounded mb-4 text-center neon-alert">
        {{ error }}
      </div>

      <form @submit.prevent="updatePlan" class="space-y-6">
        <!-- Nom du Plan -->
        <div>
          <label for="name" class="block text-lg font-semibold">
            Nom du plan
          </label>
          <input
              v-model="plan.name"
              type="text"
              id="name"
              required
              class="w-full mt-2 p-2 rounded neon-input"
          />
        </div>

        <!-- Objectif -->
        <div>
          <label for="goal" class="block text-lg font-semibold">
            Objectif
          </label>
          <textarea
              v-model="plan.goal"
              id="goal"
              required
              rows="3"
              class="w-full mt-2 p-2 rounded neon-input"
          ></textarea>
        </div>

        <!-- Durée -->
        <div>
          <label for="duration" class="block text-lg font-semibold">
            Durée (semaines)
          </label>
          <input
              v-model.number="plan.duration"
              type="number"
              id="duration"
              min="1"
              required
              class="w-full mt-2 p-2 rounded neon-input"
          />
        </div>

        <!-- Jours d'entraînement -->
        <div>
          <label class="block text-lg font-semibold mb-2">
            Jours d'entraînement
          </label>
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
            class="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold futuristic-btn"
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

// Liste des jours d'entraînement disponibles
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

// Charger le plan
const fetchPlan = async () => {
  try {
    const res = await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/plans/${planId}`, {
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

// Mettre à jour le plan
const updatePlan = async () => {
  try {
    await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/plans/${planId}`, {
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

// Ajouter/retirer un jour d'entraînement
const toggleTrainingDay = (dayKey: string) => {
  if (plan.value.trainingDays.includes(dayKey)) {
    plan.value.trainingDays = plan.value.trainingDays.filter(d => d !== dayKey);
  } else {
    plan.value.trainingDays.push(dayKey);
  }
};

onMounted(fetchPlan);
</script>

<style scoped>
.neon-bg {
  background: radial-gradient(circle, #141414 0%, #0a0a0a 100%);
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 0 20px rgba(0,255,255,0.04), inset 0 0 10px rgba(0,255,255,0.02);
}
.neon-bg:hover {
  box-shadow: 0 0 30px rgba(0,255,255,0.06), inset 0 0 20px rgba(0,255,255,0.04);
}
.neon-title {
  text-shadow: 0 0 4px rgba(0,255,255,0.4), 0 0 8px rgba(0,255,255,0.2);
}
.neon-alert {
  text-shadow: 0 0 4px rgba(255, 0, 0, 0.6);
}
.neon-loading {
  font-style: italic;
  opacity: 0.8;
}

/* Champs */
.neon-input {
  background-color: #2a2a2a;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.1);
  outline: none;
}
.neon-input:focus {
  outline: 2px solid rgba(0,255,255,0.3);
}

/* Bouton futuriste */
.futuristic-btn {
  transition: transform 0.2s ease;
  text-transform: uppercase;
}
.futuristic-btn:hover {
  transform: scale(1.05);
}
</style>
