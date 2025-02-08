export default defineNuxtRouteMiddleware((to, from) => {
    const token = useCookie('token').value;

    if (!token && to.path !== '/login') {
        return navigateTo('/login'); // Redirige vers la page de connexion si non connecté
    }
});


// todo:
//   Lorsque l'utilisateur se connecte. Vous renvoyez un jeton d'accès de courte durée (5 minutes sont préférables, pas 15), vous définissez également un cookie d'actualisation de longue durée (quelques semaines), vous stockez la valeur dans votre base de données backend, si l'utilisateur vous déconnecte, vous supprimez l'enregistrement de la base de données, vous pouvez également le déconnecter manuellement.
//   Ensuite, lorsque leur jeton expire, vous interceptez la requête 401 à l'aide d'un intercepteur, stockez la requête d'origine, envoyez une requête au point de terminaison d'actualisation avec votre cookie attaché, sur votre backend, vous vérifiez le cookie par rapport à la valeur de votre base de données, assurez-vous qu'il est toujours valide et c'est un utilisateur valide, etc., puis envoyez-leur un autre jeton d'accès.
//   Stockez ensuite le jeton d'accès et envoyez votre demande originale.
