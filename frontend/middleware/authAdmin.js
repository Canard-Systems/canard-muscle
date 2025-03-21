export default defineNuxtRouteMiddleware(async (to, from) => {
    const token = useCookie('token').value;

    if (!token) {
        return navigateTo('/login'); // Redirige vers la page de connexion si non connecté
    }

    try {
        const user = await $fetch('https://canardmuscleapi.antoninpamart.fr/api/me', {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Vérifier si l'utilisateur a le rôle d'admin
        if (!user.roles.includes('ROLE_SUPER_ADMIN')) {
            return navigateTo('/'); // Redirige vers l'accueil si non admin
        }
    } catch (err) {
        console.error(err);
        return navigateTo('/login'); // En cas d'erreur, redirige vers la connexion
    }
});
