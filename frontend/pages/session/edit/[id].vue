<template>
  <v-container class="mx-auto py-8 px-4 md:px-6 lg:px-8 neon-bg text-white rounded-lg shadow-2xl">
    <!-- Loader -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4 neon-progress" />

    <!-- Erreur -->
    <div v-else-if="error" class="text-red-400 bg-red-900 p-4 mb-4 rounded neon-alert">
      {{ error }}
    </div>

    <!-- Formulaire -->
    <div v-else>
      <h1 class="text-3xl font-bold mb-6 neon-title">Modifier la séance</h1>

      <v-form @submit.prevent="updateSession" class="space-y-6">
        <!-- Nom de la séance -->
        <div>
          <label class="font-semibold mb-1 block" for="session-name">
            Nom de la séance
          </label>
          <v-text-field
              id="session-name"
              v-model="session.name"
              class="neon-input text-black"
              placeholder="Ex : Séance jambes"
              required
          />
        </div>

        <!-- Switch pour mode cardio -->
        <v-switch
            label="Mode cardio ?"
            v-model="session.isCardio"
            class="mt-4 neon-switch"
        />

        <!-- Si cardio, champs durée/distance -->
        <div v-if="session.isCardio">
          <div>
            <label class="font-semibold mb-1 block" for="session-duration">
              Durée (minutes)
            </label>
            <v-text-field
                id="session-duration"
                type="number"
                v-model.number="session.duration"
                class="neon-input text-black"
                placeholder="Ex : 60"
            />
          </div>
          <div class="mt-4">
            <label class="font-semibold mb-1 block" for="session-distance">
              Distance (km)
            </label>
            <v-text-field
                id="session-distance"
                type="number"
                v-model.number="session.distance"
                class="neon-input text-black"
                placeholder="Ex : 5"
            />
          </div>
        </div>

        <!-- Séance indépendante ou liée à des plans -->
        <v-switch
            label="Séance indépendante"
            v-model="isIndependent"
            class="mt-4 neon-switch"
            @change="toggleSessionType"
        />

        <div v-if="!isIndependent">
          <label class="font-semibold mb-1 block">
            Associer des plans
          </label>
          <v-autocomplete
              v-model="selectedPlans"
              :items="availablePlans"
              item-title="name"
              item-value="id"
              multiple
              class="neon-input text-black"
              placeholder="Sélectionnez un plan"
          />
        </div>

        <!-- Ajouter des exercices -->
        <div>
          <label class="font-semibold mb-1 block">Ajouter des exercices</label>
          <v-autocomplete
              v-model="selectedExercises"
              :items="availableExercises"
              item-title="name"
              item-value="id"
              multiple
              class="neon-input text-black"
              placeholder="Choisissez un ou plusieurs exercices"
          />
        </div>

        <!-- Liste des exercices déjà associés -->
        <div v-if="session.sessionExercises.length" class="bg-gray-800 p-4 rounded space-y-2 mt-4 neon-panel">
          <h3 class="text-xl font-medium mb-2 glow-subtitle">
            Exercices associés
          </h3>
          <div
              v-for="(sessionExercise, index) in session.sessionExercises"
              :key="sessionExercise.id || index"
              class="p-2 bg-gray-700 rounded space-y-2 mb-2 transition hover:shadow-inner"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">
                  {{ sessionExercise.exercise?.name || 'Exercice inconnu' }}
                </p>
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

            <!-- Edition des détails sets/reps/poids -->
            <div class="flex space-x-2 items-end">
              <v-text-field
                  type="number"
                  v-model.number="sessionExercise.sets"
                  label="Séries"
                  class="neon-input text-black"
                  style="max-width: 80px;"
              />
              <v-text-field
                  v-model="sessionExercise.repsPerSetString"
                  label="Reps ex: 10/10/8"
                  class="neon-input text-black"
                  style="max-width: 140px;"
              />
              <v-text-field
                  type="number"
                  v-model.number="sessionExercise.weight"
                  label="Poids (kg)"
                  class="neon-input text-black"
                  style="max-width: 100px;"
              />
              <v-btn color="primary" @click="saveSessionExercise(sessionExercise)">
                Sauvegarder
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Boutons Enregistrer / Supprimer -->
        <div class="flex justify-between mt-4">
          <v-btn type="submit" color="primary" :loading="updating" class="shadow futuristic-btn">
            Enregistrer
          </v-btn>
          <v-btn color="red" class="shadow futuristic-btn" @click="confirmDelete">
            Supprimer
          </v-btn>
        </div>
      </v-form>
    </div>

    <!-- Dialog suppression -->
    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card class="bg-gray-800 neon-alert">
        <v-card-title class="text-white font-bold">
          Supprimer la séance
        </v-card-title>
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

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

// État principal
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

// Helper d’affichage
const displayReps = (reps) => {
  if (!reps || !reps.length) return "Non défini";
  return reps.join("/");
};

