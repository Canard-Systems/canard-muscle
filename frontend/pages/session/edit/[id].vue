<template>
  <v-container class="mx-auto py-8 px-4 md:px-6 lg:px-8 bg-gray-900 text-white rounded-lg shadow-lg">
    <!-- Loader pendant le chargement -->
    <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        class="mb-4"
    />

    <!-- Message d'erreur -->
    <div v-else-if="error" class="text-red-400 bg-red-900 p-4 mb-4 rounded">
      {{ error }}
    </div>

    <!-- Formulaire -->
    <div v-else>
      <h1 class="text-3xl font-bold mb-6">Modifier la séance</h1>

      <v-form @submit.prevent="updateSession" class="space-y-6">
        <!-- Nom de la séance -->
        <div class="flex flex-col">
          <label class="font-semibold mb-1" for="session-name">Nom de la séance</label>
          <v-text-field
              id="session-name"
              v-model="session.name"
              class="bg-white text-black rounded"
              placeholder="Ex : Séance jambes"
              required
          />
        </div>

        <!-- Durée -->
        <div class="flex flex-col">
          <label class="font-semibold mb-1" for="session-duration">Durée (minutes)</label>
          <v-text-field
              id="session-duration"
              type="number"
              v-model.number="session.duration"
              class="bg-white text-black rounded"
              placeholder="Ex : 60"
          />
        </div>

        <!-- Distance -->
        <div class="flex flex-col">
          <label class="font-semibold mb-1" for="session-distance">Distance (km)</label>
          <v-text-field
              id="session-distance"
              type="number"
              v-model.number="session.distance"
              class="bg-white text-black rounded"
              placeholder="Ex : 5"
          />
        </div>

        <!-- Séance indépendante ou non -->
        <v-switch
            label="Séance indépendante"
            v-model="isIndependent"
            class="mt-4"
            @change="toggleSessionType"
        />

        <!-- Liste des plans (si non indépendant) -->
        <div v-if="!isIndependent">
          <label class="font-semibold mb-1">Associer des plans</label>
          <v-autocomplete
              v-model="selectedPlans"
              :items="availablePlans"
              item-title="name"
              item-value="id"
              multiple
              class="bg-white text-black rounded"
              placeholder="Sélectionnez un plan"
          />
        </div>

        <!-- Sélection des exercices à ajouter -->
        <div>
          <label class="font-semibold mb-1">Ajouter des exercices</label>
          <v-autocomplete
              v-model="selectedExercises"
              :items="availableExercises"
              item-title="name"
              item-value="id"
              multiple
              class="bg-white text-black rounded"
              placeholder="Choisissez un ou plusieurs exercices"
          />
        </div>

        <!-- Liste des exercices déjà associés -->
        <div
            v-if="session.sessionExercises.length"
            class="bg-gray-800 p-4 rounded space-y-2"
        >
          <h3 class="text-xl font-medium mb-2">Exercices associés</h3>
          <div
              v-for="(sessionExercise, index) in session.sessionExercises"
              :key="index"
              class="p-2 bg-gray-700 rounded flex items-center justify-between"
          >
            <div>
              <p class="font-semibold">
                <!-- "Exercice inconnu" si pas de nom -->
                {{ sessionExercise.exercise?.name || 'Exercice inconnu' }}
              </p>
              <p class="text-sm text-gray-300">
                {{ sessionExercise.sets || 0 }} séries –
                {{ sessionExercise.repsPerSet?.join('/') || 'Non défini' }}
              </p>
            </div>
            <v-btn
                icon="mdi-delete"
                color="red"
                variant="text"
                @click="removeExercise(sessionExercise.id)"
            />
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex justify-between mt-4">
          <v-btn type="submit" color="primary" :loading="updating" class="shadow">
            Enregistrer
          </v-btn>
          <v-btn color="red" class="shadow" @click="confirmDelete">
            Supprimer
          </v-btn>
        </div>
      </v-form>
    </div>

    <!-- Modale de confirmation pour la suppression de la session -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card class="bg-gray-800">
        <v-card-title class="text-white">Supprimer la séance</v-card-title>
        <v-card-text class="text-gray-300">
          Êtes-vous sûr de vouloir supprimer cette séance ?
        </v-card-text>
        <v-card-actions>
          <v-btn color="gray" @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" @click="deleteSession">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "#vue-router";
import { useNuxtApp } from "#app";

definePageMeta({ middleware: "auth" });
useHead({ title: "Modifier la séance" });

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

const session = ref({
  name: "",
  duration: null,
  distance: null,
  plans: [],
  sessionExercises: []
});

const availablePlans = ref([]);
const selectedPlans = ref([]);
const availableExercises = ref([]);
const selectedExercises = ref([]);
const isIndependent = ref(false);
const loading = ref(true);
const updating = ref(false);
const error = ref(null);
const modalVisible = ref(false);

