<template>
  <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg neon-console p-4 relative">
    <!-- Titre -->
    <div class="flex items-center justify-between mb-2">
      <v-card-title class="text-2xl font-semibold neon-title">
        Liste des Exercices
      </v-card-title>
      <div>
        <v-btn color="primary" @click="createExercise" class="futuristic-btn">
          Ajouter un exercice
        </v-btn>
      </div>
    </div>

    <!-- Loader -->
    <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

    <!-- Liste des exercices -->
    <v-list v-else dense>
      <v-list-item
          v-for="exercise in exercises"
          :key="exercise.id"
          class="flex justify-between items-center neon-item"
      >
        <div class="flex items-center justify-between">
        <div>
          <v-list-item-title>
            {{ exercise.name }}
            <span v-if="exercise.status === 1" class="text-green-400 text-sm">
              (Public)
            </span>
            <span v-else class="text-yellow-400 text-sm">
              (Privé)
            </span>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ exercise.muscles || 'Muscles non spécifiés' }}
          </v-list-item-subtitle>
        </div>

        <!-- Affichage des options uniquement si l'utilisateur est le créateur -->
        <v-menu v-if="exercise.createdBy.id === user?.id">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item @click="editExercise(exercise.id)">
              <v-list-item-title>Modifier</v-list-item-title>
            </v-list-item>
            <v-list-item @click="confirmDelete(exercise.id)">
              <v-list-item-title class="text-red-400">
                Supprimer
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        </div>
      </v-list-item>
    </v-list>

    <!-- Dialog de confirmation -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card class="bg-gray-800 text-white border border-gray-700 neon-alert">
        <v-card-title class="font-bold">Supprimer l'exercice</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer cet exercice ?
        </v-card-text>
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
const user = $user.value;

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
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
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
  navigateTo(`/exercises/edit/${id}`);
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
    exercises.value = exercises.value.filter(
        e => e.id !== exerciseToDelete.value
    );
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la suppression de l'exercice.");
  } finally {
    modalVisible.value = false;
  }
};

onMounted(fetchExercises);
</script>

<style scoped>
/* Fond style "futuriste" */
.neon-console {
  background: radial-gradient(ellipse at center, #141414 0%, #0a0a0a 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.02),
  inset 0 0 10px rgba(0, 255, 255, 0.02);
  transition: box-shadow 0.3s;
}

.neon-console:hover {
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.06),
  inset 0 0 20px rgba(0, 255, 255, 0.04);
}

/* Titre style "néon" */
.neon-title {
  text-shadow:
      0 0 4px rgba(0, 255, 255, 0.3),
      0 0 8px rgba(0, 255, 255, 0.2);
}

/* Items dans la liste (transition sur hover) */
.neon-item {
  transition: background-color 0.2s;
}
.neon-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Boutons futuristes */
.futuristic-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.2s;
}
.futuristic-btn:hover {
  transform: scale(1.05);
}

/* Dialog style "futuriste" */
.neon-alert {
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.2),
  inset 0 0 10px rgba(255, 0, 0, 0.1);
}
</style>
