<template>
  <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg">
    <v-card-title class="text-2xl font-semibold">Liste des Exercices</v-card-title>

    <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

    <v-list v-else dense>
      <v-list-item
          v-for="exercise in exercises"
          :key="exercise.id"
          class="flex justify-between items-center"
      >
        <div class="flex items-center justify-between">
        <div>
          <v-list-item-title>
            {{ exercise.name }}
            <span v-if="exercise.status === 1" class="text-green-400 text-sm">(Public)</span>
            <span v-else class="text-yellow-400 text-sm">(Privé)</span>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ exercise.muscles || 'Muscles non spécifiés' }}
          </v-list-item-subtitle>
        </div>

        <!-- Affichage des options uniquement pour l'utilisateur qui a créé l'exercice -->
        <v-menu v-if="exercise.createdBy.id === user?.id">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item @click="editExercise(exercise.id)">
              <v-list-item-title>Modifier</v-list-item-title>
            </v-list-item>
            <v-list-item @click="confirmDelete(exercise.id)">
              <v-list-item-title class="text-red-400">Supprimer</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        </div>
      </v-list-item>
    </v-list>

    <v-card-actions>
      <v-btn color="primary" @click="createExercise">Ajouter un exercice</v-btn>
    </v-card-actions>

    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card>
        <v-card-title>Supprimer l'exercice</v-card-title>
        <v-card-text>Êtes-vous sûr de vouloir supprimer cet exercice ?</v-card-text>
        <v-card-actions>
          <v-btn text @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" text @click="deleteExercise">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useNuxtApp } from "#app";

const { $toast, $user } = useNuxtApp();
const exercises = ref([]);
const loading = ref(true);
const modalVisible = ref(false);
const exerciseToDelete = ref(null);
const user = $user.value; // Récupération de l'utilisateur connecté

const fetchExercises = async () => {
  try {
    const token = useCookie("token").value;
    const response = await $fetch("http://localhost:8000/api/exercises/filtered", {
      headers: { Authorization: `Bearer ${token}` }
    });
    exercises.value = response;
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors du chargement des exercices");
  } finally {
    loading.value = false;
  }
};

const createExercise = async () => {
  try {
    const token = useCookie("token").value;
    const newExercise = await $fetch("http://localhost:8000/api/exercises", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: { name: "Nouvel Exercice" }
    });
    $toast.success("Exercice créé !");
    await fetchExercises();
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la création de l'exercice.");
  }
};

const editExercise = (id) => {
  if (!id) {
    $toast.error("Exercice introuvable.");
    return;
  }
  navigateTo(`/exercise/edit/${id}`);
};

const confirmDelete = (id) => {
  if (!id) {
    $toast.error("Exercice introuvable.");
    return;
  }
  exerciseToDelete.value = id;
  modalVisible.value = true;
};

const deleteExercise = async () => {
  try {
    const token = useCookie("token").value;
    await $fetch(`http://localhost:8000/api/exercises/${exerciseToDelete.value}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    $toast.success("Exercice supprimé !");
    exercises.value = exercises.value.filter(exercise => exercise.id !== exerciseToDelete.value);
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la suppression de l'exercice.");
  } finally {
    modalVisible.value = false;
  }
};

onMounted(fetchExercises);
</script>
