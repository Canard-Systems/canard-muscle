<template>
  <v-container fluid class="min-h-screen neon-bg text-white py-8 px-4 rounded-lg">
    <!-- Header -->
    <v-row align="center" justify="space-between" class="mb-8">
      <v-col>
        <h1 class="text-4xl font-bold neon-title">Tableau de bord</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" @click="goToProfile" class="futuristic-btn">
          Profil
        </v-btn>
      </v-col>
    </v-row>

    <!-- Grid principal -->
    <v-row dense>
      <!-- Plans d'entraînement -->
      <v-col cols="12" md="6">
        <v-card class="neon-card p-4">
          <v-card-title class="text-2xl font-semibold neon-subtitle">
            Mes plans d'entraînement
          </v-card-title>
          <v-card-text>
            <PlanList />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Calendrier et séances programmées -->
      <v-col cols="12" md="6">
        <v-card class="neon-card p-4 mt-4 md:mt-0">
          <v-card-title class="text-2xl font-semibold neon-subtitle">
            Calendrier
          </v-card-title>
          <v-card-text>
            <!-- Calendrier -->
            <v-calendar
                v-model="selectedDate"
                :attributes="calendarAttributes"
                is-expanded
                @dayclick="onDayClick"
            />
            <div class="mt-4">
              <h3 class="text-xl font-medium glow-subtitle">
                Séances du jour ({{ formattedSelectedDate }})
              </h3>
              <ul class="space-y-1 mt-2">
                <li
                    v-for="sched in scheduledSessionsOfTheDay"
                    :key="sched.id"
                    class="flex items-center justify-between neon-list-item"
                >
                  <span>
                    {{ sched.session?.name || 'Séance sans nom' }} –
                    Plan: {{ sched.plan?.name || 'N/A' }}
                  </span>
                  <router-link
                      :to="`/session/${sched.session?.id}`"
                      class="text-blue-400 underline hover:text-blue-300 transition"
                  >
                    Voir détails
                  </router-link>
                </li>
                <li
                    v-if="scheduledSessionsOfTheDay.length === 0"
                    class="text-gray-300 italic"
                >
                  Aucune séance programmée ce jour.
                </li>
              </ul>
            </div>

            <div class="mt-4">
              <h3 class="text-xl font-medium glow-subtitle">
                Filtrer par plan
              </h3>
              <select
                  v-model="selectedPlan"
                  class="mt-2 p-1 rounded text-black w-full max-w-sm"
              >
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

            <v-btn
                class="mt-4 futuristic-btn"
                color="success"
                @click="showAddSessionDialog = true"
            >
              Programmer une séance
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Dernières séances -->
      <v-col cols="12" md="6">
        <SessionList />
      </v-col>

      <!-- Graphiques -->
      <v-col cols="12" md="6">
        <v-card class="neon-card p-4">
          <v-card-title class="text-2xl font-semibold neon-subtitle">
            Graphiques
          </v-card-title>
          <v-card-text
              class="h-48 flex items-center justify-center border border-dashed border-gray-400 rounded"
          >
            <p class="text-gray-300 italic">
              Graphiques en cours de développement...
            </p>
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
      <v-card class="neon-dialog bg-gray-800">
        <v-card-title class="text-2xl font-bold glow-subtitle">
          Programmer une séance
        </v-card-title>
        <v-card-text>
          <v-form ref="sessionForm">
            <v-select
                v-model="newScheduledSession.sessionId"
                :items="allSessions"
                :item-text="sessionLabel"
                item-value="id"
                label="Séance existante"
                required
                class="neon-input"
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
                class="neon-input mt-4"
            />
            <v-select
                v-else
                v-model="newScheduledSession.plan"
                :items="myPlans"
                item-text="name"
                item-value="id"
                label="Plan d'entraînement"
                required
                class="neon-input mt-4"
            />

            <v-text-field
                :value="formattedSelectedDate"
                label="Date programmée"
                disabled
                class="neon-input mt-4"
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

definePageMeta({ middleware: 'auth', layout: 'auth' });
useHead({
  title: 'Tableau de bord',
  meta: [
    { name: 'description', content: 'Tableau de bord de l\'application de fitness' }
  ]
});

const { $toast } = useNuxtApp();
const router = useRouter();
const token = useCookie('token').value;

// Indicateur chargement global
const loading = ref(false);

// 1) LISTE DES PLANS DE L'UTILISATEUR
const myPlans = ref([]);

// 2) LISTE DES SÉANCES MODÈLES (Session) => récupérées via /sessions/me
const allSessions = ref([]);

