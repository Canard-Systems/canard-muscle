<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Mes plans d'entraînement</h2>
    <div v-if="loading" class="text-center p-4">Chargement...</div>
    <div v-else>
      <div v-if="plans.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div
            v-for="plan in plans"
            :key="plan.id"
            class="bg-white bg-opacity-10 backdrop-blur-sm border border-gray-600 rounded-lg p-4 cursor-pointer transition duration-200 hover:shadow-lg"
            @click="goToPlan(plan.id)"
        >
          <h3 class="text-xl font-semibold">{{ plan.name || 'Nouveau plan' }}</h3>
          <p v-if="plan.goal" class="mt-2">{{ plan.goal }}</p>
          <p class="text-sm text-gray-300 mt-2">Créé le : {{ formatDate(plan.createdAt) }}</p>
          <p class="text-sm text-gray-300">Mis à jour le : {{ formatDate(plan.updatedAt) ?? formatDate(plan.createdAt) }}</p>
          <div v-if="plan.sessions?.length" class="mt-4 bg-gray-800 bg-opacity-50 p-2 rounded">
            <h4 class="text-lg font-medium">Sessions :</h4>
            <ul class="list-disc pl-5">
              <li v-for="session in plan.sessions.slice(0, 3)" :key="session.id" class="text-sm">
                {{ session.name }} - {{ session.exercises.length }} exercices
              </li>
            </ul>
            <p v-if="plan.sessions.length > 3" class="text-sm">...</p>
          </div>
        </div>
      </div>
      <p v-else class="text-center">Vous n'avez pas encore de plans</p>
    </div>
    <div class="mt-4">
      <LoadingButton @click="$emit('create-plan')">
        Créer un plan
      </LoadingButton>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  plans: Array,
  loading: Boolean
});
const emit = defineEmits(['create-plan', 'navigate']);

const goToPlan = (planId) => {
  emit('navigate', planId);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>
