<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate></v-progress-linear>
    <div v-else>
      <div v-if="plans.length" class="space-y-4 mb-4">
        <v-card
            v-for="plan in plans"
            :key="plan.id"
            class="relative bg-opacity-10 backdrop-blur-sm border border-gray-600 rounded-lg p-4 transition duration-200 hover:shadow-lg"
        >
          <!-- Menu options avec Vuetify -->
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
                  <v-list-item-title class="text-red-400">Supprimer</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <!-- Click sur le plan pour voir les détails -->
          <v-card-title @click="goToPlan(plan.id)" class="cursor-pointer">
            <h3 class="text-2xl font-semibold">{{ plan.name || 'Nouveau plan' }}</h3>
          </v-card-title>
          <v-card-subtitle v-if="plan.goal" class="mt-2 text-lg text-gray-300">{{ plan.goal }}</v-card-subtitle>
          <v-card-text>
            <p class="text-sm text-gray-300 mt-2">Créé le : {{ formatDate(plan.createdAt) }}</p>
            <p class="text-sm text-gray-300">Mis à jour le : {{ formatDate(plan.updatedAt) ?? formatDate(plan.createdAt) }}</p>
          </v-card-text>

          <!-- Détails du plan -->
          <v-expand-transition>
            <div v-if="expandedPlan === plan.id" class="mt-4 bg-gray-800 bg-opacity-50 p-4 rounded">
              <div class="flex flex-col sm:flex-row justify-between">
                <div>
                  <h4 class="text-lg font-medium">Durée :</h4>
                  <p class="text-gray-300">{{ plan.duration }} semaines</p>
                </div>
                <div>
                  <h4 class="text-lg font-medium">Fréquence :</h4>
                  <p class="text-gray-300">{{ plan.trainingDays.length }} jours/semaine</p>
                </div>
              </div>
            </div>
          </v-expand-transition>

          <v-card-actions>
            <v-btn text color="blue-lighten-1" @click="toggleDetails(plan.id)">
              {{ expandedPlan === plan.id ? 'Réduire' : 'Voir plus' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
      <p v-else class="text-center">Vous n'avez pas encore de plans</p>
    </div>

    <div class="mt-4">
      <LoadingButton @click="$emit('create-plan')">Créer un plan</LoadingButton>
    </div>

    <!-- Modale de confirmation avec Vuetify -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card>
        <v-card-title>Supprimer le plan</v-card-title>
        <v-card-text>Êtes-vous sûr de vouloir supprimer ce plan ? Cette action est irréversible.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" text @click="deletePlan">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  plans: Array,
  loading: Boolean
});

const emit = defineEmits(['create-plan', 'navigate', 'delete-plan', 'edit-plan']);

const modalVisible = ref(false);
const planToDelete = ref(null);
const expandedPlan = ref(null);

const goToPlan = (planId) => {
  emit('navigate', planId);
};

const editPlan = (planId) => {
  emit('edit-plan', planId);
};

const confirmDelete = (plan) => {
  planToDelete.value = plan;
  modalVisible.value = true;
};

const deletePlan = () => {
  if (planToDelete.value) {
    emit('delete-plan', planToDelete.value.id);
    modalVisible.value = false;
  }
};

const toggleDetails = (planId) => {
  expandedPlan.value = expandedPlan.value === planId ? null : planId;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>