// 3) LISTE DES SÉANCES PROGRAMMÉES => /scheduled_sessions/me
const scheduledSessions = ref([]);

// Contrôle du calendrier
const selectedDate = ref(new Date());
const selectedPlan = ref('');

// Contrôle de la modale
const showAddSessionDialog = ref(false);
const newScheduledSession = ref({
  sessionId: '',
  plan: ''
});

// ========== FETCH DES DONNÉES ========== //
const fetchMyPlans = async () => {
  try {
    const res = await $fetch('http://localhost:8000/api/plans/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    myPlans.value = res.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement des plans.");
  }
};

// On ne récupère que les séances de l'utilisateur => /sessions/me
const fetchAllSessions = async () => {
  try {
    const res = await $fetch('http://localhost:8000/api/sessions/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    allSessions.value = res.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement de vos séances.");
  }
};

// Récupérer les séances programmées => /scheduled_sessions/me
const fetchScheduledSessions = async () => {
  try {
    const res = await $fetch('http://localhost:8000/api/scheduled_sessions/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    scheduledSessions.value = res['hydra:member'] || res.member || [];
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors du chargement des séances programmées.");
  }
};

// ========== LOGIQUE DU CALENDRIER ========== //
const scheduledSessionsOfTheDay = computed(() => {
  return scheduledSessions.value.filter((sched) => {
    if (!sched.scheduledAt) return false;
    const sDate = new Date(sched.scheduledAt);
    const selected = new Date(selectedDate.value);

    const mêmeJour = sDate.toDateString() === selected.toDateString();
    if (selectedPlan.value) {
      // Filtrer par plan ID
      if (!sched.plan) return false;
      return mêmeJour && sched.plan.id === Number(selectedPlan.value);
    }
    return mêmeJour;
  });
});

const formattedSelectedDate = computed(() => {
  return selectedDate.value.toLocaleDateString();
});

const calendarAttributes = ref([]);
watchEffect(() => {
  const attrs = [];
  // Surligner les séances programmées
  scheduledSessions.value.forEach((sched) => {
    if (!sched.scheduledAt) return;
    const date = new Date(sched.scheduledAt);
    attrs.push({
      key: `scheduled-${sched.id}`,
      highlight: { backgroundColor: '#cceeff' },
      dates: date
    });
  });

  // Surligner les jours d'entraînement des plans
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

const onDayClick = (day: any) => {
  selectedDate.value = day.date;
};

// ========== PROGRAMMER UNE SÉANCE ========== //
const sessionLabel = (session) => {
  return session.name || 'Séance sans nom';
};

const selectedSessionPlans = computed(() => {
  const sId = Number(newScheduledSession.value.sessionId);
  const found = allSessions.value.find((s) => s.id === sId);
  if (found && found.plans && found.plans.length > 0) {
    return found.plans;
  }
  return myPlans.value;
});

const createScheduledSession = async () => {
  if (!newScheduledSession.value.sessionId) {
    $toast.error("Sélectionne une séance existante.");
    return;
  }
  try {
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
    await fetchScheduledSessions();
  } catch (err) {
    console.error(err);
    $toast.error("Erreur lors de la programmation.");
  }
};

// Accès au profil
const goToProfile = () => router.push('/profile');

// Au montage, on charge tout
onMounted(async () => {
  loading.value = true;
  await Promise.all([
    fetchMyPlans(),
    fetchAllSessions(),
    fetchScheduledSessions()
  ]);
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
  text-shadow: 0 0 4px rgba(0,255,255,0.3),
  0 0 8px rgba(0,255,255,0.2);
}
.neon-subtitle {
  text-shadow: 0 0 3px rgba(0,255,255,0.4);
}
.neon-card {
  background: rgba(40, 40, 40, 0.6);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 0 10px rgba(0,255,255,0.05);
  transition: box-shadow 0.2s;
}
.neon-card:hover {
  box-shadow: 0 0 20px rgba(0,255,255,0.08);
}
.neon-list-item {
  transition: background-color 0.2s;
}
.neon-list-item:hover {
  background-color: rgba(255,255,255,0.05);
}
.glow-subtitle {
  text-shadow: 0 0 3px rgba(0,255,255,0.4);
}
.futuristic-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.2s ease;
}
.futuristic-btn:hover {
  transform: scale(1.05);
}
.neon-dialog {
  box-shadow: 0 0 20px rgba(0,255,255,0.05), inset 0 0 10px rgba(0,255,255,0.02);
}
.neon-input .v-field__input {
  background-color: #2a2a2a !important;
  color: #fff !important;
}
</style>
