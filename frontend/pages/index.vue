<template>
  <v-container fluid class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white py-8">
    <!-- Header -->
    <v-row align="center" justify="space-between" class="mb-8">
      <v-col>
        <h1 class="text-4xl font-bold">Tableau de bord</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" @click="goToProfile">Profil</v-btn>
      </v-col>
    </v-row>

    <!-- Grid principal -->
    <v-row dense>
      <!-- Mes plans d'entraînement -->
      <v-col cols="12" md="6">
        <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg">
          <v-card-title class="text-2xl font-semibold">Mes plans d'entraînement</v-card-title>
          <v-card-text>
            <PlanList
                :plans="myPlans"
                :loading="loading"
                @create-plan="createPlan"
                @edit-plan="editPlan"
                @navigate="goToPlan"
                @delete-plan="handleDeletePlan"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Calendrier et programmation des séances -->
      <v-col cols="12" md="6">
        <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
          <v-card-title class="text-2xl font-semibold">Calendrier</v-card-title>
          <v-card-text>
            <!-- v-calendar -->
            <v-calendar
                v-model="selectedDate"
                :attributes="calendarAttributes"
                is-expanded
                @dayclick="onDayClick"
            />
            <div class="mt-4">
              <h3 class="text-xl font-medium">Séances du jour ({{ formattedSelectedDate }})</h3>
              <ul>
                <!-- On boucle sur scheduledSessionsOfTheDay -->
                <li
                    v-for="sched in scheduledSessionsOfTheDay"
                    :key="sched.id"
                    class="flex items-center justify-between"
                >
                  <!-- sched.session => la séance associée (modèle) -->
                  <span>
                    {{ sched.session?.name || 'Séance sans nom' }}
                    - Plan: {{ sched.plan?.name || 'N/A' }}
                  </span>
                  <router-link
                      :to="`/session/${sched.session?.id}`"
                      class="text-blue-400 underline"
                  >
                    Voir détails
                  </router-link>
                </li>
                <li v-if="scheduledSessionsOfTheDay.length === 0">
                  Aucune séance programmée ce jour.
                </li>
              </ul>
            </div>

            <div class="mt-4">
              <h3 class="text-xl font-medium">Filtrer par plan</h3>
              <select v-model="selectedPlan" class="text-black p-1 rounded">
                <option value="">Tous les plans</option>
                <option
                    v-for="plan in myPlans"
                    :key="plan.id"
                    :value="plan.id"
                >
                  {{ plan.name }}
                </option>
              </select>
            </div>

            <v-btn class="mt-4" color="success" @click="showAddSessionDialog = true">
              Programmer une séance existante
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Dernières séances (ou autre) -->
      <v-col cols="12" md="6">
        <SessionList />
      </v-col>

      <!-- Graphiques -->
      <v-col cols="12" md="6">
        <v-card class="bg-opacity-10 backdrop-blur-sm rounded-lg">
          <v-card-title class="text-2xl font-semibold">Graphiques</v-card-title>
          <v-card-text class="h-48 flex items-center justify-center border border-dashed border-gray-400 rounded">
            <p>Graphiques en cours de développement...</p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Liste des exercices -->
      <v-col cols="12" md="6">
        <ExerciseList />
      </v-col>
    </v-row>

    <!-- Modale de programmation d'une séance existante -->
    <v-dialog v-model="showAddSessionDialog" max-width="500">
      <v-card>
        <v-card-title class="text-2xl">
          Programmer une séance
        </v-card-title>
        <v-card-text>
          <v-form ref="sessionForm">
            <!-- Choix de la séance « modèle » -->
            <v-select
                v-model="newScheduledSession.sessionId"
                :items="allSessions"
                :item-text="sessionLabel"
                item-value="id"
                label="Séance existante"
                required
            />
            <!-- Sélection du plan, si la séance en propose sinon mes plans -->
            <v-select
                v-if="selectedSessionPlans.length"
                v-model="newScheduledSession.plan"
                :items="selectedSessionPlans"
                item-text="name"
                item-value="id"
                label="Plan d'entraînement associé"
                required
            />
            <v-select
                v-else
                v-model="newScheduledSession.plan"
                :items="myPlans"
                item-text="name"
                item-value="id"
                label="Plan d'entraînement"
                required
            />

            <!-- Affichage de la date sélectionnée -->
            <v-text-field
                :value="formattedSelectedDate"
                label="Date programmée"
                disabled
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showAddSessionDialog = false">
            Annuler
          </v-btn>
          <v-btn color="success" @click="createScheduledSession">
            Programmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useRouter } from '#vue-router';