// Récupère la séance
const fetchSession = async () => {
  try {
    const resp = await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/sessions/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const hydratedSEs = await Promise.all(
        resp.sessionExercises.map(iriOrObj => hydrateSessionExercise(iriOrObj))
    );

    session.value = {
      ...resp,
      isCardio: resp.isCardio ?? false,
      sessionExercises: hydratedSEs
    };

    if (resp.plans?.length) {
      // On extrait l’ID depuis l’IRI
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

// Charger un sessionExercise si c’est un IRI
const hydrateSessionExercise = async (iriOrObj) => {
  if (typeof iriOrObj === "object") {
    return prepareSessionExercise(iriOrObj);
  }
  const se = await $fetch(`http://localhost:8000${iriOrObj}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return prepareSessionExercise(se);
};

// Ajoute un champ repsPerSetString, etc.
const prepareSessionExercise = async (se) => {
  if (se.exercise && typeof se.exercise === "string") {
    const exId = se.exercise.split("/").pop();
    const ex = await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/exercises/${exId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    se.exercise = ex;
  }
  se.repsPerSetString = se.repsPerSet?.join("/") || "";
  if (!se["@id"]) se["@id"] = `/api/session_exercises/${se.id}`;
  return se;
};

// Fetch Plans
const fetchPlans = async () => {
  try {
    const resp = await $fetch("https://canardmuscleapi.antoninpamart.fr/api/plans/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    availablePlans.value = resp.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur chargement des plans.");
  }
};

// Fetch Exercices
const fetchExercises = async () => {
  try {
    const resp = await $fetch("https://canardmuscleapi.antoninpamart.fr/api/exercises/filtered", {
      headers: { Authorization: `Bearer ${token}` }
    });
    availableExercises.value = resp;
  } catch (err) {
    console.error(err);
    $toast.error("Erreur chargement des exercices.");
  }
};

// Watch : quand on ajoute un exercice via selectedExercises
watch(
    () => selectedExercises.value,
    async (newVal, oldVal) => {
      const addedIds = newVal.filter(id => !oldVal.includes(id));
      if (!addedIds.length) return;

      // Pour chaque ID ajouté, on créé un sessionExercise
      const newSEList = await Promise.all(
          addedIds.map(async (exerciseId) => {
            try {
              const createdSE = await $fetch("https://canardmuscleapi.antoninpamart.fr/api/session_exercises", {
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
              createdSE.repsPerSetString = createdSE.repsPerSet?.join("/") || "";
              if (!createdSE["@id"]) {
                createdSE["@id"] = `/api/session_exercises/${createdSE.id}`;
              }
              if (createdSE.exercise && typeof createdSE.exercise === "string") {
                const exId = createdSE.exercise.split("/").pop();
                createdSE.exercise = await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/exercises/${exId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }
              session.value.sessionExercises.push(createdSE);
              return createdSE;
            } catch (err) {
              console.error("Erreur creation sessionEx:", err);
              $toast.error("Impossible d'ajouter l'exercice.");
              return null;
            }
          })
      );
      selectedExercises.value = [];
    }
);

// Sauvegarder les changements sets/reps/poids
const saveSessionExercise = async (sessionExercise) => {
  try {
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
    updated.repsPerSetString = updated.repsPerSet?.join("/") || "";
    const idx = session.value.sessionExercises.findIndex(se => se.id === updated.id);
    if (idx !== -1) session.value.sessionExercises[idx] = updated;
    $toast.success("Exercice mis à jour !");
  } catch (err) {
    console.error(err);
    $toast.error("Erreur maj de l'exercice.");
  }
};

// Retirer un exercice
const removeExercise = async (sessionExerciseId) => {
  try {
    await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/session_exercises/${sessionExerciseId}`, {
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

// Switch entre séance indépendante / liée à des plans
const toggleSessionType = () => {
  if (isIndependent.value) {
    selectedPlans.value = [];
  }
};

// Mise à jour de la séance (PATCH)
const updateSession = async () => {
  try {
    updating.value = true;

    await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/sessions/${route.params.id}`, {
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
        sessionExercises: session.value.sessionExercises
            .map(se => se["@id"])
            .filter(Boolean)
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

// Suppression de la séance
const confirmDelete = () => {
  modalVisible.value = true;
};
const deleteSession = async () => {
  try {
    await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/sessions/${route.params.id}`, {
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

// Lifecycle
onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchSession(), fetchPlans(), fetchExercises()]);
  loading.value = false;
});
</script>

<style scoped>
.neon-bg {
  background: radial-gradient(circle, #141414 0%, #0a0a0a 100%);
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 0 20px rgba(0,255,255,0.04), inset 0 0 10px rgba(0,255,255,0.02);
  transition: box-shadow 0.3s;
}
.neon-bg:hover {
  box-shadow: 0 0 30px rgba(0,255,255,0.06), inset 0 0 20px rgba(0,255,255,0.04);
}
.neon-title {
  text-shadow: 0 0 4px rgba(0,255,255,0.3), 0 0 8px rgba(0,255,255,0.2);
}
.neon-alert {
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.2), inset 0 0 10px rgba(255, 0, 0, 0.1);
}
.neon-progress {
  --v-progress-linear-height: 4px;
}

/* Switch style minimal */
.neon-switch .v-selection-control__input {
  filter: hue-rotate(180deg);
}

/* Champs texte sur fond sombre */
.neon-input {
  background-color: #2a2a2a !important;
  color: #fff !important;
}

/* Panel */
.neon-panel {
  box-shadow: inset 0 0 8px rgba(255,255,255,0.05);
}

/* Sous-titre en glow */
.glow-subtitle {
  text-shadow: 0 0 3px rgba(0,255,255,0.4);
}

/* Boutons futuristes */
.futuristic-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.2s ease;
}
.futuristic-btn:hover {
  transform: scale(1.05);
}
</style>
