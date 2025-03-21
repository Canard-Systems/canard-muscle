<template>
  <v-card
      class="bg-opacity-10 backdrop-blur-sm rounded-lg neon-console p-4 relative
           w-full md:w-5/6 lg:w-3/4 mx-auto"
  >
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
    <v-card-title
        class="neon-title text-xl sm:text-2xl font-semibold"
    >
      Liste des Exercices
    </v-card-title>
    <div class="text-right">
      <v-btn
          color="primary"
          @click="createExercise"
          class="futuristic-btn w-full sm:w-auto"
      >
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
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between neon-item py-2"
    >
      <!-- Partie gauche : infos exercice -->
      <div class="mb-2 sm:mb-0">
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

      <!-- Partie droite : menu (3 points) => seulement si user est créateur -->
      <v-menu
          v-if="exercise.createdBy.id === user?.id"
          class="self-end sm:self-center"
      >
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
    </v-list-item>
  </v-list>

  <!-- Boîte de confirmation -->
  <v-dialog v-model="modalVisible" max-width="400px">
    <v-card class="bg-gray-800 text-white border border-gray-700 neon-alert">
      <v-card-title class="font-bold">
        Supprimer l'exercice
      </v-card-title>
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
    const response = await $fetch("https://canardmuscleapi.antoninpamart.fr/api/exercises/filtered", {
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
    const newExercise = await $fetch("https://canardmuscleapi.antoninpamart.fr/api/exercises", {
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
    await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/exercises/${exerciseToDelete.value}`, {
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
/* Fond style "futuriste" + responsive container */
.neon-console {
  background: radial-gradient(ellipse at center, #141414 0%, #0a0a0a 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.02), inset 0 0 10px rgba(0, 255, 255, 0.02);
  transition: box-shadow 0.3s;
  /* Largeur responsive */
  width: 100%;
  max-width: 900px;      /* limite la largeur max */
  margin: 0 auto;        /* centre horizontalement */
}

.neon-console:hover {
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.06), inset 0 0 20px rgba(0, 255, 255, 0.04);
}

/* Titre style "néon" */
.neon-title {
  text-shadow:
      0 0 4px rgba(0, 255, 255, 0.3),
      0 0 8px rgba(0, 255, 255, 0.2);
  font-size: 1.25rem; /* ~20px */
}
@media (min-width: 640px) {
  .neon-title {
    font-size: 1.5rem; /* ~24px en sm */
  }
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
  width: 100%;     /* Par défaut sur mobile */
}
@media (min-width: 640px) {
  .futuristic-btn {
    width: auto;   /* Reprend la taille auto sur écran plus large */
  }
}
.futuristic-btn:hover {
  transform: scale(1.05);
}

/* Dialog style "futuriste" */
.neon-alert {
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.2), inset 0 0 10px rgba(255, 0, 0, 0.1);
}
</style>
