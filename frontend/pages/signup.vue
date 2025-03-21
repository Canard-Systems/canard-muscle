<script setup>
import { useRouter } from 'vue-router';
import { useCookie } from '#app';
import { ref } from 'vue';

definePageMeta({ layout: 'auth' });
useHead({ title: 'Inscription' });

const router = useRouter();
const tokenCookie = useCookie('token');

const showPassword = ref(false);
const isLoading = ref(false);

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const passwordError = ref('');

// Validation de mot de passe
const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[\W_]/.test(password);

  if (password.length < minLength) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!hasUppercase) return "Le mot de passe doit contenir au moins une majuscule.";
  if (!hasLowercase) return "Le mot de passe doit contenir au moins une minuscule.";
  if (!hasNumber) return "Le mot de passe doit contenir au moins un chiffre.";
  if (!hasSpecialChar) return "Le mot de passe doit contenir au moins un caractère spécial.";
  return null;
};

const signup = async () => {
  if (isLoading.value) return;
  passwordError.value = validatePassword(password.value);
  if (passwordError.value) return;

  if (password.value !== confirmPassword.value) {
    error.value = "Les mots de passe ne correspondent pas.";
    return;
  }

  isLoading.value = true;

  try {
    const response = await $fetch('https://canardmuscleapi.antoninpamart.fr/api/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    });

    if (!response.token) {
      throw new Error("Échec de l'inscription.");
    }

    tokenCookie.value = response.token;
    const user = await getUserInfo();
    const userState = useState('user');
    userState.value = user;
    localStorage.setItem('user', JSON.stringify(user));

    if (user.roles.includes('ROLE_SUPER_ADMIN')) {
      await router.push('/admin');
    } else {
      await router.push('/');
    }
  } catch (err) {
    if (err.response && err.response.status === 400) {
      error.value = "Cet email est déjà utilisé.";
    } else {
      error.value = "L'inscription a échoué. Vérifiez vos informations.";
    }
  } finally {
    isLoading.value = false;
  }
};

const getUserInfo = async () => {
  try {
    return await $fetch('https://canardmuscleapi.antoninpamart.fr/api/me', {
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`
      }
    });
  } catch (err) {
    return null;
  }
};
</script>

<template>
  <div class="min-h-screen neon-bg flex items-center justify-center px-4">
    <div class="neon-card p-6 rounded-lg shadow-2xl w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 neon-title">Inscription</h1>

      <form @submit.prevent="signup" class="space-y-4">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium mb-1">Email</label>
          <input
              type="email"
              v-model="email"
              id="email"
              required
              class="neon-input w-full"
              placeholder="exemple@domaine.com"
          />
        </div>

        <!-- Mot de passe -->
        <div>
          <label for="password" class="block text-sm font-medium mb-1">Mot de passe</label>
          <div class="relative">
            <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                id="password"
                required
                class="neon-input w-full pr-12"
            />
            <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-2 flex items-center text-gray-300 hover:text-gray-100 text-sm"
            >
              <span v-if="!showPassword">Voir</span>
              <span v-else>Cacher</span>
            </button>
          </div>
          <p v-if="passwordError" class="text-red-400 neon-alert text-sm mt-1">
            {{ passwordError }}
          </p>
        </div>

        <!-- Confirmation mdp -->
        <div>
          <label
              for="confirm-password"
              class="block text-sm font-medium mb-1"
          >
            Confirmez le mot de passe
          </label>
          <input
              type="password"
              v-model="confirmPassword"
              id="confirm-password"
              required
              class="neon-input w-full"
          />
        </div>

        <!-- Bouton inscription -->
        <LoadingButton :isLoading="isLoading" type="submit" class="futuristic-btn w-full">
          S'inscrire
        </LoadingButton>
      </form>

      <p v-if="error" class="mt-4 text-red-400 neon-alert text-center">
        {{ error }}
      </p>

      <p class="mt-4 text-center text-gray-300">
        Déjà un compte ?
        <nuxt-link to="/login" class="text-blue-400 hover:underline">
          Connectez-vous
        </nuxt-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.neon-bg {
  background: radial-gradient(circle, #141414 0%, #0a0a0a 100%);
  box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.02);
}

.neon-card {
  background: rgba(40, 40, 40, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.05);
}

.neon-card:hover {
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.08);
}

.neon-title {
  text-shadow: 0 0 4px rgba(0, 255, 255, 0.3),
  0 0 8px rgba(0, 255, 255, 0.2);
}

.neon-input {
  background-color: #2a2a2a;
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  width: 100%;
  outline: none;
}

.neon-input:focus {
  outline: 2px solid rgba(0,255,255,0.3);
}

.futuristic-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.2s ease;
}

.futuristic-btn:hover {
  transform: scale(1.05);
}

.neon-alert {
  text-shadow: 0 0 3px rgba(255, 0, 0, 0.6);
}
</style>
