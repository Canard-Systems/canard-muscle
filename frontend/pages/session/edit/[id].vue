<template>
  <v-container class="mx-auto py-8 px-4 md:px-6 lg:px-8 bg-gray-900 text-white rounded-lg shadow-lg">

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <div v-else-if="error" class="text-red-400 bg-red-900 p-4 mb-4 rounded">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold mb-6">Modifier la séance</h1>

      <v-form @submit.prevent="updateSession" class="space-y-6">
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

        <v-switch
            label="Mode cardio ?"
            v-model="session.isCardio"
            class="mt-4"
        />

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

        <v-switch
            label="Séance indépendante"
            v-model="isIndependent"
            class="mt-4"
            @change="toggleSessionType"
        />

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

        <div v-if="session.sessionExercises.length" class="bg-gray-800 p-4 rounded space-y-2">
          <h3 class="text-xl font-medium mb-2">Exercices associés</h3>
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

const { $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const token = useCookie("token").value;

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

const displayReps = (reps) => {
  if (!reps || !reps.length) return "Non défini";
  return reps.join("/");
};

const fetchSession = async () => {
  try {
    const resp = await $fetch(`http://localhost:8000/api/sessions/${route.params.id}`, {
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

const hydrateSessionExercise = async (iriOrObj) => {
  if (typeof iriOrObj === "object") {
    return prepareSessionExercise(iriOrObj);
  }
  const se = await $fetch(`http://localhost:8000${iriOrObj}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return prepareSessionExercise(se);
};

const prepareSessionExercise = async (se) => {
  if (se.exercise && typeof se.exercise === "string") {
    const exId = se.exercise.split("/").pop();
    const ex = await $fetch(`http://localhost:8000/api/exercises/${exId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    se.exercise = ex;
  }
  se.repsPerSetString = se.repsPerSet?.join("/") || "";
  if (!se["@id"]) se["@id"] = `/api/session_exercises/${se.id}`;
  return se;
};

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

watch(
    () => selectedExercises.value,
    async (newVal, oldVal) => {
      const addedIds = newVal.filter(id => !oldVal.includes(id));
      if (!addedIds.length) return;

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
              createdSE.repsPerSetString = createdSE.repsPerSet?.join("/") || "";
              if (!createdSE["@id"]) {
                createdSE["@id"] = `/api/session_exercises/${createdSE.id}`;
              }
              if (createdSE.exercise && typeof createdSE.exercise === "string") {
                const exId = createdSE.exercise.split("/").pop();
                createdSE.exercise = await $fetch(`http://localhost:8000/api/exercises/${exId}`, {
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

const toggleSessionType = () => {
  if (isIndependent.value) {
    selectedPlans.value = [];
  }
};

const updateSession = async () => {
  try {
    updating.value = true;

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

// Lifecycle
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
