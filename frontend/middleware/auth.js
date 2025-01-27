export default defineNuxtRouteMiddleware((to, from) => {
    const token = useCookie('token').value;

    if (!token) {
        return navigateTo('/login'); // Redirige vers la page de connexion si non connecté
    }
});
