<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h1 class="text-2xl font-bold mb-6">Connexion</h1>
      <form @submit.prevent="login">
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" v-model="email" id="email" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
        </div>
        <div class="mb-4">
          <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input type="password" v-model="password" id="password" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
        </div>
        <LoadingButton :isLoading="isLoading" type="submit">Connexion</LoadingButton>
      </form>
      <p v-if="error" class="mt-4 text-red-600">{{ error }}</p>
      <p class="mt-4 text-center text-gray-600">
        Vous êtes nouveau ?
        <nuxt-link to="/signup" class="text-indigo-600 hover:underline">Inscrivez-vous</nuxt-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import {useCookie} from "#app";

definePageMeta(
  {
    layout: 'auth',
  }
)
useHead({
  title: 'Connexion',
})

const router = useRouter();
const tokenCookie = useCookie('token');

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const login = async () => {
  try {
    isLoading.value = true;
    const { token } = await $fetch('http://localhost:8000/api/login_check', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
      },
    });

    // Stocker le token dans un cookie
    tokenCookie.value = token;

    // Vérifier les informations de l'utilisateur
    const user = await getUserInfo();

    const userState = useState('user'); // Utilisation de la state globale
    userState.value = user;
    if (user.roles.includes('ROLE_SUPER_ADMIN')) {
      // getUserInfo in local storage
      localStorage.setItem('user', JSON.stringify(user));
      await router.push('/admin');
    } else {
      await router.push('/');
    }
  } catch (err) {
    error.value = 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
    console.error(err);
  } finally
  {
    isLoading.value = false;
  }
};


// Fonction pour obtenir les informations de l'utilisateur
const getUserInfo = async () => {
  return $fetch('http://localhost:8000/api/me', {
    headers: {Authorization: `Bearer ${tokenCookie.value}`},
  });
};
</script>
