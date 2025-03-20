<template>
  <v-container class="mx-auto py-8 px-4 md:px-6 lg:px-8 bg-gray-900 text-white rounded-lg shadow-lg">

    <!-- Loader pendant le chargement -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Message d'erreur -->
    <div v-else-if="error" class="text-red-400 bg-red-900 p-4 mb-4 rounded">
      {{ error }}
    </div>

    <!-- Formulaire de la session -->
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

        <!-- Toggle muscu/cardio -->
        <v-switch
            label="Mode cardio ?"
            v-model="session.isCardio"
            class="mt-4"
        />

        <!-- Si session.isCardio => champs durée/distance -->
        <div v-if="session.isCardio">
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
        </div>

        <!-- Toggle séance indépendante (pas de plans) -->
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

        <!-- Sélection des exercices à ajouter (création immédiate du SessionExercise) -->
        <div>
          <label class="font-semibold mb-1">Ajouter un exercice</label>
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
        <div v-if="session.sessionExercises.length" class="bg-gray-800 p-4 rounded space-y-2">
          <h3 class="text-xl font-medium mb-2">Exercices associés</h3>

          <!-- On parcourt sessionExercises -->
          <div
              v-for="(sessionExercise, index) in session.sessionExercises"
              :key="sessionExercise.id || index"
              class="p-2 bg-gray-700 rounded space-y-2 mb-2"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">
                  {{ sessionExercise.exercise?.name || 'Exercice inconnu' }}
                </p>
                <!-- Affichage sets / reps / weight -->
                <p class="text-sm text-gray-300">
                  {{ sessionExercise.sets || 0 }} séries –
                  {{ displayReps(sessionExercise.repsPerSet) }} –
                  {{ sessionExercise.weight || 0 }} kg
                </p>
              </div>
              <v-btn
                  icon="mdi-delete"
                  color="red"
                  variant="text"
                  @click="removeExercise(sessionExercise.id)"
              />
            </div>

            <!-- Edition inline des sets / reps / weight -->
            <div class="flex space-x-2 items-end">
              <v-text-field
                  type="number"
                  v-model.number="sessionExercise.sets"
                  label="Séries"
                  class="bg-white text-black rounded"
                  style="max-width: 80px;"
              />
              <v-text-field
                  v-model="sessionExercise.repsPerSetString"
                  label="Reps ex: 10/10/8"
                  class="bg-white text-black rounded"
                  style="max-width: 140px;"
              />
              <v-text-field
                  type="number"
                  v-model.number="sessionExercise.weight"
                  label="Poids (kg)"
                  class="bg-white text-black rounded"
                  style="max-width: 100px;"
              />
              <v-btn color="primary" @click="saveSessionExercise(sessionExercise)">
                Sauvegarder
              </v-btn>
            </div>
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
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "#vue-router";
import { useNuxtApp } from "#app";

definePageMeta({ middleware: "auth" });
useHead({ title: "Modifier la séance" });

// Nuxt / composables
const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

