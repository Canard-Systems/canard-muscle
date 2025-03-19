<template>
  <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg">
    <v-card-title class="text-2xl font-semibold">Mes Séances</v-card-title>

    <v-progress-linear v-if="loading" indeterminate></v-progress-linear>

    <v-list v-else dense>
      <v-list-item v-for="session in sessions" :key="session.id">
          <v-list-item-title>{{ session.name || "Séance sans nom" }}</v-list-item-title>
          <v-list-item-subtitle>
            Durée : {{ session.duration || 0 }} min - Distance : {{ session.distance || 0 }} km
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            Plans associés : {{ session.plans?.length ? session.plans?.map(p => p.name).join(', ') : 'Aucun' }}
          </v-list-item-subtitle>

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item @click="editSession(session.id)">
              <v-list-item-title>Modifier</v-list-item-title>
            </v-list-item>
            <v-list-item @click="confirmDelete(session.id)">
              <v-list-item-title class="text-red-400">Supprimer</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
    </v-list>

    <v-card-actions>
      <v-btn color="primary" @click="createSession">Ajouter une séance</v-btn>
    </v-card-actions>

    <v-dialog v-model="modalVisible" max-width="400px">
      <v-card>
        <v-card-title>Supprimer la séance</v-card-title>
        <v-card-text>Êtes-vous sûr de vouloir supprimer cette séance ?</v-card-text>
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
import { useRouter } from '#vue-router';
import { useNuxtApp } from '#app';

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
    console.log("=>(SessionList.vue:71) sessions.value", sessions.value);
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
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: { name: "Nouvelle Séance" }
    });
    $toast.success("Séance créée !");
    await router.push(`/session/edit/${newSession.id}`);
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
    sessions.value = sessions.value.filter(session => session.id !== sessionToDelete.value);
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la suppression de la séance.");
  } finally {
    modalVisible.value = false;
  }
};

onMounted(fetchSessions);
</script>
