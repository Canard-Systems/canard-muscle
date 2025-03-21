<template>
  <div class="min-h-screen neon-bg flex items-center justify-center px-4">
    <div class="neon-card p-6 rounded-lg shadow-2xl w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 neon-title">Connexion</h1>

      <form @submit.prevent="login" class="space-y-4">
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
          <input
              type="password"
              v-model="password"
              id="password"
              required
              class="neon-input w-full"
              placeholder="********"
          />
        </div>

        <LoadingButton :isLoading="isLoading" type="submit" class="futuristic-btn w-full mt-2">
          Connexion
        </LoadingButton>
      </form>

      <p v-if="error" class="mt-4 text-red-400 neon-alert text-center">
        {{ error }}
      </p>

      <p class="mt-4 text-center text-gray-300">
        Vous êtes nouveau ?
        <nuxt-link to="/signup" class="text-blue-400 hover:underline">
          Inscrivez-vous
        </nuxt-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useCookie } from '#app';

definePageMeta({ layout: 'auth' });
useHead({ title: 'Connexion' });

const router = useRouter();
const tokenCookie = useCookie('token');

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const login = async () => {
  try {
    isLoading.value = true;
    const { token } = await $fetch('https://canardmuscleapi.antoninpamart.fr/api/login_check', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    });

    // Stocker le token dans un cookie
    tokenCookie.value = token;

    // Récupérer infos utilisateur
    const user = await getUserInfo();
    const userState = useState('user');
    userState.value = user;

    if (user.roles.includes('ROLE_SUPER_ADMIN')) {
      localStorage.setItem('user', JSON.stringify(user));
      await router.push('/admin');
    } else {
      await router.push('/');
    }
  } catch (err) {
    error.value = 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const getUserInfo = async () => {
  return $fetch('https://canardmuscleapi.antoninpamart.fr/api/me', {
    headers: {
      Authorization: `Bearer ${tokenCookie.value}`
    }
  });
};
</script>

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
  margin-top: 1rem;
  text-shadow: 0 0 3px rgba(255, 0, 0, 0.6);
}
</style>
