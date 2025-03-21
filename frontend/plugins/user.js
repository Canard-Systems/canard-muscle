export default defineNuxtPlugin(async (nuxtApp) => {
    const token = useCookie('token').value;
    const user = useState('user', () => null);

    if (token && !user.value) {
        try {
            user.value = await $fetch('https://canardmuscleapi.antoninpamart.fr/api/me', {
                headers: {Authorization: `Bearer ${token}`},
            });
        } catch (err) {
            console.error('Erreur lors de la récupération des informations utilisateur :', err);
            user.value = null;
        }
    }

    nuxtApp.provide('user', user);
});
