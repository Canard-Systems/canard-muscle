<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Modifier le plan d'entraînement</h1>
    <div v-if="loading" class="text-center">Chargement...</div>
    <div v-else>
      <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>
      <form @submit.prevent="updatePlan" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Nom du plan</label>
          <input
              v-model="plan.name"
              type="text"
              id="name"
              name="name"
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label for="goal" class="block text-sm font-medium text-gray-700">Objectif</label>
          <textarea
              v-model="plan.goal"
              id="goal"
              name="goal"
              required
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Sauvegarder les modifications
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from '#vue-router';
import { useHead } from '#app';

useHead({ title: "Modification d'un plan d'entraînement" });
definePageMeta({ middleware: "auth" });

const route = useRoute();
const router = useRouter();
const token = useCookie('token').value;
const planId = route.params.id;

const plan = ref({ name: "", goal: "" });
const loading = ref(true);
const error = ref("");

const fetchPlan = async () => {
  try {
    const res = await $fetch(`http://localhost:8000/api/plans/${planId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    plan.value = res;
  } catch (err) {
    console.error(err);
    error.value = "Erreur lors du chargement du plan.";
  } finally {
    loading.value = false;
  }
};

const updatePlan = async () => {
  try {
    await $fetch(`http://localhost:8000/api/plans/${planId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/merge-patch+json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: plan.value.name,
        goal: plan.value.goal
      })
    });
    router.push("/");
  } catch (err) {
    console.error(err);
    error.value = "Erreur lors de la mise à jour du plan.";
  }
};

onMounted(() => {
  if (planId) {
    fetchPlan();
  } else {
    loading.value = false;
  }
});
</script>

<style scoped>
/* Tailwind gère la plupart du styles */
</style>
