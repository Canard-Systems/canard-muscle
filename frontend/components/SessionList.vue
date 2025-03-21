<template>
  <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg neon-console p-4 relative">
    <div class="flex items-center justify-between mb-2">
      <v-card-title class="text-2xl font-semibold neon-title">
        Mes Séances
      </v-card-title>
      <div>
        <v-btn color="primary" @click="createSession" class="futuristic-btn">
          Ajouter une séance
        </v-btn>
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate class="neon-progress"></v-progress-linear>

    <div v-else>
      <div v-if="sessions.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- On fait une grille responsive sur sm / lg -->
        <div
            v-for="session in sessions"
            :key="session.id"
            class="neon-item p-4 bg-gray-800 rounded relative"
        >
          <div class="absolute top-2 right-2">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props"></v-btn>
              </template>
              <v-list>
                <v-list-item @click="goToSessionDetails(session.id)">
                  <v-list-item-title>Voir détails</v-list-item-title>
                </v-list-item>
                <v-list-item @click="editSession(session.id)">
                  <v-list-item-title>Modifier</v-list-item-title>
                </v-list-item>
                <v-list-item @click="confirmDelete(session.id)">
                  <v-list-item-title class="text-red-400">
                    Supprimer
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <h3 class="font-bold text-lg mb-1">
            {{ session.name || "Séance sans nom" }}
          </h3>
          <p class="text-sm mb-1">
            Durée : {{ session.duration || 0 }} min –
            Distance : {{ session.distance || 0 }} km
          </p>
          <p class="text-sm">
            Plans associés :
            {{ session.plans?.length ? session.plans.map(p => p.name).join(', ') : 'Aucun' }}
          </p>
        </div>
      </div>

      <p v-else class="text-center mt-4 text-gray-300">
        Aucune séance trouvée
      </p>
    </div>

    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card class="bg-gray-800 neon-alert">
        <v-card-title class="font-bold text-white">
          Supprimer la séance
        </v-card-title>
        <v-card-text class="text-gray-300">
          Êtes-vous sûr de vouloir supprimer cette séance ?
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="modalVisible = false">Annuler</v-btn>
          <v-btn color="red" text @click="deleteSession">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { useRouter } from '#vue-router';

const { $toast } = useNuxtApp();
const router = useRouter();
const token = useCookie('token').value;

const sessions = ref([]);
const loading = ref(true);
const modalVisible = ref(false);
const sessionToDelete = ref(null);

const fetchSessions = async () => {
  try {
    const response = await $fetch("http://localhost:8000/api/sessions/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    sessions.value = response.member || [];
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors du chargement des séances");
  } finally {
    loading.value = false;
  }
};

const createSession = async () => {
  try {
    const newSession = await $fetch("http://localhost:8000/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: { name: "Nouvelle Séance" }
    });
    $toast.success("Séance créée !");
    router.push(`/session/edit/${newSession.id}`);
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la création de la séance.");
  }
};

const editSession = (id) => {
  if (!id) {
    $toast.error("Séance introuvable.");
    return;
  }
  router.push(`/session/edit/${id}`);
};

const goToSessionDetails = (id) => {
  if (!id) {
    $toast.error("Séance introuvable.");
    return;
  }
  router.push(`/session/${id}`);
};

const confirmDelete = (id) => {
  if (!id) {
    $toast.error("Séance introuvable.");
    return;
  }
  sessionToDelete.value = id;
  modalVisible.value = true;
};

const deleteSession = async () => {
  try {
    await $fetch(`http://localhost:8000/api/sessions/${sessionToDelete.value}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    $toast.success("Séance supprimée !");
    sessions.value = sessions.value.filter(s => s.id !== sessionToDelete.value);
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la suppression de la séance.");
  } finally {
    modalVisible.value = false;
  }
};

onMounted(fetchSessions);
</script>

<style scoped>
.neon-console {
  background: rgba(40, 40, 40, 0.8);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 0 10px rgba(0,255,255,0.05);
}
.neon-console:hover {
  box-shadow: 0 0 20px rgba(0,255,255,0.07);
}
.neon-title {
  text-shadow: 0 0 4px rgba(0,255,255,0.3),
  0 0 8px rgba(0,255,255,0.2);
}
.neon-alert {
  box-shadow: 0 0 10px rgba(255,0,0,0.2),
  inset 0 0 10px rgba(255,0,0,0.1);
}
.neon-item {
  transition: background-color 0.2s;
}
.neon-item:hover {
  background-color: rgba(255,255,255,0.05);
}
.neon-progress {
  --v-progress-linear-height: 4px;
}
.futuristic-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.2s ease;
}
.futuristic-btn:hover {
  transform: scale(1.05);
}
</style>
