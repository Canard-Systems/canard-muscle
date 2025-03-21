<script setup>
import { ref, onMounted } from 'vue';

definePageMeta({
  middleware: 'auth-admin',
  layout: 'admin',
});

// Liste des paramètres
const settings = ref([]);

// Charger les paramètres existants
const fetchSettings = async () => {
  try {
    const response = await $fetch('https://canardmuscleapi.antoninpamart.fr/api/settings', {
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`,
      },
    });
    settings.value = response.member || []; // Initialisation avec un tableau vide si la réponse est invalide
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error);
    settings.value = [];
  }
};

// Mettre à jour un paramètre
const updateSetting = async (setting) => {
  if (!setting) return; // Vérifie si le paramètre est défini
  try {
    await $fetch(`https://canardmuscleapi.antoninpamart.fr/api/settings/${setting.id}`, {
      method: 'PATCH',
      body: { value: setting.value },
      headers: {
        'Content-Type': 'application/merge-patch+json',
        Authorization: `Bearer ${useCookie('token').value}`,
      },
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du paramètre ${setting.settingKey}:`, error);
  }
};

// Charger les paramètres au montage
onMounted(async () => {
  await fetchSettings();
});
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Paramètres du site</h1>

    <div v-if="settings.length === 0" class="text-gray-500">
      Chargement des paramètres...
    </div>

    <div v-else>
      <!-- Apparence et Thèmes -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Apparence et Thèmes</h2>
        <div class="flex items-center justify-between mb-4">
          <span>Thème global</span>
          <select
              v-if="settings.some(s => s.settingKey === 'theme')"
              v-model="settings.find(s => s.settingKey === 'theme').value"
              class="border rounded p-2"
              @change="$event => {
              const setting = settings.find(s => s.settingKey === 'theme');
              if (setting) {
                setting.value = $event.target.value;
                updateSetting(setting);
              }
            }"
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="system">Système</option>
          </select>
        </div>
      </section>

      <!-- Fonctionnalités -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Fonctionnalités</h2>
        <div v-if="settings.some(s => s.settingKey === 'beta_features_enabled')" class="flex items-center justify-between mb-4">
          <span>Activer les fonctionnalités Beta</span>
          <label class="switch">
            <input
                type="checkbox"
                :checked="settings.find(s => s.settingKey === 'beta_features_enabled').value === 'true'"
                @change="$event => {
                const setting = settings.find(s => s.settingKey === 'beta_features_enabled');
                if (setting) {
                  setting.value = $event.target.checked.toString(); // Convertit en string
                  updateSetting(setting);
                }
              }"
            />
            <span class="slider"></span>
          </label>
        </div>

        <div v-if="settings.some(s => s.settingKey === 'maintenance_mode')" class="flex items-center justify-between mb-4">
          <span>Mode maintenance</span>
          <label class="switch">
            <input
                type="checkbox"
                :checked="settings.find(s => s.settingKey === 'maintenance_mode').value === 'true'"
                @change="$event => {
                const setting = settings.find(s => s.settingKey === 'maintenance_mode');
                if (setting) {
                  setting.value = $event.target.checked.toString(); // Convertit en string
                  updateSetting(setting);
                }
              }"
            />
            <span class="slider"></span>
          </label>
        </div>
      </section>

      <!-- Notifications -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Notifications</h2>
        <div v-if="settings.some(s => s.settingKey === 'email_notifications_enabled')" class="flex items-center justify-between mb-4">
          <span>Activer les notifications par email</span>
          <label class="switch">
            <input
                type="checkbox"
                :checked="settings.find(s => s.settingKey === 'email_notifications_enabled').value === 'true'"
                @change="$event => {
                const setting = settings.find(s => s.settingKey === 'email_notifications_enabled');
                if (setting) {
                  setting.value = $event.target.checked.toString(); // Convertit en string
                  updateSetting(setting);
                }
              }"
            />
            <span class="slider"></span>
          </label>
        </div>
        <div v-if="settings.some(s => s.settingKey === 'welcome_email_message')" class="flex items-center justify-between mb-4">
          <span>Message d'accueil</span>
          <textarea
              v-model="settings.find(s => s.settingKey === 'welcome_email_message').value"
              class="border rounded p-2 w-full"
              @change="$event => {
              const setting = settings.find(s => s.settingKey === 'welcome_email_message');
              if (setting) {
                setting.value = $event.target.value;
                updateSetting(setting);
              }
            }"
          ></textarea>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Style pour les toggles */
.switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4CAF50;
}

input:checked + .slider:before {
  transform: translateX(14px);
}
</style>