// -----------------------------------
// Etats
// -----------------------------------
const session = ref({
  name: "",
  isCardio: false,
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

// Petit helper pour afficher un array de reps
const displayReps = (reps) => {
  if (!reps || !reps.length) return "Non défini";
  return reps.join("/");
};

// -----------------------------------
// 1) Récupération de la session
// -----------------------------------
const fetchSession = async () => {
  try {
    const resp = await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Convertit "sessionExercises" => hydratation
    const hydratedSEs = await Promise.all(
        resp.sessionExercises.map(iriOrObj => hydrateSessionExercise(iriOrObj))
    );

    // Mets à jour
    session.value = {
      ...resp,
      isCardio: resp.isCardio ?? false,
      sessionExercises: hydratedSEs
    };

    if (resp.plans?.length) {
      selectedPlans.value = resp.plans.map((iri) => iri.split("/").pop());
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
 * Hydrate un sessionExercise s'il n'est pas déjà un objet complet.
 * On ajoute "repsPerSetString" pour l'édition inline.
 */
const hydrateSessionExercise = async (iriOrObj) => {
  if (typeof iriOrObj === "object") {
    // Déjà un objet => on formate repsPerSetString
    return prepareSessionExercise(iriOrObj);
  }
  // Sinon c'est un IRI => ex "/api/session_exercises/7"
  const se = await $fetch(`http://localhost:8000${iriOrObj}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return prepareSessionExercise(se);
};

const prepareSessionExercise = async (se) => {
  // Si "exercise" est un IRI, on le fetch
  if (se.exercise && typeof se.exercise === "string") {
    const exId = se.exercise.split("/").pop();
    se.exercise = await $fetch(`http://localhost:8000/api/exercises/${exId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  // Convertit repsPerSet => repsPerSetString
  se.repsPerSetString = se.repsPerSet?.join("/") || "";
  return se;
};

// -----------------------------------
// 2) Récupération des plans / exercices
// -----------------------------------
const fetchPlans = async () => {
  try {
    const resp = await $fetch("http://localhost:8000/api/plans/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    availablePlans.value = resp.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur chargement des plans.");
  }
};

const fetchExercises = async () => {
  try {
    const resp = await $fetch("http://localhost:8000/api/exercises/filtered", {
      headers: { Authorization: `Bearer ${token}` }
    });
    availableExercises.value = resp;
  } catch (err) {
    console.error(err);
    $toast.error("Erreur chargement des exercices.");
  }
};

// -----------------------------------
// 3) Ajout immediat d'un SessionExercise
// -----------------------------------
/**
 * Quand on sélectionne un ou plusieurs exercices dans 'selectedExercises',
 * on crée pour chacun un SessionExercise => plus de problème "null".
 */
watch(
    () => selectedExercises.value,
    async (newVal, oldVal) => {
      // On cherche les ID ajoutés
      const addedIds = newVal.filter(id => !oldVal.includes(id));
      if (!addedIds.length) return;

      // On crée un SessionExercise pour chaque ID
      const newSEList = await Promise.all(
          addedIds.map(async (exerciseId) => {
            try {
              const createdSE = await $fetch("http://localhost:8000/api/session_exercises", {
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
              // On lui ajoute repsPerSetString
              createdSE.repsPerSetString = createdSE.repsPerSet?.join("/") || "";
              // Si l'API ne renvoie pas "@id", on le force
              if (!createdSE["@id"]) {
                createdSE["@id"] = `/api/session_exercises/${createdSE.id}`;
              }
              // Si "exercise" est un IRI => on hydrate
              if (createdSE.exercise && typeof createdSE.exercise === "string") {
                const exId = createdSE.exercise.split("/").pop();
                createdSE.exercise = await $fetch(`http://localhost:8000/api/exercises/${exId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }
              // On ajoute ce nouveau SE dans la session
              session.value.sessionExercises.push(createdSE);
              return createdSE;
            } catch (err) {
              console.error("Erreur creation sessionEx:", err);
              $toast.error("Impossible d'ajouter l'exercice.");
              return null;
            }
          })
      );

      // On enlève du champ "selectedExercises" ce qu'on vient de traiter
      selectedExercises.value = [];
    }
);

// -----------------------------------
// 4) Edition inline d'un SessionExercise (sets, reps, weight)
// -----------------------------------
const saveSessionExercise = async (sessionExercise) => {
  try {
    // Convertit la string => array
    const repsArr = sessionExercise.repsPerSetString
        ? sessionExercise.repsPerSetString.split("/").map(x => parseInt(x.trim())).filter(Boolean)
        : [];
    const updated = await $fetch(`http://localhost:8000${sessionExercise["@id"]}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/merge-patch+json"
      },
      body: {
        sets: sessionExercise.sets,
        repsPerSet: repsArr,
        weight: sessionExercise.weight
      }
    });
    // On reformate
    updated.repsPerSetString = updated.repsPerSet?.join("/") || "";
    // Remplace l'ancien local
    const idx = session.value.sessionExercises.findIndex(se => se.id === updated.id);
    if (idx !== -1) {
      session.value.sessionExercises[idx] = updated;
    }
    $toast.success("Exercice mis à jour !");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur maj de l'exercice.");
  }
};

// -----------------------------------
// 5) Suppression
// -----------------------------------
const removeExercise = async (sessionExerciseId) => {
  try {
    await $fetch(`http://localhost:8000/api/session_exercises/${sessionExerciseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    session.value.sessionExercises = session.value.sessionExercises.filter(se => se.id !== sessionExerciseId);
    $toast.success("Exercice supprimé !");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la suppression de l'exercice.");
  }
};

// -----------------------------------
// 6) Toggle seance indépendante
// -----------------------------------
const toggleSessionType = () => {
  if (isIndependent.value) {
    selectedPlans.value = [];
  }
};

// -----------------------------------
// 7) Mise à jour de la session
// -----------------------------------
const updateSession = async () => {
  try {
    updating.value = true;
    console.log("=>([id].vue:445) session.value.sessionExercises", session.value.sessionExercises);
    await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/merge-patch+json"
      },
      body: {
        name: session.value.name,
        isCardio: session.value.isCardio,
        duration: session.value.isCardio ? session.value.duration : null,
        distance: session.value.isCardio ? session.value.distance : null,
        plans: isIndependent.value
            ? []
            : selectedPlans.value.map(id => `/api/plans/${id}`),
        // IRIs => ex: ["/api/session_exercises/22", ...]
        sessionExercises: session.value.sessionExercises.map(se => se["@id"])
      }
    });

    $toast.success("Séance mise à jour !");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la mise à jour de la séance.");
  } finally {
    updating.value = false;
  }
};

// -----------------------------------
// 8) Suppression de la session
// -----------------------------------
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

// -----------------------------------
// Lifecycle
// -----------------------------------
onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchSession(), fetchPlans(), fetchExercises()]);
  loading.value = false;
});
</script>

<style scoped>
.bg-gray-900 {
  background-color: #1a1a1a;
}
.v-text-field {
  max-width: 300px;
}
</style>