// =============================================
//      1) CHARGEMENT ET HYDRATATION
// =============================================
const fetchSession = async () => {
  try {
    const response = await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Hydrate la liste "sessionExercises"
    const hydratedExercises = await Promise.all(
        response.sessionExercises.map((sessionExerciseIri) => hydrateSessionExercise(sessionExerciseIri))
    );

    session.value = {
      ...response,
      sessionExercises: hydratedExercises
    };

    // Plans => ex: "/api/plans/9" => "9"
    if (response.plans?.length) {
      selectedPlans.value = response.plans.map(planIri => planIri.split("/").pop());
      isIndependent.value = false;
    } else {
      selectedPlans.value = [];
      isIndependent.value = true;
    }

  } catch (err) {
    console.error(err);
    error.value = "Impossible de charger la séance.";
  } finally {
    loading.value = false;
  }
};

/**
 * Reçoit un IRI de sessionExercise (ex: "/api/session_exercises/10"),
 * ou éventuellement un objet déjà hydraté (selon la config).
 */
const hydrateSessionExercise = async (seIriOrObj) => {
  // Si c'est déjà un objet
  if (typeof seIriOrObj === "object") {
    return seIriOrObj;
  }
  // Sinon c'est un IRI => on fetch "/api/session_exercises/{id}"
  try {
    const sessionExercise = await $fetch(`http://localhost:8000${seIriOrObj}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // On hydrate l'exercise si nécessaire
    if (sessionExercise.exercise && typeof sessionExercise.exercise === "string") {
      const exId = sessionExercise.exercise.split("/").pop();
      const exData = await $fetch(`http://localhost:8000/api/exercises/${exId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      sessionExercise.exercise = exData;
    }
    return sessionExercise;
  } catch (err) {
    console.error("Erreur lors de la récupération d'un sessionExercise:", err);
    return { exercise: { name: "Exercice introuvable" } };
  }
};

// =============================================
//      2) FETCH PLANS ET EXERCICES
// =============================================
const fetchPlans = async () => {
  try {
    const response = await $fetch("http://localhost:8000/api/plans/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    availablePlans.value = response.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement des plans.");
  }
};

const fetchExercises = async () => {
  try {
    availableExercises.value = await $fetch("http://localhost:8000/api/exercises/filtered", {
      headers: {Authorization: `Bearer ${token}`}
    });
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement des exercices.");
  }
};

// =============================================
//  3) AJOUT / SUPPRESSION DE SESSION_EXERCISE
// =============================================
const createSessionExercises = async () => {
  try {
    return await Promise.all(
        selectedExercises.value.map(async (exerciseId) => {
          // POST /api/session_exercises
          const newSE = await $fetch("http://localhost:8000/api/session_exercises", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: {
              exercise: `/api/exercises/${exerciseId}`,
              session: `/api/sessions/${route.params.id}`
            }
          });
          // On hydrate l'exercice localement
          const found = availableExercises.value.find(ex => ex.id === parseInt(exerciseId));
          return {
            ...newSE,
            exercise:
                found ||
                (await $fetch(`http://localhost:8000/api/exercises/${exerciseId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                }))
          };
        })
    );
  } catch (err) {
    console.error("Erreur création SessionExercise:", err);
    $toast.error("Impossible d'ajouter certains exercices.");
    return [];
  }
};

const removeExercise = async (sessionExerciseId) => {
  try {
    await $fetch(`http://localhost:8000/api/session_exercises/${sessionExerciseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    session.value.sessionExercises = session.value.sessionExercises.filter(
        (se) => se.id !== sessionExerciseId
    );
    $toast.success("Exercice supprimé !");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la suppression.");
  }
};

// =============================================
//      4) MISE À JOUR SESSION
// =============================================
const toggleSessionType = () => {
  if (isIndependent.value) {
    selectedPlans.value = [];
  }
};

const updateSession = async () => {
  try {
    updating.value = true;
    // 1) Crée les nouveaux sessionExercise
    const newSEs = await createSessionExercises();

    // 2) On PATCH la session
    await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/merge-patch+json"
      },
      body: {
        name: session.value.name,
        duration: session.value.duration,
        distance: session.value.distance,
        plans: isIndependent.value
            ? []
            : selectedPlans.value.map(id => `/api/plans/${id}`),
        // On envoie uniquement les IRIs
        sessionExercises: [
          // IRIs existants (ex: "/api/session_exercises/7")
          ...session.value.sessionExercises.map(se => se["@id"]),
          // IRIs nouveaux
          ...newSEs.map(se => se["@id"])
        ]
      }
    });

    $toast.success("Séance mise à jour !");
    selectedExercises.value = [];
    await fetchSession(); // Recharge pour afficher la liste complète
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la mise à jour.");
  } finally {
    updating.value = false;
  }
};

// =============================================
//      5) SUPPRESSION DE LA SESSION
// =============================================

const confirmDelete = () => {
  modalVisible.value = true;
};

const deleteSession = async () => {
  try {
    await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    $toast.success("Séance supprimée !");
    await router.push("/");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la suppression.");
  } finally {
    modalVisible.value = false;
  }
};

// =============================================
//      onMounted
// =============================================
onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchSession(), fetchPlans(), fetchExercises()]);
  loading.value = false;
});
</script>

<style scoped>
/* Améliorations visuelles */
.bg-gray-900 {
  background-color: #1a1a1a;
}
.v-text-field {
  max-width: 300px;
}
</style>