import { useNuxtApp } from '#app';

// Composants
import PlanList from '@/components/PlanList.vue';
import SessionList from '@/components/SessionList.vue';
import ExerciseList from '@/components/ExerciseList.vue';

definePageMeta({ middleware: 'auth' });
useHead({
  title: 'Tableau de bord',
  meta: [{ name: 'description', content: 'Tableau de bord de l\'application de fitness' }]
});

// Injections
const { $toast } = useNuxtApp();
const router = useRouter();
const token = useCookie('token').value;

const loading = ref(false);

// 1) LISTE DES PLANS DE L'UTILISATEUR
const myPlans = ref([]);

// 2) LISTE DES SÉANCES MODÈLES (Session)
const allSessions = ref([]);

// 3) LISTE DES SÉANCES PROGRAMMÉES (ScheduledSession)
const scheduledSessions = ref([]);

// Pour la modale
const showAddSessionDialog = ref(false);
const newScheduledSession = ref({
  sessionId: '', // ID de la Session « modèle »
  plan: ''       // ID du Plan
});

// Contrôle du calendrier
const selectedDate = ref(new Date());
const selectedPlan = ref('');

// ========== FETCH DES PLANS ========== //
const fetchPlans = async () => {
  loading.value = true;
  try {
    const res = await $fetch('http://localhost:8000/api/plans/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    myPlans.value = res.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement des plans.");
  } finally {
    loading.value = false;
  }
};

// ========== FETCH DES SÉANCES MODÈLES ========== //
const fetchAllSessions = async () => {
  try {
    // /api/sessions => toutes les sessions
    const res = await $fetch('http://localhost:8000/api/sessions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    allSessions.value = res.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement des séances.");
  }
};

// ========== FETCH DES SÉANCES PROGRAMMÉES ========== //
const fetchScheduledSessions = async () => {
  try {
    // /api/scheduled_sessions/me => la liste des programmations
    const res = await $fetch('http://localhost:8000/api/scheduled_sessions/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    scheduledSessions.value = res['hydra:member'] || res.member || [];
    // selon la config, l'un ou l'autre
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement des séances programmées.");
  }
};

// ========== SÉANCES DU JOUR (FILTRÉES) ========== //
const scheduledSessionsOfTheDay = computed(() => {
  return scheduledSessions.value.filter((sched) => {
    if (!sched.scheduledAt) return false;
    const sDate = new Date(sched.scheduledAt);
    const target = new Date(selectedDate.value);

    const mêmeJour = sDate.toDateString() === target.toDateString();

    // Filtre par plan ?
    if (selectedPlan.value) {
      // sched.plan existe ?
      if (!sched.plan) return false;
      return mêmeJour && sched.plan.id === Number(selectedPlan.value);
    }

    return mêmeJour;
  });
});

// ========== AFFICHER LA DATE SÉLECTIONNÉE ========== //
const formattedSelectedDate = computed(() => {
  return selectedDate.value.toLocaleDateString();
});

// ========== ATTRIBUTS DU CALENDRIER ========== //
// Sur le calendrier, on surligne les dates où l'utilisateur a des ScheduledSession.
const calendarAttributes = ref([]);
watchEffect(() => {
  const attrs = [];
  // On parcourt scheduledSessions, pour chaque date on met un highlight
  scheduledSessions.value.forEach((sched) => {
    if (!sched.scheduledAt) return;
    const date = new Date(sched.scheduledAt);
    attrs.push({
      key: `scheduled-${sched.id}`,
      highlight: { backgroundColor: '#cceeff' },
      dates: date
    });
  });
  // Optionnellement, on surligne les trainingDays des Plans comme avant.
  myPlans.value.forEach((plan) => {
    if (!selectedPlan.value || plan.id === Number(selectedPlan.value)) {
      if (plan.trainingDays) {
        const jours = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sunday: 0
        };
        plan.trainingDays.forEach((day) => {
          if (jours[day] !== undefined) {
            attrs.push({
              key: `plan-${plan.id}-${day}`,
              highlight: { backgroundColor: '#ffcccc' },
              dates: { daysOfWeek: [jours[day]] }
            });
          }
        });
      }
    }
  });
  calendarAttributes.value = attrs;
});

// ========== LIBELLÉ POUR LES SESSIONS « MODÈLES » (SELECT) ========== //
const sessionLabel = (session) => {
  // ex. session.name || session.summary
  // adapte selon ta structure. On suppose “name”
  return session.name || 'Séance sans nom';
};

// ========== PLANS ASSOCIES À LA SÉANCE SELECTIONNEE ? ========== //
const selectedSessionPlans = computed(() => {
  const sId = Number(newScheduledSession.value.sessionId);
  const found = allSessions.value.find((s) => s.id === sId);
  // si la Session renvoie un champ "plans", on les propose
  if (found && found.plans && found.plans.length > 0) {
    return found.plans;
  }
  // sinon on propose tous mes plans
  return myPlans.value;
});

// ========== CLIC SUR UN JOUR ========== //
const onDayClick = (day: any) => {
  selectedDate.value = day.date;
};

// ========== PROGRAMMER UNE SÉANCE ========== //
const createScheduledSession = async () => {
  if (!newScheduledSession.value.sessionId) {
    $toast.error("Sélectionne une séance existante.");
    return;
  }
  try {
    // date en ISO
    const dateString = selectedDate.value.toISOString();

    const body = {
      scheduledAt: dateString,
      session: `/api/sessions/${newScheduledSession.value.sessionId}`,
      plan: newScheduledSession.value.plan
          ? `/api/plans/${newScheduledSession.value.plan}`
          : null
    };

    await $fetch('http://localhost:8000/api/scheduled_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body
    });

    $toast.success("Séance programmée avec succès !");
    showAddSessionDialog.value = false;
    newScheduledSession.value = { sessionId: '', plan: '' };
    // On recharge la liste
    await fetchScheduledSessions();
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la programmation de la séance.");
  }
};

// ========== CRÉER UN PLAN ========== //
const createPlan = async () => {
  try {
    loading.value = true;
    const newPlan = await $fetch('http://localhost:8000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: {}
    });
    $toast.success("Plan créé avec succès !");
    await router.push(`/plan/edit/${newPlan.id}`);
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la création du plan.");
  } finally {
    loading.value = false;
  }
};

// ========== SUPPRIMER UN PLAN ========== //
const handleDeletePlan = async (planId: number) => {
  try {
    await $fetch(`http://localhost:8000/api/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    myPlans.value = myPlans.value.filter((plan) => plan.id !== planId);
    $toast.success('Plan supprimé avec succès !');
  } catch (error) {
    console.error(error);
    $toast.error("Erreur lors de la suppression du plan.");
  }
};

// ========== NAVIGATION ========== //
const goToPlan = (planId: number) => router.push(`/plan/${planId}`);
const editPlan = (planId: number) => router.push(`/plan/edit/${planId}`);
const goToProfile = () => router.push('/profile');

// ========== ONMOUNTED : ON CHARGE LES DONNÉES ========== //
onMounted(async () => {
  await fetchPlans();
  await fetchAllSessions();
  await fetchScheduledSessions();
});
</script>
