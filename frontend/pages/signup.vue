<script setup>
import { useRouter } from 'vue-router';
import { useCookie } from '#app';
import { ref } from 'vue';

const showPassword = ref(false);
const isLoading = ref(false);

definePageMeta({
  layout: 'auth',
});

useHead({
  title: 'Inscription',
});

const router = useRouter();
const tokenCookie = useCookie('token');

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const passwordError = ref('');

// **Validation du mot de passe**
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

// **Fonction d'inscription**
const signup = async () => {
  if (isLoading.value) return; // Empêche de spammer le bouton

  passwordError.value = validatePassword(password.value);
  if (passwordError.value) return;

  if (password.value !== confirmPassword.value) {
    error.value = "Les mots de passe ne correspondent pas.";
    return;
  }

  isLoading.value = true; // Activation du loader

  try {
    const response = await $fetch('http://localhost:8000/api/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
      },
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
    isLoading.value = false; // Désactive le loader après la réponse de l'API
  }
};

// **Récupérer les infos utilisateur après inscription**
const getUserInfo = async () => {
  try {
    return await $fetch('http://localhost:8000/api/me', {
      headers: { Authorization: `Bearer ${tokenCookie.value}` },
    });
  } catch (err) {
    return null;
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h1 class="text-2xl font-bold mb-6">Inscription</h1>

      <form @submit.prevent="signup">
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
              type="email"
              v-model="email"
              id="email"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div class="mb-4">
          <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
          <div class="relative">
            <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                id="password"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
            />
            <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-3 flex items-center text-gray-500"
            >
              <span v-if="!showPassword">Voir</span>
              <span v-else>Cacher</span>
            </button>
          </div>
          <p v-if="passwordError" class="text-red-600 text-sm mt-1">{{ passwordError }}</p>
        </div>

        <div class="mb-4">
          <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirmez le mot de passe</label>
          <input
              type="password"
              v-model="confirmPassword"
              id="confirm-password"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <!-- Bouton désactivé pendant l'attente de la réponse -->
       <LoadingButton :isLoading="isLoading" type="submit">
          S'inscrire
        </LoadingButton>
      </form>

      <p v-if="error" class="mt-4 text-red-600">{{ error }}</p>

      <p class="mt-4 text-center text-gray-600">
        Déjà un compte ?
        <nuxt-link to="/login" class="text-indigo-600 hover:underline">Connectez-vous</nuxt-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
</style>
